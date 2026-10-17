"""Fast deterministic model tests; actual Direct Mode and StudioNet evidence remain required."""
import importlib.util
import json
import pathlib
import sys
import types

import pytest


class Return:
    def __init__(self, calldata):
        self.calldata = calldata


class VM:
    Return = Return
    UserError = ValueError

    @staticmethod
    def run_nondet_unsafe(leader, validator):
        proposal = leader()
        if not validator(Return(proposal)):
            raise ValueError("Validator disagreement")
        return proposal


class Public:
    @staticmethod
    def write(fn):
        return fn

    @staticmethod
    def view(fn):
        return fn


def fake_judgment(prompt, response_format="json"):
    payload = json.loads(prompt.split("Frozen test and captured observations:\n")[-1])
    evidence = payload["evidence"]
    result = evidence["output"].get("milestone_status")
    open_challenge = evidence["state"].get("challenge_status")
    material = evidence["input"].get("material_challenge")
    if result == "COMPLETED" and open_challenge == "OPEN" and material is True:
        return {"verdict": "FAIL", "reason_code": "RULE_CONTRADICTION",
                "failed_criteria": ["main"], "evidence_refs": ["output.milestone_status", "state.challenge_status"],
                "summary": "An unresolved material challenge was open at completion."}
    if material is None:
        return {"verdict": "INCONCLUSIVE", "reason_code": "INSUFFICIENT_EVIDENCE",
                "failed_criteria": [], "evidence_refs": ["input.material_challenge"],
                "summary": "Materiality cannot be determined from the public observation."}
    return {"verdict": "PASS", "reason_code": "MEETS_REQUIREMENT",
            "failed_criteria": [], "evidence_refs": ["output.milestone_status", "state.challenge_status"],
            "summary": "The observation is consistent with the declared requirement."}


@pytest.fixture()
def runtime(monkeypatch):
    mock = types.ModuleType("genlayer")
    class GL:
        Contract = type("Contract", (), {})
        public = Public()
        vm = VM()
        message = types.SimpleNamespace(sender_address="0x" + "1" * 40)
        nondet = types.SimpleNamespace(exec_prompt=fake_judgment)
        @staticmethod
        def get_contract_at(address):
            return targets[address]
    targets = {}
    mock.gl = GL
    mock.TreeMap = dict
    mock.u64 = int
    mock.Address = str
    mock.__all__ = ["gl", "TreeMap", "u64", "Address"]
    monkeypatch.setitem(sys.modules, "genlayer", mock)
    path = pathlib.Path(__file__).resolve().parents[1] / "contracts" / "equivtest.py"
    spec = importlib.util.spec_from_file_location("equivtest_tested", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    class Target:
        def view(self):
            return self
        def get_equivtest_manifest(self):
            return json.dumps({"schema":"equivtest.case/1","version":"test-1"})
        def get_equivtest_case(self, observation):
            return json.dumps({
                "schema":"equivtest.case/1","observation_id":observation,
                "input":{"material_challenge":True},
                "output":{"milestone_status":"BLOCKED"},
                "state":{"challenge_status":"OPEN"}
            })
    targets["0x" + "2" * 40] = Target()
    return mod, GL, targets


def prepared(runtime):
    mod, gl, targets = runtime
    contract = mod.EquivTest()
    target = contract.register_target("0x" + "2" * 40, "Honest target")
    suite = contract.create_suite(target, "Integrity policy", "No completion during active challenge", "")
    case = contract.add_case(suite, "Material challenge",
                             "A material unresolved challenge must block completion.",
                             "When material challenge is open completion must not occur.", "CRITICAL")
    return contract, suite, case, gl, targets


def test_freeze_and_immutable_suite(runtime):
    c, suite, case, gl, _ = prepared(runtime)
    signature = c.freeze_suite(suite)
    assert len(signature) == 64
    assert json.loads(c.get_suite(suite))["digest"] == signature
    with pytest.raises(ValueError, match="Suite frozen"):
        c.add_case(suite, "Other", "Requirement", "Criteria", "HIGH")
    with pytest.raises(ValueError, match="empty or frozen"):
        c.freeze_suite(suite)


def test_authorisation_for_draft_mutations(runtime):
    c, suite, case, gl, _ = prepared(runtime)
    gl.message.sender_address = "0x" + "3" * 40
    with pytest.raises(ValueError, match="Only suite author"):
        c.add_case(suite, "Bypass", "Must not", "Must not", "LOW")
    with pytest.raises(ValueError, match="Only suite author"):
        c.freeze_suite(suite)


def test_consequential_pass_and_duplicate_guards(runtime):
    c, suite, case, gl, _ = prepared(runtime)
    c.freeze_suite(suite)
    run = c.open_run(suite)
    snap = c.capture_case(run, case, "obs-1")
    assert len(snap) == 64
    with pytest.raises(ValueError, match="already captured"):
        c.capture_case(run, case, "obs-1")
    assert c.evaluate_case(run, case) == "PASS"
    with pytest.raises(ValueError, match="Already evaluated"):
        c.evaluate_case(run, case)
    assert c.close_run(run) == "PASS"
    record = json.loads(c.get_conformance(run, suite, "T-1"))
    assert record["certified"] is True
    assert json.loads(c.get_conformance(run, suite, "T-999"))["certified"] is False
    assert json.loads(c.get_conformance(run, "S-999", "T-1"))["certified"] is False
    with pytest.raises(ValueError, match="Already closed"):
        c.close_run(run)


def test_duplicate_registration_is_idempotent_and_version_drift_is_rejected(runtime):
    c, _, _, gl, targets = prepared(runtime)
    assert c.register_target("0x" + "2" * 40, "Same target") == "T-1"
    assert c.target_count == 1
    targets["0x" + "2" * 40].get_equivtest_manifest = lambda: json.dumps({
        "schema": "equivtest.case/1", "version": "fixture-milestone-2"
    })
    with pytest.raises(ValueError, match="another version"):
        c.register_target("0x" + "2" * 40, "Changed target")
    assert c.target_count == 1


def test_capture_rechecks_declared_target_version(runtime):
    c, suite, case, gl, targets = prepared(runtime)
    c.freeze_suite(suite)
    run = c.open_run(suite)
    targets["0x" + "2" * 40].get_equivtest_manifest = lambda: json.dumps({
        "schema": "equivtest.case/1", "version": "fixture-milestone-2"
    })
    with pytest.raises(ValueError, match="Target version mismatch"):
        c.capture_case(run, case, "version-drift")
    assert c.get_snapshot(run, case) == ""


def test_evaluation_rejects_cross_bound_snapshot(runtime):
    c, suite, case, gl, _ = prepared(runtime)
    c.freeze_suite(suite)
    run = c.open_run(suite)
    c.capture_case(run, case, "bound-observation")
    location = run + "/" + case
    snapshot = json.loads(c.snapshots[location])
    snapshot["suite_id"] = "S-999"
    c.snapshots[location] = json.dumps(snapshot, sort_keys=True, separators=(",", ":"))
    with pytest.raises(ValueError, match="Snapshot binding mismatch"):
        c.evaluate_case(run, case)
    assert c.get_verdict(run, case) == ""


def test_same_target_observation_cannot_be_reused_by_a_recheck(runtime):
    c, suite, case, gl, _ = prepared(runtime)
    c.freeze_suite(suite)
    first = c.open_run(suite)
    c.capture_case(first, case, "immutable-observation")
    assert c.evaluate_case(first, case) == "PASS"
    assert c.close_run(first) == "PASS"
    second = c.open_recheck(first)
    with pytest.raises(ValueError, match="Observation already captured"):
        c.capture_case(second, case, "immutable-observation")


def test_external_json_decode_failures_are_recoverable(runtime):
    c, suite, case, gl, targets = prepared(runtime)
    c.freeze_suite(suite)
    run = c.open_run(suite)
    targets["0x" + "2" * 40].get_equivtest_case = lambda observation: "not-json"
    with pytest.raises(ValueError, match="Malformed observation"):
        c.capture_case(run, case, "malformed")
    assert c.get_snapshot(run, case) == ""


def test_semantic_contradiction_not_shape_only(runtime):
    c, suite, case, gl, targets = prepared(runtime)
    def bad_case(observation):
        return json.dumps({"schema":"equivtest.case/1","observation_id":observation,
             "input":{"material_challenge":True},
             "output":{"milestone_status":"COMPLETED"},
             "state":{"challenge_status":"OPEN"}})
    targets["0x" + "2" * 40].get_equivtest_case = bad_case
    c.freeze_suite(suite)
    run = c.open_run(suite)
    c.capture_case(run,case,"bad")
    assert c.evaluate_case(run,case) == "FAIL"
    assert c.close_run(run) == "FAIL"
    assert json.loads(c.get_conformance(run,suite,"T-1"))["certified"] is False


def test_missing_materiality_must_not_pass(runtime):
    c, suite, case, gl, targets = prepared(runtime)
    targets["0x" + "2" * 40].get_equivtest_case = lambda observation: json.dumps({
        "schema":"equivtest.case/1","observation_id":observation,
        "input":{},"output":{"milestone_status":"COMPLETED"},"state":{"challenge_status":"OPEN"}})
    c.freeze_suite(suite)
    run=c.open_run(suite)
    c.capture_case(run,case,"unknown")
    assert c.evaluate_case(run,case) == "INCONCLUSIVE"
    assert c.close_run(run) == "INCONCLUSIVE"


def test_failed_or_disputed_evaluation_writes_nothing(runtime):
    c, suite, case, gl, targets = prepared(runtime)
    c.freeze_suite(suite)
    run=c.open_run(suite)
    c.capture_case(run,case,"obs")
    gl.nondet.exec_prompt=lambda *a, **kw: {"verdict":"PASS","reason_code":"MEETS_REQUIREMENT","failed_criteria":[],"evidence_refs":[],"summary":""}
    with pytest.raises(ValueError, match="Validator disagreement"):
        c.evaluate_case(run,case)
    assert c.get_verdict(run,case) == ""
    with pytest.raises(ValueError, match="All cases"):
        c.close_run(run)


def test_malformed_observation_rejected(runtime):
    c, suite, case, gl, targets = prepared(runtime)
    c.freeze_suite(suite)
    run=c.open_run(suite)
    targets["0x" + "2" * 40].get_equivtest_case=lambda observation:json.dumps({"schema":"wrong","observation_id":observation})
    with pytest.raises(ValueError, match="schema mismatch"):
        c.capture_case(run,case,"bad")
    assert c.get_snapshot(run,case) == ""


def test_versioned_follow_up_without_mutation(runtime):
    c, suite, case, gl, _ = prepared(runtime)
    original=c.freeze_suite(suite)
    new=c.create_suite("T-1","Revised interpretation","A new frozen record",suite)
    c.add_case(new,"Revision","New exact rule","New objective criterion","HIGH")
    revised=c.freeze_suite(new)
    assert original != revised
    assert json.loads(c.get_suite(suite))["digest"] == original
    assert json.loads(c.get_suite(new))["supersedes"] == suite

def test_linked_recheck_preserves_original_verdict(runtime):
    c, suite, case, gl, targets = prepared(runtime)
    c.freeze_suite(suite)
    old = c.open_run(suite)
    c.capture_case(old, case, "good")
    assert c.evaluate_case(old, case) == "PASS"
    assert c.close_run(old) == "PASS"
    new = c.open_recheck(old)
    record = json.loads(c.get_run(new))
    assert record["recheck_of"] == old
    assert record["state"] == "OPEN"
    assert c.get_verdict(new, case) == ""
    assert json.loads(c.get_run(old))["outcome"] == "PASS"
    with pytest.raises(ValueError, match="Only completed"):
        c.open_recheck(new)

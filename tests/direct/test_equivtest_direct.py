import json

import pytest

SDK_VERSION = "v0.2.12"


def _seed_evaluation_state(contract, owner, evidence):
    target_address = "0x" + "2" * 40
    contract.targets["T-1"] = json.dumps({
        "id": "T-1", "address": target_address, "label": "Direct target",
        "version": "fixture-1", "schema": "equivtest.case/1", "registrant": str(owner),
    }, sort_keys=True, separators=(",", ":"))
    contract.suites["S-1"] = json.dumps({
        "id": "S-1", "target_id": "T-1", "title": "Direct suite",
        "description": "Bounded requirement", "owner": str(owner), "supersedes": "",
        "case_ids": ["C-1"], "frozen": True, "digest": "d" * 64,
    }, sort_keys=True, separators=(",", ":"))
    contract.cases["C-1"] = json.dumps({
        "id": "C-1", "suite_id": "S-1", "title": "Case",
        "requirement": "The observed state satisfies the requirement.",
        "criteria": "The state must be complete.", "severity": "HIGH",
    }, sort_keys=True, separators=(",", ":"))
    contract.runs["R-1"] = json.dumps({
        "id": "R-1", "suite_id": "S-1", "target_id": "T-1", "initiator": str(owner),
        "state": "OPEN", "total": 1, "pass": 0, "fail": 0, "inconclusive": 0,
        "outcome": "PENDING", "suite_digest": "d" * 64, "recheck_of": "",
    }, sort_keys=True, separators=(",", ":"))
    contract.snapshots["R-1/C-1"] = json.dumps({
        "run_id": "R-1", "case_id": "C-1", "suite_id": "S-1", "target_id": "T-1",
        "observation_id": "direct", "target_address": target_address,
        "target_version": "fixture-1", "suite_digest": "d" * 64, "evidence": evidence,
        "evidence_digest": "e" * 64, "captured_by": str(owner), "provenance": "TARGET_PUBLIC_VIEW",
    }, sort_keys=True, separators=(",", ":"))


@pytest.mark.parametrize("verdict,reason,expected", [
    ("PASS", "MEETS_REQUIREMENT", "PASS"),
    ("FAIL", "RULE_CONTRADICTION", "FAIL"),
    ("INCONCLUSIVE", "INSUFFICIENT_EVIDENCE", "INCONCLUSIVE"),
])
def test_direct_consensus_input_accepts_all_semantic_outcomes(
    direct_vm, direct_deploy, direct_alice, verdict, reason, expected
):
    contract = direct_deploy("contracts/equivtest.py", sdk_version=SDK_VERSION)
    direct_vm.sender = direct_alice
    _seed_evaluation_state(contract, direct_alice, {"output": {"state": "observed"}})
    direct_vm.mock_llm(
        r".*Frozen test and captured observations.*",
        json.dumps({
            "verdict": verdict,
            "reason_code": reason,
            "failed_criteria": ["main"] if verdict == "FAIL" else [],
            "evidence_refs": ["output.state"],
            "summary": "Direct Mode semantic outcome.",
        }),
    )

    assert contract.evaluate_case("R-1", "C-1") == expected


def test_direct_validator_rejects_malformed_leader_proposal(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/equivtest.py", sdk_version=SDK_VERSION)
    direct_vm.sender = direct_alice
    _seed_evaluation_state(contract, direct_alice, {"output": {"state": "observed"}})
    direct_vm.mock_llm(
        r".*Frozen test and captured observations.*",
        json.dumps({
            "verdict": "PASS", "reason_code": "MEETS_REQUIREMENT", "failed_criteria": [],
            "evidence_refs": ["output.state"], "summary": "Valid direct result.",
        }),
    )
    assert contract.evaluate_case("R-1", "C-1") == "PASS"
    assert direct_vm.run_validator(leader_result={
        "verdict": "PASS", "reason_code": "MEETS_REQUIREMENT",
        "failed_criteria": [], "evidence_refs": [], "summary": "",
    }) is False


def test_direct_deploy_and_freeze_lifecycle(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/equivtest.py", sdk_version=SDK_VERSION)
    direct_vm.sender = direct_alice

    suite_target = "0x" + "2" * 40
    # The target adapter is not needed for this state-only Direct Mode slice;
    # registration/capture are covered by Studio integration because they use
    # a real synchronous cross-contract view.
    contract.targets["T-1"] = json.dumps({
        "id": "T-1",
        "address": suite_target,
        "label": "Direct target",
        "version": "fixture-1",
        "schema": "equivtest.case/1",
        "registrant": str(direct_alice),
    }, sort_keys=True, separators=(",", ":"))
    contract.target_count += 1

    suite_id = contract.create_suite("T-1", "Direct suite", "A bounded requirement", "")
    case_id = contract.add_case(
        suite_id,
        "Case",
        "The observed state satisfies the requirement.",
        "The state must be complete.",
        "HIGH",
    )
    digest = contract.freeze_suite(suite_id)

    assert case_id == "C-1"
    assert len(digest) == 64
    assert json.loads(contract.get_suite(suite_id))["frozen"] is True

    with direct_vm.expect_revert("Suite frozen"):
        contract.add_case(suite_id, "Late", "No", "No", "LOW")


def test_direct_authorization_and_run_guards(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/equivtest.py", sdk_version=SDK_VERSION)
    direct_vm.sender = direct_alice
    contract.targets["T-1"] = json.dumps({
        "id": "T-1",
        "address": "0x" + "2" * 40,
        "label": "Direct target",
        "version": "fixture-1",
        "schema": "equivtest.case/1",
        "registrant": str(direct_alice),
    }, sort_keys=True, separators=(",", ":"))
    contract.target_count += 1
    suite_id = contract.create_suite("T-1", "Suite", "Description", "")
    contract.add_case(suite_id, "Case", "Requirement", "Criteria", "MEDIUM")

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only suite author"):
        contract.add_case(suite_id, "Bypass", "No", "No", "LOW")
    with direct_vm.expect_revert("Only suite author"):
        contract.freeze_suite(suite_id)

    direct_vm.sender = direct_alice
    contract.freeze_suite(suite_id)
    run_id = contract.open_run(suite_id)
    assert json.loads(contract.get_run(run_id))["state"] == "OPEN"
    with direct_vm.expect_revert("Capture evidence before evaluation"):
        contract.evaluate_case(run_id, "C-1")

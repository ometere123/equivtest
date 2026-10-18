"""Genuine GenLayer Direct Mode coverage.

Direct Mode proves contract execution and leader/validator hooks under the
pinned GenVM runner. It does not claim StudioNet network evidence; that is
captured by the integration evidence ledger.
"""
import json
import sys
from pathlib import Path

import pytest

SDK_VERSION = "v0.2.12"
REQUIREMENT_AUTHOR = "0x" + "3" * 40
TESTER = "0x" + "4" * 40


def address(value):
    if isinstance(value, bytes):
        return "0x" + value.hex()
    if hasattr(value, "as_hex"):
        return str(value.as_hex).lower()
    return str(value).lower()


def _evidence(status="CONTESTED", release_state="ACTIVATED", findings=1,
              scope="TEST_COHORT", data_exposure="NONE", rollback_ready=True):
    return {
        "schema": "equivtest.case/1", "observation_id": "direct",
        "provenance": "TARGET_PUBLIC_VIEW",
        "input": {"release_state": release_state, "unresolved_critical_findings": findings,
                  "affected_scope": scope, "data_exposure": data_exposure, "rollback_ready": rollback_ready},
        "output": {"activation": release_state, "exception_invoked": True},
        "state": {"reviewer_count": 2 if status == "CONTESTED" else 1,
                   "reviewer_disagreement": status == "CONTESTED", "dispute_complete": status == "CONTESTED",
                   "wallet_separation_only": True, "real_world_authority_attested": False},
        "observed": {"release_state": release_state, "unresolved_critical_findings": findings,
                     "affected_scope": scope, "data_exposure": data_exposure, "rollback_ready": rollback_ready,
                     "change_summary": "A bounded authorization change is being exercised against a defined cohort.",
                     "exception_basis": "The exception is limited to synthetic identities and rollback is ready.",
                     "release_note": "Public release observation."},
        "claims": {"reviewer_a": {"author": "0x" + "6" * 40, "position": "CONFORMING",
                                    "interpretation": "The bounded exception limits the change to synthetic identities and rollback is ready.",
                                    "cited_fact": "observed.exception_basis"},
                    "reviewer_b": {"author": "0x" + "7" * 40 if status == "CONTESTED" else "", "position": "NONCONFORMING" if status == "CONTESTED" else "",
                                    "interpretation": "The remaining finding may cross a production boundary and the exception may not apply." if status == "CONTESTED" else "",
                                    "cited_fact": "observed.affected_scope" if status == "CONTESTED" else ""}},
        "dispute": {
            "status": status,
            "author_a": "0x" + "6" * 40,
            "author_b": "0x" + "7" * 40 if status == "CONTESTED" else "",
            "position_a": "CONFORMING",
            "position_b": "NONCONFORMING" if status == "CONTESTED" else "",
            "cited_fact_a": "observed.exception_basis",
            "cited_fact_b": "observed.affected_scope" if status == "CONTESTED" else "",
        },
        "publisher": "0x" + "1" * 40,
    }


def _seed_evaluation_state(contract, owner, evidence):
    target_address = "0x" + "2" * 40
    contract.targets["T-1"] = json.dumps({
        "id": "T-1", "address": target_address, "label": "Direct target",
        "version": "fixture-adversarial-2", "schema": "equivtest.case/1", "registrant": "0x" + "1" * 40,
    }, sort_keys=True, separators=(",", ":"))
    contract.suites["S-1"] = json.dumps({
        "id": "S-1", "target_id": "T-1", "title": "Direct suite",
        "description": "Bounded requirement", "owner": "0x" + "2" * 40,
        "requirement_author": REQUIREMENT_AUTHOR, "supersedes": "",
        "case_ids": ["C-1"], "frozen": True, "digest": "d" * 64,
    }, sort_keys=True, separators=(",", ":"))
    contract.cases["C-1"] = json.dumps({
        "id": "C-1", "suite_id": "S-1", "title": "Case",
        "requirement": "The observed state satisfies the contested requirement.",
        "criteria": "The state must support the natural-language obligation.",
        "severity": "HIGH", "author": REQUIREMENT_AUTHOR,
    }, sort_keys=True, separators=(",", ":"))
    contract.runs["R-1"] = json.dumps({
        "id": "R-1", "suite_id": "S-1", "target_id": "T-1", "initiator": address(owner),
        "state": "OPEN", "total": 1, "pass": 0, "fail": 0, "inconclusive": 0,
        "outcome": "PENDING", "suite_digest": "d" * 64, "recheck_of": "", "independent": True,
    }, sort_keys=True, separators=(",", ":"))
    contract.snapshots["R-1/C-1"] = json.dumps({
        "run_id": "R-1", "case_id": "C-1", "suite_id": "S-1", "target_id": "T-1",
        "observation_id": "direct", "target_address": target_address,
        "target_version": "fixture-adversarial-2", "suite_digest": "d" * 64,
        "manifest_digest": "m" * 64, "evidence": evidence,
        "evidence_digest": "e" * 64, "captured_by": address(owner), "provenance": "TARGET_PUBLIC_VIEW",
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
    _seed_evaluation_state(contract, direct_alice, _evidence(
        status="INCOMPLETE" if verdict == "INCONCLUSIVE" else "CONTESTED",
        release_state="ACTIVATED" if verdict == "FAIL" else "DEFERRED",
        findings=1 if verdict == "FAIL" else 0,
    ))
    direct_vm.mock_llm(
        r".*Frozen test and captured observations.*",
        json.dumps({
            "verdict": verdict,
            "reason_code": reason,
            "failed_criteria": ["main"] if verdict == "FAIL" else [],
            "evidence_refs": ["dispute.position_a", "dispute.position_b", "claims.reviewer_a.interpretation", "claims.reviewer_b.interpretation", "observed.affected_scope", "observed.data_exposure", "observed.rollback_ready"],
            "summary": "Direct Mode semantic outcome.",
        }),
    )

    assert contract.evaluate_case("R-1", "C-1") == expected


def test_direct_validator_rejects_malformed_leader_proposal(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/equivtest.py", sdk_version=SDK_VERSION)
    direct_vm.sender = direct_alice
    _seed_evaluation_state(contract, direct_alice, _evidence())
    direct_vm.mock_llm(
        r".*Frozen test and captured observations.*",
        json.dumps({
            "verdict": "PASS", "reason_code": "MEETS_REQUIREMENT", "failed_criteria": [],
            "evidence_refs": ["dispute.position_a", "dispute.position_b", "claims.reviewer_a.interpretation", "claims.reviewer_b.interpretation", "observed.affected_scope", "observed.data_exposure", "observed.rollback_ready"], "summary": "Valid direct result.",
        }),
    )
    assert contract.evaluate_case("R-1", "C-1") == "PASS"
    assert direct_vm.run_validator(leader_result={
        "verdict": "PASS", "reason_code": "MEETS_REQUIREMENT",
        "failed_criteria": [], "evidence_refs": ["observed.not_real"], "summary": "",
    }) is False


def test_direct_deploy_and_freeze_lifecycle(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/equivtest.py", sdk_version=SDK_VERSION)
    direct_vm.sender = direct_alice

    suite_target = "0x" + "2" * 40
    contract.targets["T-1"] = json.dumps({
        "id": "T-1", "address": suite_target, "label": "Direct target",
        "version": "fixture-adversarial-2", "schema": "equivtest.case/1", "registrant": "0x" + "1" * 40,
    }, sort_keys=True, separators=(",", ":"))
    contract.target_count += 1
    suite_id = contract.create_suite("T-1", "Direct suite", "A bounded requirement", "", REQUIREMENT_AUTHOR)
    direct_vm.sender = REQUIREMENT_AUTHOR
    case_id = contract.add_case(
        suite_id, "Case", "The observed state satisfies the requirement.", "The state must be complete.", "HIGH"
    )
    direct_vm.sender = direct_alice
    digest = contract.freeze_suite(suite_id)

    assert case_id == "C-1"
    assert len(digest) == 64
    assert json.loads(contract.get_suite(suite_id))["frozen"] is True

    with direct_vm.expect_revert("Suite frozen"):
        direct_vm.sender = REQUIREMENT_AUTHOR
        contract.add_case(suite_id, "Late", "No", "No", "LOW")


def test_direct_consumer_constructor_and_record_storage(direct_deploy, direct_alice):
    sdk_root = next(Path.home().glob(".cache/gltest-direct/extracted/v0.2.12/**/genlayer"))
    sys.path.insert(0, str(sdk_root.parent))
    from genlayer.py.types import Address
    consumer = direct_deploy(
        "contracts/fixture_consumer.py", Address(direct_alice), "S-1", "T-1", sdk_version=SDK_VERSION
    )
    assert consumer.get_integration("missing") == ""


def test_direct_authorization_and_run_guards(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/equivtest.py", sdk_version=SDK_VERSION)
    direct_vm.sender = direct_alice
    contract.targets["T-1"] = json.dumps({
        "id": "T-1", "address": "0x" + "2" * 40, "label": "Direct target",
        "version": "fixture-adversarial-2", "schema": "equivtest.case/1", "registrant": address(direct_bob),
    }, sort_keys=True, separators=(",", ":"))
    contract.target_count += 1
    suite_id = contract.create_suite("T-1", "Suite", "Description", "", REQUIREMENT_AUTHOR)

    direct_vm.sender = REQUIREMENT_AUTHOR
    contract.add_case(suite_id, "Case", "Requirement", "Criteria", "MEDIUM")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only requirement author"):
        contract.add_case(suite_id, "Bypass", "No", "No", "LOW")
    with direct_vm.expect_revert("Only suite curator"):
        contract.freeze_suite(suite_id)

    direct_vm.sender = direct_alice
    contract.freeze_suite(suite_id)
    direct_vm.sender = TESTER
    run_id = contract.open_run(suite_id)
    assert json.loads(contract.get_run(run_id))["state"] == "OPEN"
    with direct_vm.expect_revert("Capture evidence before evaluation"):
        contract.evaluate_case(run_id, "C-1")


def test_direct_adversarial_fixture_records_two_conflicting_parties(direct_vm, direct_deploy, direct_alice, direct_bob):
    fixture = direct_deploy("contracts/fixture_adversarial.py", sdk_version=SDK_VERSION)
    direct_vm.sender = direct_alice
    fixture.publish_observation("release-1", "ACTIVATED", 1, "TEST_COHORT", "NONE", True,
                                "A bounded authorization change is exercised against synthetic identities.",
                                "The exception is limited to synthetic identities and rollback is ready.",
                                "The public release was activated for the test cohort.")
    direct_vm.sender = direct_bob
    fixture.submit_interpretation("release-1", "CONFORMING", "The test-only exception is valid because the affected scope is synthetic and rollback is ready.", "observed.exception_basis")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Developer cannot submit review"):
        fixture.submit_interpretation("release-1", "NONCONFORMING", "The unresolved finding blocks activation across the production authorization boundary.", "observed.affected_scope")
    # A third account supplies the opposing interpretation; the fixture never
    # lets one reviewer overwrite the first record.
    direct_vm.sender = bytes.fromhex("33" * 20)
    fixture.submit_interpretation("release-1", "NONCONFORMING", "The unresolved finding may cross the production authorization boundary.", "observed.affected_scope")
    record = json.loads(fixture.get_equivtest_case("release-1"))
    assert record["provenance"] == "TARGET_PUBLIC_VIEW"
    assert record["dispute"]["status"] == "CONTESTED"
    assert record["dispute"]["position_a"] != record["dispute"]["position_b"]

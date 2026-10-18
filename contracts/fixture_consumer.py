# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class ConformanceConsumer(gl.Contract):
    """Demonstrates consequential third-party gating; no custody."""
    registry: Address
    suite_id: str
    target_id: str
    records: TreeMap[str, str]

    def __init__(self, registry: Address, suite_id: str, target_id: str):
        self.registry = registry
        self.suite_id = suite_id
        self.target_id = target_id
        self.records = TreeMap()

    def _certify(self, run_id: str):
        raw = gl.get_contract_at(self.registry).view().get_conformance(
            run_id, self.suite_id, self.target_id
        )
        status = json.loads(raw)
        if status.get("certified") is not True:
            raise gl.vm.UserError("Uncertified conformance: " + str(status.get("reason", "UNKNOWN")))
        return status

    @gl.public.write
    def approve_integration(self, run_id: str) -> None:
        self._certify(run_id)
        self.records["approved:" + run_id] = "1"

    @gl.public.write
    def enable_integration(self, integration_id: str, run_id: str) -> str:
        if not (isinstance(integration_id, str) and 0 < len(integration_id.strip()) <= 80):
            raise gl.vm.UserError("Invalid integration id")
        status = self._certify(run_id)
        self.records["approved:" + run_id] = "1"
        self.records["integration:" + integration_id.strip()] = json.dumps({
            "integration_id": integration_id.strip(), "run_id": run_id,
            "suite_id": self.suite_id, "target_id": self.target_id,
            "conformance_digest": status.get("suite_digest", ""), "enabled": True
        }, sort_keys=True)
        return "ENABLED"

    @gl.public.view
    def is_approved(self, run_id: str) -> bool:
        return self.records.get("approved:" + run_id, "") == "1"

    @gl.public.view
    def get_integration(self, integration_id: str) -> str:
        return self.records.get("integration:" + integration_id, "")

# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class ConformanceConsumer(gl.Contract):
    """Demonstrates consequential third-party gating; no custody."""
    registry: Address
    suite_id: str
    target_id: str
    authorized: TreeMap[str, bool]

    def __init__(self, registry: Address, suite_id: str, target_id: str):
        self.registry = registry
        self.suite_id = suite_id
        self.target_id = target_id
        self.authorized = TreeMap()

    @gl.public.write
    def approve_integration(self, run_id: str) -> None:
        raw = gl.get_contract_at(self.registry).view().get_conformance(
            run_id, self.suite_id, self.target_id
        )
        status = json.loads(raw)
        if status.get("certified") is not True:
            raise gl.vm.UserError("Uncertified conformance")
        self.authorized[run_id] = True

    @gl.public.view
    def is_approved(self, run_id: str) -> bool:
        return self.authorized.get(run_id, False)

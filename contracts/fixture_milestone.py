# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class MilestoneFixture(gl.Contract):
    """Opt-in target with honest public observations. No money or token movement."""
    observations: TreeMap[str, str]
    owner: Address

    def __init__(self):
        self.observations = TreeMap()
        self.owner = gl.message.sender_address

    @gl.public.write
    def exercise(self, observation_id: str, material_challenge: bool, unresolved: bool, completed: bool) -> None:
        if not (0 < len(observation_id) <= 80):
            raise gl.vm.UserError("Invalid observation id")
        if self.observations.get(observation_id, ""):
            raise gl.vm.UserError("Observation is immutable")
        self.observations[observation_id] = json.dumps({
            "schema": "equivtest.case/1",
            "observation_id": observation_id,
            "input": {"material_challenge": material_challenge, "unresolved": unresolved},
            "output": {"milestone_status": "COMPLETED" if completed else "BLOCKED"},
            "state": {"challenge_status": "OPEN" if unresolved else "RESOLVED"},
        }, sort_keys=True)

    @gl.public.view
    def get_equivtest_manifest(self) -> str:
        return json.dumps({"schema": "equivtest.case/1", "version": "fixture-milestone-1"}, sort_keys=True)

    @gl.public.view
    def get_equivtest_case(self, observation_id: str) -> str:
        value = self.observations.get(observation_id, "")
        if not value:
            raise gl.vm.UserError("Observation not found")
        return value

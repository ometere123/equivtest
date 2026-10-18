# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def require(condition, message):
    if not condition:
        raise gl.vm.UserError(message)


def limited(value, maximum, label):
    require(isinstance(value, str) and 0 < len(value.strip()) <= maximum, "Invalid " + label)
    return value.strip()


def address_text(value):
    if isinstance(value, bytes):
        return "0x" + value.hex()
    if hasattr(value, "as_hex"):
        return str(value.as_hex).lower()
    text = str(value).lower()
    if text.startswith("addr#"):
        return "0x" + text[5:]
    return text


class AdversarialReleaseFixture(gl.Contract):
    """A bounded target whose public state and opposing interpretations are inspectable."""
    observations: TreeMap[str, str]
    owner: str

    def __init__(self):
        self.observations = TreeMap()
        self.owner = address_text(gl.message.sender_address)

    @gl.public.write
    def publish_observation(self, observation_id: str, release_state: str, unresolved_critical_findings: u64, release_note: str) -> None:
        observation_id = limited(observation_id, 80, "observation id")
        release_state = limited(release_state, 24, "release state")
        release_note = limited(release_note, 240, "release note")
        require(release_state in ("ACTIVATED", "DEFERRED", "ROLLED_BACK"), "Invalid release state")
        require(not self.observations.get(observation_id, ""), "Observation is immutable")
        self.observations[observation_id] = encoded({
            "observation_id": observation_id,
            "publisher": address_text(gl.message.sender_address),
            "release_state": release_state,
            "unresolved_critical_findings": unresolved_critical_findings,
            "release_note": release_note,
            "review_a": {},
            "review_b": {},
        })

    @gl.public.write
    def submit_interpretation(self, observation_id: str, position: str, interpretation: str, cited_fact: str) -> None:
        raw = self.observations.get(observation_id, "")
        require(bool(raw), "Observation not found")
        record = json.loads(raw)
        require(address_text(gl.message.sender_address) != record["publisher"], "Developer cannot submit review")
        position = limited(position, 24, "position")
        interpretation = limited(interpretation, 240, "interpretation")
        cited_fact = limited(cited_fact, 96, "cited fact")
        require(position in ("CONFORMING", "NONCONFORMING", "UNCERTAIN"), "Invalid position")
        review = {
            "author": address_text(gl.message.sender_address),
            "position": position,
            "interpretation": interpretation,
            "cited_fact": cited_fact,
        }
        if not record["review_a"]:
            record["review_a"] = review
        else:
            require(not record["review_b"], "Two reviews already recorded")
            require(record["review_a"]["author"] != review["author"], "Reviewer already submitted")
            record["review_b"] = review
        self.observations[observation_id] = encoded(record)

    @gl.public.view
    def get_equivtest_manifest(self) -> str:
        return encoded({"schema": "equivtest.case/1", "version": "fixture-adversarial-1"})

    @gl.public.view
    def get_equivtest_case(self, observation_id: str) -> str:
        raw = self.observations.get(observation_id, "")
        require(bool(raw), "Observation not found")
        record = json.loads(raw)
        review_a = record["review_a"]
        review_b = record["review_b"]
        status = "CONTESTED" if review_a and review_b and review_a["position"] != review_b["position"] else "INCOMPLETE"
        return encoded({
            "schema": "equivtest.case/1",
            "observation_id": observation_id,
            "provenance": "TARGET_PUBLIC_VIEW",
            "input": {
                "release_state": record["release_state"],
                "unresolved_critical_findings": record["unresolved_critical_findings"],
            },
            "output": {"activation": record["release_state"]},
            "state": {
                "reviewer_count": (1 if review_a else 0) + (1 if review_b else 0),
                "reviewer_disagreement": status == "CONTESTED",
            },
            "observed": {
                "release_state": record["release_state"],
                "unresolved_critical_findings": record["unresolved_critical_findings"],
                "release_note": record["release_note"],
            },
            "claims": {
                "reviewer_a": review_a if review_a else {"author": "", "position": "", "interpretation": "", "cited_fact": ""},
                "reviewer_b": review_b if review_b else {"author": "", "position": "", "interpretation": "", "cited_fact": ""},
            },
            "dispute": {
                "status": status,
                "author_a": review_a.get("author", "") if review_a else "",
                "author_b": review_b.get("author", "") if review_b else "",
                "position_a": review_a.get("position", "") if review_a else "",
                "position_b": review_b.get("position", "") if review_b else "",
            },
        })

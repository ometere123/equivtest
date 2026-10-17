# EquivTest

Consensus-backed semantic conformance testing for opt-in GenLayer Intelligent Contracts.

**Status:** Source implementation; not yet deployed or live-evidence certified. No transaction or security claim should be inferred from this repository alone.

## Product boundary

- StudioNet chain ID **61999**; `https://studio.genlayer.com/api`.
- One authoritative `contracts/equivtest.py` contract. Two small testing fixtures demonstrate an actual target and a consequential consumer.
- Frontend: Next.js App Router, TypeScript, GenLayerJS, injected EIP-1193 wallet.
- No backend authority, database, Worker, custody, token movement, private service key or central adjudicator.
- A passing run certifies specific frozen requirements against captured public target evidence, **not** all contract behaviour, ownership or real-world truth.
- Test suite versioning is internal record immutability, not a phased product roadmap.
- Public registrations identify a registrant but do not authenticate ownership of third-party contracts.

## Source layout

`contracts/equivtest.py` — target registration, bounded suite authoring, immutable freezes, live target reads, consensus adjudication, result registry.

`contracts/fixture_milestone.py` — real target adapter exercised by independent wallets.

`contracts/fixture_consumer.py` — separate test-only integrating contract that rejects uncertified run/suite/target tuples.

`frontend/` — seven working routes: landing, dashboard, projects, suites, runner, results, registry.

`tests/` — deterministic contract-state tests; browser smoke tests and TypeScript decoder tests.

## Environment

Use repository-local `genlayer@0.39.1`, `genvm-linter==0.11.0` and GenLayer StudioNet 61999 only.

```sh
npm install
python -m pip install pytest genvm-linter==0.11.0
genvm-lint check contracts/equivtest.py
pytest -q tests/test_contract_state.py
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_EQUIVTEST_ADDRESS` only after deploying and verifying the EquivTest source against StudioNet. Target fixture address is entered by the user through the Projects screen. Run IDs are global and must be selected from a verified on-chain read instead of guessed from a transaction hash.

**Security:** A target's view proves the bytes returned by its contract, not whether an observation corresponds to a truthful off-chain fact. Returned content is treated as untrusted data. The validator re-evaluates the same frozen evidence rather than only validating a JSON schema.

**Unverified prerequisites:** Actual SDK/runner compatibility, Direct Mode tests using the real GenLayer SDK, multi-wallet end-to-end proofs, post-finalization receipt validation, lockfiles and deployed source matching remain final Codex closeout tasks. No 5/5/5/5 review score is claimed.

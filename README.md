# EquivTest

Consensus-backed semantic conformance testing for opt-in GenLayer Intelligent Contracts.

EquivTest records an immutable, bounded assessment of a target contract’s declared public evidence interface. A certified result means that a frozen requirement was judged against a specific captured observation and reached the required GenLayer consensus outcome. It does not prove off-chain truth, all target behavior, ownership, safety, or future behavior.

Repository: <https://github.com/ometere123/equivtest>

## Locked scope

- GenLayer StudioNet only: chain ID `61999`, RPC `https://studio.genlayer.com/api`.
- One authoritative production contract: `contracts/equivtest.py`.
- Two opt-in demonstration contracts: `fixture_milestone.py` and `fixture_consumer.py`.
- Next.js App Router, TypeScript, and Tailwind CSS.
- Injected EIP-1193 browser wallets only; no server signer, database, backend authority, Worker, custody, token movement, escrow, staking, or payments.
- Seven frontend routes: landing, dashboard, project registration, suite builder, runner, results/evidence, and public registry.
- Frontend deployment is manual. GitHub Actions does not deploy to Vercel.

## Architecture

```text
Injected EIP-1193 wallet
          │ signs ordinary GenLayer fee transactions
          ▼
Next.js browser frontend ───────► StudioNet 61999 RPC
          │                              │
          │ public reads                  │ contract execution + consensus
          ▼                              ▼
  EquivTest registry ◄──── synchronous public view ─── Target adapter
          │
          ├─ frozen suites and case requirements
          ├─ target-bound captured observations
          ├─ consensus verdicts: PASS / FAIL / INCONCLUSIVE
          └─ exact conformance lookup for run + suite + target
                                      │
                                      ▼
                         ConformanceConsumer fixture
                         accepts only a correctly bound PASS
```

Cross-contract target reads happen in ordinary public execution, outside nondeterministic adjudication. The target view proves only the bytes returned by that target contract. The Equivalence Principle then independently re-examines the frozen requirement, criteria, and captured evidence through leader/validator consensus.

## Contract method map

`EquivTest` has nine writes and eight views:

| Lifecycle | Write | Read |
| --- | --- | --- |
| Target | `register_target` | `get_target` |
| Suite | `create_suite`, `add_case`, `freeze_suite` | `get_suite`, `get_case` |
| Run | `open_run`, `open_recheck` | `get_run` |
| Evidence | `capture_case` | `get_snapshot` |
| Adjudication | `evaluate_case`, `close_run` | `get_verdict` |
| Registry | — | `get_counts`, `get_conformance` |

The two fixtures are intentionally separate from the registry’s production role. `MilestoneFixture` supplies honest, bounded adapter observations. `ConformanceConsumer` demonstrates an independent integration that checks the exact run, suite, target, frozen digest, and PASS outcome before authorizing its own state change.

## End-to-end lifecycle

1. A registrant supplies a target address. EquivTest synchronously verifies the target manifest schema and declared version.
2. The registrant creates a suite and adds at most twelve bounded semantic cases.
3. The suite author freezes the suite. Its canonical case material is hashed; the suite cannot be edited afterward.
4. An independent wallet opens a run. The run stores the suite, target, and frozen digest bindings.
5. For each case, EquivTest rechecks the target manifest, reads the target’s public evidence adapter, validates schema and observation identity, bounds the serialized evidence, and stores a digest-bound snapshot.
6. The case is evaluated through GenLayer leader/validator consensus. The validator independently checks the decision-bearing verdict fields against its own adjudication.
7. All cases must have verdicts before the run can close. The outcome is PASS, FAIL, or INCONCLUSIVE.
8. `get_conformance` returns certified only for a closed PASS whose run, suite, target, and suite digest match exactly.
9. `open_recheck` creates a new run and preserves the old assessment unchanged.

## Public evidence adapter

A compatible target exposes:

```python
get_equivtest_manifest() -> str
# {"schema":"equivtest.case/1", "version":"stable-target-version"}

get_equivtest_case(observation_id: str) -> str
# {
#   "schema":"equivtest.case/1",
#   "observation_id":"...",
#   "input": {},
#   "output": {},
#   "state": {}
# }
```

The manifest is bounded to 2,048 bytes and observations to 6,000 bytes before decoding. Input, output, and state must be JSON objects. Observation IDs are bounded and must echo exactly. Adapter content is untrusted data: prompt-injection text is data, not instructions, and a target’s assertions about external reality are not upgraded into provenance.

## Storage and versioning rules

All registry records are stored in `TreeMap[str, str]` values containing canonical JSON. Suite digests cover the suite and ordered case records. Runs store the suite digest and target binding. Snapshots store run, case, suite, target, address, version, evidence digest, capture signer, and `TARGET_PUBLIC_VIEW` provenance. Target address plus observation ID cannot be captured twice, including in a recheck. Historical suites, snapshots, verdicts, and closed runs are not overwritten. A revised interpretation is a new suite linked by `supersedes`.

## Security and threat model

The registry protects against unauthorized suite mutation, post-freeze edits, duplicate target registration with version drift, stale target versions, cross-suite/cross-run evidence substitution, malformed or oversized adapter/model JSON, missing evidence, unsupported verdict codes, misleading PASS/FAIL shapes, prompt injection, and mismatched public conformance queries. Failed consensus writes no verdict, and a run cannot close without a verdict for every case.

Trust boundaries remain explicit:

- The target controls the bytes returned by its own public view.
- The registry does not attest external APIs, physical events, ownership, or target honesty.
- GenLayer consensus evaluates the supplied evidence and frozen rule; it is not an administrator override.
- Browser wallets control signing and may disconnect, change account, change chain, or deliver an uncertain receipt.
- The frontend treats `FINALIZED` as insufficient until the execution result is `FINISHED_WITH_RETURN`; it keeps uncertain transactions resumable and requires state readback in the action flow.

## Frontend and wallet behavior

The frontend uses `genlayer-js@1.1.8` with the `studionet` chain configuration. On connection it requests accounts, verifies or adds StudioNet 61999, and rechecks the chain. Account and chain changes clear stale wallet state. Writes reject a second submission while an earlier finalized-but-unverified transaction remains pending. A successful write requires a verified `FINISHED_WITH_RETURN` execution result; callers then read the affected state back from StudioNet.

For local use:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix frontend --ignore-scripts --no-audit --no-fund
Copy-Item frontend/.env.example frontend/.env.local
# Set NEXT_PUBLIC_EQUIVTEST_ADDRESS only after source parity is verified.
npm run typecheck --prefix frontend
npm run test --prefix frontend
npm run build --prefix frontend
```

The seven routes are public for reads. Writes require an injected wallet on StudioNet with ordinary transaction-fee balance. Never put a private key or server signer in frontend environment variables.

## Verification status at this checkout

The source and test changes in this checkout were verified locally as follows:

| Check | Result |
| --- | --- |
| Python deterministic state/adversarial tests | 14 passed |
| Genuine GenLayer Direct Mode tests | 6 passed in WSL with `genlayer-test==0.29.2` |
| GenVM lint + semantic validation | all 3 contracts passed with `genvm-linter==0.11.0`, GenVM artifact `v0.2.12` |
| Frontend TypeScript | passed |
| Frontend unit tests | 4 passed |
| Next production build | passed; all seven routes generated |
| Playwright desktop/mobile smoke tests | 4 passed |
| npm production dependency audit | root 0 vulnerabilities; frontend 0 vulnerabilities |
| GitHub Actions final pushed run | 2 jobs passed: `python-and-contract`, `frontend` |

The Windows Direct Mode run is not counted as contract evidence because `genlayer-test` 0.29.2 currently fails in its loader while deleting an open temporary file (`PermissionError`, Windows file-lock behavior). The same six tests pass under WSL. Live StudioNet deployment, live four-wallet browser operations, and production Vercel deployment remain separate evidence gates until authorized deployment credentials and a verified contract address are available; see `docs/evidence-ledger.md`.

## Deployment evidence

The intended contract source hashes currently are:

| File | SHA-256 |
| --- | --- |
| `contracts/equivtest.py` | `FEEC8E28BE125C0FD3F83846935DA4B0DD64C1EBB6475988359A3ABDC11841FC` |
| `contracts/fixture_milestone.py` | `10EFE6FD25FD4F19B478A52C33B50CDA1D90D656EC9C0E653BAE9AF4D97D58FB` |
| `contracts/fixture_consumer.py` | `2F3F91636F82C97ED7987A9EFB540A0C9003416CDCFAEF289518EF5BCBAF4CE1` |

`docs/deployment-manifest.json` records the current deployment gate status and the exact network/toolchain target. It must be updated with addresses, transaction hashes, execution results, explorer links, and deployed-source byte comparison only after a real StudioNet deployment confirms them. An explorer page by itself is not source-parity evidence.

## Failure recovery

- If the wallet changes account or chain, reconnect and re-read the displayed contract state.
- If a write is finalized but its execution result is unavailable or unsuccessful, do not resubmit immediately. Use the pending recovery control to inspect the same hash; the client blocks duplicate writes until that state is resolved.
- If consensus fails, the transaction is not a successful certification. Inspect the receipt and leave the run open for a deliberate retry or new recheck.
- If a registry query is uncertain, require exact run, suite, target, and digest matches; never infer a run ID from a transaction hash.

## CI

GitHub Actions installs the root CLI lockfile and frontend lockfile with `npm ci`, checks `genlayer@0.39.1`, runs deterministic and Direct Mode tests, validates all contracts with `genvm-linter==0.11.0`, and runs typecheck, unit, build, and Playwright checks. The workflow is intentionally not a Vercel deployment workflow.

The final verified CI run is [39070406109](https://github.com/ometere123/equivtest/actions/runs/39070406109). The closeout report supplies the final commit compare link and separates these automated results from the still-blocked live deployment evidence.

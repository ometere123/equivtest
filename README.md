# EquivTest

EquivTest is a consensus-backed semantic conformance registry for opt-in GenLayer Intelligent Contracts. It evaluates a frozen natural-language requirement against a bounded public observation and a deliberately contested interpretation record. A certification is an immutable, exact-bound PASS result; it is not a claim that a target is honest, safe, correct in every situation, or truthful about the off-chain world.

Repository: <https://github.com/ometere123/equivtest>

## Reviewer-fit argument

The adversarial fixture exposes a release state and unresolved-finding count, while two independent parties submit conflicting natural-language interpretations of the same frozen requirement. The target observation is read synchronously by the registry; the party statements remain unverified claims. GenLayer leader/validator consensus must resolve whether the observed state satisfies the requirement, reject a contradictory state, or return INCONCLUSIVE when the dispute is incomplete or ambiguous. A conventional deterministic contract could validate schemas and enum membership, but could not resolve the substantive language dispute. A centralized AI response would also remove the independent validator reassessment that makes the consensus result meaningful.

The separate consumer fixture demonstrates indispensability: it enables an integration only after `get_conformance` returns a closed, exact-bound PASS. FAIL and INCONCLUSIVE results are rejected and do not authorize the consequential state change.

## Locked scope

- GenLayer StudioNet only: chain ID `61999`, RPC `https://studio.genlayer.com/api`.
- One authoritative production contract: `contracts/equivtest.py`.
- Demonstration-only contracts: `fixture_adversarial.py`, `fixture_milestone.py`, and `fixture_consumer.py`.
- Next.js App Router, TypeScript, and Tailwind CSS.
- Injected EIP-1193 wallets only. There is no server signer, backend authority, database, Worker, custody, token movement, escrow, staking, or application payment.
- Seven frontend routes: landing, dashboard, project registration, suite builder, runner, results/evidence, and public registry.
- Vercel deployment is manual. GitHub Actions does not deploy to Vercel.

## Architecture

```text
Injected EIP-1193 wallet
          | ordinary GenLayer fee transactions
          v
Next.js browser frontend --------------------> StudioNet 61999 RPC
          |                                         |
          | public reads                             | execution + consensus
          v                                         v
     EquivTest registry <---- synchronous public view ---- Target adapter
          |
          +-- immutable target, suite, case, snapshot and verdict records
          +-- leader/validator semantic adjudication: PASS / FAIL / INCONCLUSIVE
          +-- exact run + suite + target + digest conformance query
          |
          v
     ConformanceConsumer: enable only for an exact certified PASS
```

Target cross-calls occur in ordinary public execution before nondeterministic adjudication. The returned bytes are evidence of the target's public view, not independent proof of external reality. The Equivalence Principle then independently re-examines the frozen requirement, criteria, decision-critical observed fields, dispute, conclusions, failed criteria and concrete evidence paths.

## Contract and frontend mapping

`EquivTest` exposes 17 methods: 9 writes and 8 views.

| Lifecycle | Writes | Views |
| --- | --- | --- |
| Target | `register_target` | `get_target` |
| Suite | `create_suite`, `add_case`, `freeze_suite` | `get_suite`, `get_case` |
| Run | `open_run`, `open_recheck` | `get_run` |
| Evidence | `capture_case` | `get_snapshot` |
| Adjudication | `evaluate_case`, `close_run` | `get_verdict` |
| Registry | — | `get_counts`, `get_conformance` |

The adversarial fixture publishes one immutable observation per ID and accepts at most two independent reviewer interpretations. The consumer binds its constructor to the registry, suite, and target, then stores only an exact certified PASS. The milestone fixture remains a deterministic adapter for regression coverage; the adversarial fixture is the reviewer-facing semantic demonstration.

## Complete lifecycle and role separation

1. A registrant registers a target address. The registry synchronously verifies the target manifest schema and declared version.
2. A curator creates a suite. A different wallet authors the requirement and criteria; the suite permits at most twelve bounded cases.
3. The curator freezes the suite. Canonical ordered case material is hashed and cannot be edited.
4. An independent tester opens a run. The run stores the suite, target, frozen digest, and tester binding.
5. For each case, the tester triggers a target public observation. The registry rechecks address/version consistency, validates the schema and observation identity, bounds the serialized evidence, and stores an immutable digest-bound snapshot.
6. The registry asks GenLayer consensus to adjudicate the frozen requirement against that snapshot. A validator independently rechecks the decision, evidence paths, conclusion, failed criteria, and dispute.
7. Every case must receive a verdict before the run closes. The closed run is PASS, FAIL, or INCONCLUSIVE.
8. `get_conformance` certifies only a closed PASS whose run, suite, target, frozen digest, evidence binding, independence, and contested evidence all match exactly.
9. `open_recheck` creates a new linked run without changing the historical assessment. The recheck must have a different tester.
10. The consumer checks the exact tuple and enables its integration only for a certified PASS.

## Public evidence adapter

A compatible target exposes bounded public views:

```python
get_equivtest_manifest() -> str
# {"schema":"equivtest.case/1", "version":"stable-target-version"}

get_equivtest_case(observation_id: str) -> str
# {
#   "schema":"equivtest.case/1",
#   "observation_id":"...",
#   "input": {}, "output": {}, "state": {},
#   "observed": {}, "claims": {},
#   "dispute":"CONTESTED" | "INCOMPLETE",
#   "provenance":"TARGET_PUBLIC_VIEW"
# }
```

The manifest is bounded to 2,048 bytes and an observation to 9,800 bytes before decoding. Input, output, state, observed, claims and the required provenance/dispute fields are checked. `observed` is a target public-state observation; `claims` and reviewer interpretations are unverified statements. Prompt-injection markers, invented observation identities, malformed JSON, oversized evidence, stale versions, and contradictory provenance are rejected.

## Consensus and Equivalence Principle

The leader must independently classify the evidence as PASS, FAIL, or INCONCLUSIVE and return a reason code, failed-criteria list, and concrete scalar leaf paths. The validator receives the same bounded evidence as untrusted data and independently performs the same adjudication. It rejects prompt injection, invented or duplicate paths, unsupported conclusions, inconsistent verdict/reason pairs, missing observed/output/state evidence, missing dispute evidence, ambiguous requirements, insufficient evidence, and citations that do not resolve to a scalar leaf. Equivalent valid path forms are canonicalized before comparison; decision consensus is over the semantic verdict, reason, and failed criteria rather than over irrelevant path ordering.

If consensus fails, the write does not record a verdict. `close_run` cannot treat a missing verdict as success. FINALIZED is not an execution-success signal: callers require the authoritative execution result `SUCCESS` or `FINISHED_WITH_RETURN`, then read state back.

## Immutable storage, versioning and replay rules

Registry records are bounded canonical JSON values in typed `TreeMap[str, str]` maps. Suite digests cover the suite and ordered case records. Runs store the suite digest and target binding. Snapshots bind run, case, suite, target, target address, target version, evidence digest, capture signer, and `TARGET_PUBLIC_VIEW` provenance. A target address plus observation ID cannot be captured twice, including across rechecks. Historical suites, snapshots, verdicts and closed runs are never overwritten. A revised interpretation is a new suite linked by `supersedes`.

## Security and threat model

| Threat | Resolution and regression evidence |
| --- | --- |
| Unauthorized suite mutation or post-freeze edits | Role checks, permanent freeze, and state tests. |
| Self-authored certification | Independent requirement author, independent tester, contested evidence requirement, and exact independence checks. |
| Stale target or substituted observation | Manifest/version recheck at capture; target, run, suite, case, address, version and digest bindings. |
| Invented citations or model-shaped PASS | Scalar-leaf path validation, observed-plus-dispute requirement, decision-consistent reason codes, and independent validator reassessment. |
| Prompt injection in target evidence | Evidence is explicitly untrusted data; injection markers are rejected and never treated as instructions. |
| Replay, duplicate submission, or historical overwrite | Immutable IDs, duplicate observation guards, frozen digests, and new linked rechecks. |
| Failed consensus or failed execution becoming certification | No verdict write on consensus failure; close and conformance require complete successful records; frontend verifies execution and readback. |
| Consumer accepting the wrong result | Constructor-bound exact tuple and `get_conformance`; the live consumer rejected R-2. |
| Misleading external-world assertion | Provenance is limited to `TARGET_PUBLIC_VIEW`; the registry never upgrades target claims to off-chain truth. |

The target controls its own public adapter and can lie about the world. GenLayer consensus reduces dependence on one adjudicator; it does not create an oracle for external truth. Wallets control signing and can disconnect, change accounts, change chain, or deliver an uncertain receipt.

## Frontend and wallet behavior

The browser uses `genlayer-js@1.1.8` and the StudioNet chain configuration. The seven routes are:

| Route | Purpose |
| --- | --- |
| `/` | Landing and reviewer-fit explanation |
| `/dashboard` | Connected account, network, counts and recent registry state |
| `/projects` | Discover/register a target and read its manifest |
| `/suites` | Create, author, add bounded cases, and freeze a suite |
| `/runner` | Open runs, capture observations, evaluate cases, close and recheck |
| `/results` | Inspect exact run, verdict, evidence and transaction status |
| `/registry` | Public exact run/suite/target conformance lookup without a wallet |

Connection requests accounts, ensures StudioNet 61999, and rechecks chain and account on every relevant event. Writes use contract-aware controls and recursively encode Python address parameters as `CalldataAddress`. A submitted transaction remains resumable until its final execution result is known. The client accepts only `SUCCESS` or `FINISHED_WITH_RETURN`, rejects `ERROR`/unknown results even when FINALIZED, and reads affected state back before showing completion.

## Reproduce the local checks

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix frontend --ignore-scripts --no-audit --no-fund
$env:GENVM_VERSION = 'v0.2.12'
python -m compileall -q contracts tests
python -m pytest -q tests/test_contract_state.py
python -m pytest -q tests/direct
python -m genvm_linter.cli check contracts/equivtest.py --json
python -m genvm_linter.cli check contracts/fixture_milestone.py --json
python -m genvm_linter.cli check contracts/fixture_adversarial.py --json
python -m genvm_linter.cli check contracts/fixture_consumer.py --json
npm run typecheck --prefix frontend
npm run test --prefix frontend
npm run build --prefix frontend
Push-Location frontend; $env:CI = '1'; npx playwright test; Pop-Location
npm audit --prefix frontend --omit=dev --audit-level=high
```

Verified results at the corrected application source are 16 state/adversarial tests, 8 Direct Mode tests, 4 contract lints, 8 frontend unit tests, 4 Playwright desktop/mobile tests, a successful production build generating all seven product routes, and zero frontend audit findings at the high severity threshold.

Direct Mode is genuine local GenVM execution with `genlayer-test==0.29.2`; it is not StudioNet evidence. StudioNet evidence is separately recorded in `docs/live-demo-20261019.json` and the deployment manifest.

## Live StudioNet evidence

Final deployments are on StudioNet 61999 and were source-parity checked with `getContractCode` through GenLayerJS 1.1.8:

| Contract | Address | Deployment transaction |
| --- | --- | --- |
| EquivTest | `0x7E058b6dCfa30c28912604589C7D4DA8073d9390` | [`0x057953…`](https://explorer-studio.genlayer.com/tx/0x057953d237299132d7f268a0a24d061e332a7b0e8fd77e408ac1c292b32baa1e) |
| Adversarial release fixture | `0x9956d55C5cE4eA04293A6EB15B8EeB5F363E5068` | [`0x47cad0…`](https://explorer-studio.genlayer.com/tx/0x47cad002863cf66db0b63cc1d1406d0426476c6017da25c6da11492cb1f1ed07) |
| Conformance consumer | `0x4dD69af3827363bd415c9e055b3D59c1B56A8d56` | [`0x57bd0b…`](https://explorer-studio.genlayer.com/tx/0x57bd0b9ff9e44b03c7f2f56b5ac30d7c986a8c301e912010b2f16726eb2a6d4c) |
| Milestone fixture | `0xe54ccca25ae4ACE1D484aF341adEf29C9b5feB10` | [`0x62f217…`](https://explorer-studio.genlayer.com/tx/0x62f217afc0eb0ccec9df86b2c33377cb98f94486cd687467c34d5bfc37954125) |

All four deployment transactions finalized with consensus agreement and execution success. The retrieved deployed bytes matched the intended local source byte-for-byte. The exact hashes, byte lengths, seven disposable wallet roles, full interaction ledger and readbacks are in [`docs/deployment-manifest.json`](docs/deployment-manifest.json), [`docs/source-parity-20261019.json`](docs/source-parity-20261019.json), and [`docs/live-demo-20261019.json`](docs/live-demo-20261019.json).

The live demonstration recorded target `T-1`, frozen suite `S-1`, and runs R-1 PASS, R-2 FAIL, R-3 INCONCLUSIVE, and R-4 PASS linked to R-1. The consumer enabled `release-gate-pass` for R-1 and rejected both `release-gate-fail` and `release-gate-inconclusive`; both rejection transactions finalized with execution error and did not mutate successful consumer state.

## Browser use and recovery

Install or unlock an injected EIP-1193 wallet, switch it to StudioNet 61999, and fund it only with ordinary testnet fee balance. Open the production URL, connect, and verify the chain/account banner before signing. If account or chain changes, reconnect and re-read state. If a transaction is finalized but execution/readback is unavailable, use the pending recovery state and do not resubmit until the same hash is resolved. A consensus failure is not a certification; leave the run open for deliberate recovery or create a new linked recheck.

## Deployment and CI

The production frontend is manually deployed at [https://equivtest.vercel.app](https://equivtest.vercel.app) with public chain ID `61999`, RPC `https://studio.genlayer.com/api`, and the corrected EquivTest address `0x7E058b6dCfa30c28912604589C7D4DA8073d9390`. The final READY deployment is `dpl_6KHTMsL7JisBXzyCFJacJikwzcgk`; all seven routes returned HTTP 200 and the public registry read back R-1 as CERTIFIED/PASS. Vercel project Git integration remains disabled; no GitHub push deployment is used.

The GitHub Actions workflow installs the locked root and frontend lockfiles with `npm ci`, checks the CLI version, runs compile/state/Direct Mode tests, lints all four contracts with GenVM `v0.2.12`, audits production dependencies, typechecks, unit-tests, builds, and runs Playwright. It does not deploy.

## Evidence and limitations

The evidence ledger at [`docs/evidence-ledger.md`](docs/evidence-ledger.md) separates local, Direct Mode, StudioNet, Vercel, and injected-wallet evidence. Remaining limitations are the model/provider dependence inherent to GenLayer consensus, the fact that a target's public adapter is not an oracle for off-chain truth, and the explicit scope of wallet separation. No successful certification or browser transaction is claimed without authoritative execution and state readback.

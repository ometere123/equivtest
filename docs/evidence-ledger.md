# EquivTest evidence ledger

This ledger separates source inspection, local tests, genuine Direct Mode, StudioNet transactions, deployed-source parity, Vercel checks, and injected-wallet evidence. A local or emulator pass is never presented as StudioNet proof.

## Scope and source

| Item | Evidence | Status |
| --- | --- | --- |
| Requested baseline | `016568ddcccbb92eaa7d88fc85294aa5e66e12f9` | inspected |
| Network | GenLayer StudioNet, chain `61999`, `https://studio.genlayer.com/api` | verified by RPC and CLI |
| Locked toolchain | `genlayer@0.39.1`, `genvm-linter==0.11.0`, GenVM `v0.2.12`, GenLayerJS `1.1.8`, `genlayer-test==0.29.2` | verified |
| Authoritative contract | `contracts/equivtest.py` | corrected, tested, linted, deployed |
| Demonstration contracts | adversarial fixture, milestone fixture, conformance consumer | tested, linted, deployed |

## Local and Direct Mode evidence

| Command or check | Result |
| --- | --- |
| `python -m compileall -q contracts tests` | passed |
| `python -m pytest -q tests/test_contract_state.py` | 14 passed |
| `python -m pytest -q tests/direct` | 8 passed in genuine Direct Mode with GenVM SDK `v0.2.12` |
| `genvm-lint check` on all four contracts with `GENVM_VERSION=v0.2.12` | 4 passed; EquivTest reports 17 methods, 8 views, 9 writes |
| `npm ci --ignore-scripts --no-audit --no-fund` | passed using root lockfile |
| `npm ci --prefix frontend --ignore-scripts --no-audit --no-fund` | passed using frontend lockfile |
| `npm run typecheck --prefix frontend` | passed |
| `npm run test --prefix frontend` | 7 passed |
| `npm run build --prefix frontend` | passed; all seven app routes generated |
| `CI=1 npx --no-install playwright test` in `frontend` | 4 passed across desktop and mobile projects |
| `npm audit --prefix frontend --omit=dev --audit-level=high` | 0 production vulnerabilities |
| `npm audit --prefix frontend --audit-level=high` | 10 development-tree findings remain; automatic fixes require breaking Vitest 5/Tailwind 4 upgrades |

The Direct Mode suite covers PASS, FAIL, INCONCLUSIVE, malformed leader output, independent validator rejection, freeze immutability, authorization, evaluate-before-capture, and consumer constructor/storage behavior. It runs the actual local GenVM test harness, not a contract mock. It is intentionally not counted as StudioNet evidence.

## Security and adversarial matrix

| Attack or failure | Expected protection | Evidence |
| --- | --- | --- |
| Unauthorized suite mutation | role check rejects it | deterministic state tests and Direct Mode |
| Add or edit after freeze | permanent freeze rejects it | state tests and Direct Mode |
| Duplicate registration or case submission | existing target/case identity and duplicate guards | live duplicate registration readback; state tests |
| Cross-suite/run/evidence substitution | exact run/case/suite/target/digest/address/version bindings | state tests and live `R-1-with-S-2` negative conformance query |
| Stale target version or wrong adapter schema | manifest/version recheck and bounded schema validation | state/adversarial tests |
| Truncated or oversized evidence | length bounds and JSON/object checks | state tests |
| Prompt injection in target data | untrusted evidence markers rejected; prompt treats fields as data | state tests and validator prompt |
| Fabricated observation or misleading claim | `TARGET_PUBLIC_VIEW` provenance and separate observed/claims fields | fixture schema and live readback |
| Ambiguous requirement or missing evidence | INCONCLUSIVE; no certification | live R-3 |
| Leader proposes unsupported PASS/FAIL | validator independently re-adjudicates and consensus writes no verdict on failure | Direct Mode malformed/disagreement tests |
| Validator disagreement or missing consensus | transaction is not a successful certification | contract guards and frontend receipt checks |
| Finalized execution error | no successful state mutation or completion display | live consumer R-2 rejection and frontend receipt tests |
| Historical overwrite/replay | immutable verdicts, observations, frozen digests, linked recheck | state tests and live R-4 |
| Wrong consumer binding | constructor-bound exact tuple | live consumer acceptance/rejection |
| Concurrent or repeated browser submission | pending hash recovery and duplicate-write lock | frontend unit tests and client implementation |

The known historical consumer deployment that used two differently typed `TreeMap` fields failed in GenVM construction. It was not used as final evidence. The storage was corrected to one typed records map, a Direct Mode regression test was added, and the final consumer deployment below finalized with execution success.

## Final StudioNet deployments

All final deployment transactions below were finalized with consensus agreement and authoritative execution success on chain 61999.

| Contract | Address | Deployment transaction | Source bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| EquivTest | `0x6B29f5A39ba8D8CBbeDE2dB671657E39eB50d1BE` | [`0x3dd6d1…`](https://explorer-studio.genlayer.com/tx/0x3dd6d100a620ce6dd6bc3246c1e30446fccd6158b383c4a4fe63a2478347d742) | 27,971 | `66631da1113becc40d980b7f4df672d59c992523595275b645bdff6ddd5beadb` |
| Adversarial fixture | `0xA1144EfB7aFae409210b84e9Cbeb91C2AbC8c145` | [`0x91f38a…`](https://explorer-studio.genlayer.com/tx/0x91f38a5e77500df07d562b16d593b96a613da4a45e480eb4f4998b6a2fc34487) | 5,378 | `6df25acd3c97df9cccda7af9d6fc68f371fef8b1fc0722ab47ae45f499323f41` |
| Conformance consumer | `0xaf3f0Bc3289E86B53c1dF96F21b23389E8d19f71` | [`0xcb2ee8…`](https://explorer-studio.genlayer.com/tx/0xcb2ee8451f4dacfc6b1bb31a44e6346509e94f081297ab605413c1354d10c9ca) | 2,049 | `d6ee0a7d2cc8869f3ebf1f5e1593a6b10ab1a6875cbac666caebc7176cd6eb8` |
| Milestone fixture | `0xe54ccca25ae4ACE1D484aF341adEf29C9b5feB10` | [`0x62f217…`](https://explorer-studio.genlayer.com/tx/0x62f217afc0eb0ccec9df86b2c33377cb98f94486cd687467c34d5bfc37954125) | 2,168 | `01d416f01b144575df01cd52ecac61c23d5eda72764b6de6e50c24db67853e6b` |

The source hashes and raw byte comparisons are reproduced in [`source-parity-20261018.json`](source-parity-20261018.json). It records `getContractCode` retrieval through GenLayerJS 1.1.8 and `all_exact: true` for all four contracts.

## Live five-wallet demonstration

Disposable wallets were used only for testnet fees and role separation; no private key is committed.

| Role | Label | Address |
| --- | --- | --- |
| deployer/registrant and fixture publisher | `praest-deployer` | `0x0d5540e0aD4B92Aa0ad4e5F1b8cD645ee1E363E7` |
| suite curator/reviewer A | `equivtest-builder` | `0xcAE3bF2755E18448aA5Bb15d632815deb7780F18` |
| requirement author/reviewer | `equivtest-auditor` | `0x3161ad2Ce7e22AF8D7e751D97a1cd5205706FDA2` |
| run tester | `equivtest-tester` | `0x8686F3c2434cAF7Ff9aDB5fCACaCE67B7B987eB7` |
| independent reviewer B/recheck tester/consumer | `equivtest-consumer` | `0xA35d8B9aDBb548C27638e13957F52e4a893d29fd` |

The complete transaction and readback artifact is [`live-demo-20261018.json`](live-demo-20261018.json). Its verified state includes:

- target `T-1` bound to the adversarial fixture and suite `S-1`, with suite digest `61b55e8102e96134cfd8798efcf03edbf4beae324361e5cbe1d1db455f7f7b9f`;
- R-1 closed PASS with contested evidence, independent tester, and `certified: true`;
- R-2 closed FAIL with `certified: false` and `OUTCOME_NOT_PASS`;
- R-3 closed INCONCLUSIVE because the dispute was incomplete, with `certified: false`;
- R-4 closed PASS and linked to R-1 without modifying R-1;
- the consumer enabled `release-gate-pass` for R-1;
- the consumer attempted `release-gate-fail` for R-2, but the finalized transaction had execution error and no successful integration state was created.

## Frontend and Vercel evidence

The final production deployment is recorded in [`deployment-manifest.json`](deployment-manifest.json). Its public environment is chain 61999, the locked RPC, and the final EquivTest address. The project has no GitHub deployment integration. Vercel CLI was used manually for the initial final deployment and one necessary corrective redeployment after raw receipt inspection found nested StudioNet execution results; the manifest records both IDs and the reason. Seven route HTTP checks and the public registry readback are recorded there. Injected-wallet browser evidence is recorded separately only after the corrected production deployment is exercised; absence of a wallet provider is not treated as a successful transaction.

## Remaining limitations

1. GenLayer consensus depends on the configured leader/validator/model execution; EquivTest does not make a target's own public claims independently true.
2. Windows/Direct Mode uses a narrow temp-file cleanup compatibility shim for the current `genlayer-test==0.29.2` file-lock behavior. The contract calls still execute in the actual Direct Mode runtime; the suite is not StudioNet proof.
3. The frontend development dependency audit has 10 findings (3 moderate, 5 high, 2 critical) whose automatic fixes require breaking major upgrades to Vitest 5 and Tailwind 4. Production dependencies report zero vulnerabilities. The locked StudioNet-compatible stack is retained rather than applying an incompatible upgrade without validation.

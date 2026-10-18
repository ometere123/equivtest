# EquivTest evidence ledger

This ledger separates source inspection, local state tests, genuine Direct Mode, StudioNet transactions, deployed-source parity, Vercel checks, and injected-wallet evidence. A local or emulator pass is never presented as StudioNet proof.

## Scope and verified source

| Item | Evidence | Status |
| --- | --- | --- |
| Requested baseline | 209d3a3a63602637df83c07c67765b2f010abdb8 | inspected |
| Network | GenLayer StudioNet, chain 61999, https://studio.genlayer.com/api | verified |
| Locked toolchain | genlayer@0.39.1, genvm-linter==0.11.0, GenVM v0.2.12, GenLayerJS 1.1.8, genlayer-test==0.29.2 | verified |
| Authoritative contract | contracts/equivtest.py | corrected, tested, linted, deployed |
| Demonstration contracts | adversarial fixture, milestone fixture, conformance consumer | tested, linted, deployed |
| Main source hash | b14a9b098e0ad5c17ae0f9e8e90ef57e16f7661341d86f3047d411781fb83450, 33,585 bytes | exact deployed parity |

The qualitative flagship case is a release-materiality dispute. Reviewer A argues that a single unresolved finding is covered by a synthetic-cohort exception; reviewer B argues that the exception fails if shared authorization or customer data is in scope. The target publishes bounded public fields and conflicting testimony, but its claims are explicitly unverified. Validators must decide how the evidence bears on materiality, exceptions and ambiguity. A deterministic contract can bind fields and hashes but cannot resolve that natural-language dispute; a single AI response removes independent reassessment and disagreement evidence.

## Local, Direct Mode and dependency evidence

| Command or check | Result |
| --- | --- |
| python -m compileall -q contracts tests | passed |
| python -m pytest -q tests/test_contract_state.py | 16 passed |
| python -m pytest -q tests/direct | 8 passed in genuine local Direct Mode |
| GenVM linter/validation on all four contracts, GENVM_VERSION=v0.2.12 | 4 passed; EquivTest has 17 methods, 8 views, 9 writes |
| npm ci --prefix frontend --ignore-scripts --no-audit --no-fund | passed from lockfile |
| npm run typecheck --prefix frontend | passed |
| npm run test --prefix frontend | 8 passed |
| npm run build --prefix frontend | passed; seven product routes plus _not-found generated |
| CI=1 npx --no-install playwright test in frontend | 4 passed across desktop and mobile |
| npm audit --prefix frontend --audit-level=high | 0 vulnerabilities |

Direct Mode uses the actual local GenVM test harness and pinned SDK; it is not StudioNet consensus evidence. The local tests cover lifecycle authorization, freeze immutability, duplicate/replay guards, evidence binding, malformed or injected evidence, role provenance, unsupported citations, validator disagreement, failed consensus, and consumer storage behavior.

## Security and adversarial matrix

| Threat or failure | Protection and evidence |
| --- | --- |
| Unauthorized suite mutation | Owner/requirement-author roles; state and Direct Mode tests |
| Modification after freeze | Permanent freeze and immutable digest; state and Direct Mode tests |
| Repeated registration or case submission | Identity and duplicate guards; tests and live duplicate behavior |
| Cross-suite, cross-run or evidence substitution | Exact run/case/suite/target/address/version/digest bindings; tests and readback |
| Stale target version or wrong adapter schema | Manifest/version recheck at capture and bounded schema validation |
| Truncated or oversized evidence | Length bounds and decoded-object validation |
| Prompt injection in target evidence | Evidence is untrusted data; markers and validator instructions reject it |
| Fabricated or misleading observation | TARGET_PUBLIC_VIEW provenance; observed fields are separate from claims |
| Conflicting reviewer testimony | Two bounded interpretations, cited scalar paths, and validator reassessment |
| Ambiguous requirement or missing evidence | INCONCLUSIVE; live R-3 is not certified |
| Leader proposes unsupported PASS/FAIL | Validator independently checks citations, conclusions, failed criteria and evidence; failed consensus writes no verdict |
| Validator disagreement or missing consensus | Diagnostic transaction 0x1afe5b... finalized MAJORITY_DISAGREE / ERROR; R-1 stayed OPEN with no verdict |
| Finalized execution error | Callers require authoritative SUCCESS/FINISHED_WITH_RETURN; live consumer rejection transactions finalized ERROR and did not mutate state |
| Historical overwrite or replay | Immutable verdict/snapshot records and linked R-4 recheck |
| Wrong consumer binding | Consumer constructor binds registry, suite and target; exact conformance tuple is required |
| Concurrent or repeated browser submission | Pending hash storage, recovery and duplicate-write lock; frontend unit tests |
| Distinct wallets treated as real-world authority | Output explicitly says ON_CHAIN_ROLE_SEPARATION_ONLY and real_world_authority_attested:false |

The confirmed live validator failure was fixed by requiring the exact canonical reviewer A/B interpretation paths in the evaluator and validator instruction. The failure itself is retained as negative evidence: a finalized but unsuccessful consensus transaction did not create a successful certification.

## Final StudioNet deployments

All final deployment transactions below are on chain 61999 and finalized with consensus agreement and authoritative execution success.

| Contract | Address | Deployment transaction | Source bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| EquivTest | 0x7E058b6dCfa30c28912604589C7D4DA8073d9390 | [deployment tx](https://explorer-studio.genlayer.com/tx/0x057953d237299132d7f268a0a24d061e332a7b0e8fd77e408ac1c292b32baa1e) | 33,585 | b14a9b098e0ad5c17ae0f9e8e90ef57e16f7661341d86f3047d411781fb83450 |
| Adversarial fixture | 0x9956d55C5cE4eA04293A6EB15B8EeB5F363E5068 | [deployment tx](https://explorer-studio.genlayer.com/tx/0x47cad002863cf66db0b63cc1d1406d0426476c6017da25c6da11492cb1f1ed07) | 7,612 | 1183f114315ab44053ace9e0310215ae03b50fef2329e40a926e7cb330c46b88 |
| Conformance consumer | 0x4dD69af3827363bd415c9e055b3D59c1B56A8d56 | [deployment tx](https://explorer-studio.genlayer.com/tx/0x57bd0b9ff9e44b03c7f2f56b5ac30d7c986a8c301e912010b2f16726eb2a6d4c) | 2,049 | d6ee0a7d2cc8869f3ebf1f5e1593a6b10ab1a6875cbac666caebc71c76cd6eb8 |
| Milestone fixture | 0xe54ccca25ae4ACE1D484aF341adEf29C9b5feB10 | [deployment tx](https://explorer-studio.genlayer.com/tx/0x62f217afc0eb0ccec9df86b2c33377cb98f94486cd687467c34d5bfc37954125) | 2,168 | 01d416f01b144575df01cd52ecac61c23d5eda72764b6de6e50c24db67853e6b |

The raw deployed-byte comparison is source-parity-20261019.json; all four entries have exact_byte_parity: true.

## Live StudioNet multi-wallet evidence

The complete current readback is live-demo-20261019.json. Disposable test wallets were used for fee payment and on-chain role separation only; no private key is committed and no wallet is treated as proof of real-world authority.

| Role | Address |
| --- | --- |
| PRAEST deployer/registrant and fixture publisher | 0x0d5540e0aD4B92Aa0ad4e5F1b8cD645ee1E363E7 |
| Suite builder/curator | 0xcae3bf2755e18448aa5bb15d632815deb7780f18 |
| Requirement author | 0x3161ad2ce7e22af8d7e751d97a1cd5205706fda2 |
| Independent tester | 0x8686f3c2434caf7ff9adb5fcacace67b7b987eb7 |
| Reviewer A | 0x92fbae8b6baf507caf60d142a46c44d9dd81dfcb |
| Reviewer B | 0xd698ed941cee7a00bfaa4a43010d165e6f22b41b |
| Recheck tester and consumer | 0xa35d8b9adbb548c27638e13957f52e4a893d29fd |

Current on-chain results:

- R-1 closed PASS, certified, evidence digest f9465e...afb32.
- R-2 closed FAIL, OUTCOME_NOT_PASS, not certified, evidence digest 8c84e5...657f.
- R-3 closed INCONCLUSIVE, OUTCOME_NOT_PASS, not certified, evidence digest c9e898...051ec.
- R-4 closed PASS and linked to R-1 without modifying it, evidence digest d47d70...65440.
- The consumer accepted R-1 in release-gate-pass; get_integration for the FAIL and INCONCLUSIVE gates is empty after finalized ERROR transactions.

## Previously captured Computer Use evidence

The earlier injected-wallet session was inspected and is preserved in the current live artifact. It used account 0xfcef676044658B5402f590daBe9E04A0F640522f against the prior production registry and run R-5; it is not substituted for the corrected contract's CLI-backed lifecycle.

| Browser action | Hash | Verified outcome |
| --- | --- | --- |
| Duplicate capture | 0xd21414f71acaa77766a8fb0588a0f120873dc0b970ffb86559314bd5985a808e | FINALIZED / MAJORITY_AGREE / ERROR; Case already captured, no mutation |
| Evaluate after the browser polling timeout | 0x76fb28009a1d6cd3e34e511ee6d2df95614bd07690b9275b222d144461354eaa | eventually FINALIZED / MAJORITY_AGREE / SUCCESS; INCONCLUSIVE result read back |
| Close run | 0x319e94f52a711f492b95372a91637767dbfc3d5263088c07fcb9a4307a8c1111 | FINALIZED / MAJORITY_AGREE / SUCCESS; R-5 closed INCONCLUSIVE |

The runner displayed the pending-finalization recovery state, and reload plus Resume finalization check cleared the pending hash only after the receipt and state resolved. The evidence demonstrates recovery behavior and is explicitly labeled prior-deployment evidence.

## Frontend and deployment state

The seven product routes are /, /dashboard, /projects, /suites, /runner, /results, and /registry. Production deployment verification is recorded in deployment-manifest.json; the final manual Vercel deployment and route checks are completed after the corrected public address is configured. GitHub push deployment is disabled.

The browser client connects only through injected EIP-1193 wallets, enforces chain 61999, rechecks account and chain before writes, polls StudioNet finalization for five minutes, distinguishes FINALIZED from execution SUCCESS, stores a pending hash for interrupted-session recovery, and performs method-specific state readback before clearing the pending marker or displaying completion.

## Remaining limitations

1. Consensus and model/provider availability remain external runtime dependencies.
2. The target public adapter is bounded public state, not an oracle for off-chain reality.
3. On-chain wallet separation does not establish independent real-world authority; the UI and contract expose that limitation.
4. The prior browser evidence is not evidence of the corrected contract deployment; current corrected lifecycle proof is the StudioNet multi-wallet artifact.

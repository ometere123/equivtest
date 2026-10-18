# EquivTest evidence ledger

This ledger distinguishes source-level verification from live network evidence. It is intentionally conservative: local passes are not presented as StudioNet proof, and CLI/SDK signer operations are not presented as injected-browser-wallet proof.

## Baseline and source

| Item | Evidence | Status |
| --- | --- | --- |
| Requested source baseline | `016568ddcccbb92eaa7d88fc85294aa5e66e12f9` | inspected |
| Verified application source commit | `9290af92448947ff5ac9b98e8828aa15f317a178` | tested and deployed; browser calldata fix is now committed separately |
| Production registry source | `contracts/equivtest.py` | corrected and linted |
| Demonstration target | `contracts/fixture_milestone.py` | linted |
| Demonstration consumer | `contracts/fixture_consumer.py` | linted |
| Intended network | StudioNet, chain `61999`, `https://studio.genlayer.com/api` | RPC read confirmed |

## Local contract evidence

| Command | Result |
| --- | --- |
| `python -m compileall -q contracts tests` | passed |
| `python -m pytest -q tests/test_contract_state.py` | 14 passed |
| `wsl bash -lc "cd /mnt/c/Users/USER/Downloads/equivtest && python3 -m pytest -q tests/direct"` | 6 passed in genuine Direct Mode |
| `genvm-lint check contracts/equivtest.py --json` with `GENVM_VERSION=v0.2.12` | passed: 17 methods, 8 views, 9 writes |
| `genvm-lint check contracts/fixture_milestone.py --json` | passed: 3 methods, 2 views, 1 write |
| `genvm-lint check contracts/fixture_consumer.py --json` | passed: 2 methods, 1 view, 1 write |

The Direct Mode suite covers PASS, FAIL, INCONCLUSIVE, malformed leader output rejected by a validator, suite freeze immutability, authorization, and evaluate-before-capture. The Windows harness attempt is excluded from the count because `genlayer-test==0.29.2` raises `PermissionError [WinError 32]` when its loader deletes an open temporary file. WSL execution of the same tests completed successfully.

## Frontend evidence

| Command | Result |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | installed root lockfile; `genlayer@0.39.1` checked |
| `npm ci --prefix frontend --ignore-scripts --no-audit --no-fund` | installed frontend lockfile |
| `npm run typecheck --prefix frontend` | passed |
| `npm run test --prefix frontend` | 2 files, 6 tests passed |
| `npm run build --prefix frontend` | passed; all 7 routes generated |
| `CI=1 npx --no-install playwright test` from `frontend` | 4 passed across desktop and mobile projects |
| `npm audit --omit=dev --audit-level=high` | root: 0 vulnerabilities |
| `npm audit --prefix frontend --omit=dev --audit-level=high` | frontend production dependencies: 0 vulnerabilities |
| `npm audit --prefix frontend --audit-level=high` | 10 dev-tree findings: 3 moderate, 5 high, 2 critical; fixes require breaking Vitest 5/Tailwind 4 upgrades |

The frontend security fixes include chain/account revalidation, exact `FINISHED_WITH_RETURN` receipt validation, resumable pending transactions, duplicate submission blocking, accessible form labels/statuses, and explorer links for verified hashes.

## Live StudioNet and deployment evidence

| Gate | Evidence | Status |
| --- | --- | --- |
| StudioNet RPC | `eth_chainId` returned `0xf22f` | passed |
| CLI version | local `genlayer --version` returned `0.39.1` | passed |
| CLI network | `network info` reported StudioNet 61999 and the locked RPC | passed |
| Deployment signer | Disposable `praest-deployer` plus four role-separated disposable accounts; no private keys committed | passed |
| EquivTest deployment | `0x647483f23849895d0c7e6c4fAd267d76a6365B5A`; tx [`0xf8a08f…`](https://explorer-studio.genlayer.com/tx/0xf8a08f5bf305ff1b063d769549be7327bbd27a6aa136ad0d4f830514ec5d3210) | finalized, execution SUCCESS |
| Milestone fixture deployment | `0xe8A8590B3259A4bFDf06462EaCE4e3d9A6A25B1f`; tx [`0x6bda6c…`](https://explorer-studio.genlayer.com/tx/0x6bda6ccb05740235c86f25ccb748ec8f2cd1c4c49d09f203c655a633058523e6) | finalized, execution SUCCESS |
| Consumer fixture deployment | `0xa46fB1560e1Ea477c76da269bDD14e6FD5Ae3674`; tx [`0x03b6a1…`](https://explorer-studio.genlayer.com/tx/0x03b6a1c950da74126bcb7b81a86b7271d7ea2b58ec1eacf605ee962263917245) | finalized, execution SUCCESS |
| Deployed source retrieval/parity | `getContractCode` raw bytes matched all three local files exactly; lengths 19490 / 1652 / 1077 | passed |
| Live role-separated operations | T-1, S-1/S-2, R-1 PASS, R-2 FAIL, R-3 INCONCLUSIVE, R-4 linked PASS | passed via CLI/SDK signers |
| Consumer integration | R-1 approved; R-2 rejection finalized with leader execution ERROR and no successful state mutation | passed |
| Production Vercel deployment | [`https://equivtest.vercel.app`](https://equivtest.vercel.app), deployment `dpl_8L76h3tU5C9X488bq8PYkrnt9cvh` | READY; manual, no GitHub auto-deploy |
| Production route/readback check | Seven routes HTTP 200; registry displayed R-1 through R-4 and exact R-1/R-4 verification | passed |
| Injected-wallet browser signing | Production `/projects` connected to Rabby on StudioNet 61999 and submitted [`0x91d436…`](https://explorer-studio.genlayer.com/tx/0x91d436ad6ba2b4e735a441ed13c5dcad33b4217701fad1b91ebcc0989fe09f58) | finalized with `FINISHED_WITH_ERROR`; no state mutation |
| Source-alignment GitHub Actions run for `9290af92448947ff5ac9b98e8828aa15f317a178` | [run 39070621862](https://github.com/ometere123/equivtest/actions/runs/39070621862): `python-and-contract` and `frontend` both passed | passed |

## Security fixes recorded

- Re-read and compare target schema/version during every capture.
- Bind snapshots to run, case, suite, target, target address, target version, suite digest, and explicit public-view provenance.
- Reject duplicate target-address/observation captures across rechecks.
- Reject malformed external adapter JSON as recoverable user errors.
- Require concrete evidence references and decision-consistent verdict/reason-code pairs.
- Recompute decision-bearing verdict fields during validator execution.
- Preserve failed/disputed evaluations without writing a successful verdict.
- Require exact conformance tuple and frozen digest for certification.
- Require wallet chain/account checks and successful execution-result verification before clearing pending writes.

## Remaining genuine limitations

1. The Chrome profile available to the verification session did not contain an injected EIP-1193 provider. The deployed frontend therefore could not sign a browser transaction in that profile; installing or importing a wallet was intentionally not performed without a specific wallet-extension authorization. The live multi-role contract demonstration was completed with disposable CLI/SDK signers, and the public browser registry/readback was verified separately.
2. Windows Direct Mode remains unavailable because of the documented `genlayer-test==0.29.2` file-lock cleanup defect; WSL Direct Mode is the counted real-runtime result.
3. The frontend development dependency audit retains 10 findings whose automatic fixes require breaking major upgrades. Production dependencies have zero reported vulnerabilities under `--omit=dev`.

The complete deployment manifest, transaction ledger, role addresses, source parity results, and Vercel identifiers are in `docs/deployment-manifest.json`.

## Browser transaction follow-up

The production browser attempt used the connected Rabby account `0xfcef676044658B5402f590daBe9E04A0F640522f` and the valid milestone fixture address. The transaction finalized on StudioNet with consensus agreement, but each execution returned `TypeError: address expected` at `gl.get_contract_at(target_address)`. The receipt's authoritative execution result was `FINISHED_WITH_ERROR`; `get_counts()` remained `{"targets":1,"suites":2,"cases":2,"runs":4}`, so no target or certification was created.

Root cause: `genlayer-js@1.1.8` encodes JavaScript strings as GenVM strings. Python `Address` parameters must be encoded as the SDK's `CalldataAddress`, which the CLI constructs automatically. The frontend now recursively converts valid address arguments to `CalldataAddress` for reads and writes, and clears a pending marker after a known terminal execution error while retaining it for an unverified receipt. Vitest, typecheck, and production build pass with this correction.

The existing Vercel deployment remains the single manual deployment at source commit `9290af92448947ff5ac9b98e8828aa15f317a178`. No second Vercel deployment was issued because the requested one-deployment constraint had already been consumed; therefore the corrected browser write path is verified in source/local build but is not yet present at the public production URL.

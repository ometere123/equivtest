# EquivTest evidence ledger

This ledger distinguishes source-level verification from live network evidence. It is intentionally conservative: a local pass is not presented as StudioNet or browser-wallet proof.

## Baseline and source

| Item | Evidence | Status |
| --- | --- | --- |
| Requested source baseline | `016568ddcccbb92eaa7d88fc85294aa5e66e12f9` | inspected |
| Remote `main` at audit time | same SHA as baseline | inspected |
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
| `npm run test --prefix frontend` | 1 file, 4 tests passed |
| `npm run build --prefix frontend` | passed; all 7 routes generated |
| `CI=1 npx --no-install playwright test` from `frontend` | 4 passed across desktop and mobile projects |
| `npm audit --omit=dev --audit-level=high` | root: 0 vulnerabilities |
| `npm audit --prefix frontend --omit=dev --audit-level=high` | frontend: 0 vulnerabilities |

The frontend security fixes include chain/account revalidation, exact `FINISHED_WITH_RETURN` receipt validation, resumable pending transactions, duplicate submission blocking, accessible form labels/statuses, and explorer links for verified hashes.

## Live deployment gates

| Gate | Evidence | Status |
| --- | --- | --- |
| StudioNet RPC | `eth_chainId` returned `0xf22f` | passed |
| CLI version | local `genlayer --version` returned `0.39.1` | passed |
| CLI network | `network info` reported StudioNet 61999 and the locked RPC | passed |
| Deployment signer | funded CLI accounts exist but are encrypted and locked | blocked: no authorized password/private key available |
| EquivTest deployment | no transaction submitted | not performed |
| Fixture deployments | no transaction submitted | not performed |
| Deployed source retrieval/parity | no deployed address | not applicable |
| Four-wallet browser demonstration | no deployed address / no configured production contract | not performed |
| Vercel project | authenticated account inspected; no EquivTest project linked | not performed |
| Vercel production URL | none created | blocked by missing verified contract address |
| Final GitHub Actions run for `a70cc9760fba4a0249e01cf62636a296d2eef2d9` | [run 39070406109](https://github.com/ometere123/equivtest/actions/runs/39070406109): `python-and-contract` and `frontend` both passed | passed |

The exact blocker is credential availability, not an RPC/network mismatch. The CLI listed funded accounts such as `praest-deployer`, but they reported `status: locked`; no password or private signing key was supplied or recoverable from the repository. No credential guessing or unverified deployment was attempted.

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

## Remaining evidence required for a full closeout

1. Supply or unlock an authorized StudioNet deployment wallet.
2. Deploy the registry and fixtures, record transaction hashes and finalized execution results.
3. Retrieve deployed source bytes and compare SHA-256 to this checkout.
4. Execute the four-wallet PASS, FAIL, INCONCLUSIVE, recheck, consumer-accept, and consumer-reject flows.
5. Set the verified registry address in Vercel, deploy manually, and repeat route/readback checks.
6. Push the final commit and attach the resulting green GitHub Actions run.

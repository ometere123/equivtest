import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Wallet } from "ethers";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CalldataAddress, TransactionHashVariant, TransactionStatus } from "genlayer-js/types";

const mainAddress = process.env.EQUIVTEST_ADDRESS || "0x6B29f5A39ba8D8CBbeDE2dB671657E39eB50d1BE";
const fixtureAddress = process.env.ADVERSARIAL_FIXTURE_ADDRESS || "0xA1144EfB7aFae409210b84e9Cbeb91C2AbC8c145";
const consumerAddress = process.env.CONSUMER_ADDRESS || "0xaf3f0Bc3289E86B53c1dF96F21b23389E8d19f71";
const targetId = "T-1";
const suiteId = "S-1";
const caseTitle = "Release conformance under contested interpretations";
const requirement = "A release is conforming only when the target's public state is DEFERRED and unresolved critical findings are zero. Party interpretations are claims, not substitutes for observed state. A contested interpretation must be resolved from the bounded public observation; an incomplete dispute is inconclusive.";
const criteria = "PASS requires observed.release_state=DEFERRED and observed.unresolved_critical_findings=0 with a CONTESTED dispute. FAIL requires a demonstrated contradiction in either observed field. INCONCLUSIVE is required when the dispute is incomplete or the public observation is insufficient.";
const password = process.env.PRAEST_PASSWORD;
if (!password) throw new Error("Set PRAEST_PASSWORD for the disposable keystores.");

const keystoreDir = process.env.GENLAYER_KEYSTORE_DIR || path.join(os.homedir(), ".genlayer", "keystores");
const roles = {
  deployer: "praest-deployer",
  curator: "equivtest-builder",
  requirementAuthor: "equivtest-auditor",
  tester: "equivtest-tester",
  secondTester: "equivtest-consumer",
  reviewerA: "equivtest-builder",
  reviewerB: "equivtest-consumer",
  consumer: "equivtest-consumer",
};

const addresses = {};
const clients = {};
const events = [];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function retryRead(label, operation) {
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < 6) await sleep(attempt * 5000);
    }
  }
  throw new Error(`${label} failed after retries: ${String(lastError)}`);
}

function address(value) {
  return new CalldataAddress(Uint8Array.from(Buffer.from(value.slice(2), "hex")));
}

function jsonValue(value) {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return `0x${Buffer.from(value).toString("hex")}`;
  if (Array.isArray(value)) return value.map(jsonValue);
  if (value && typeof value === "object") {
    const result = {};
    for (const [key, item] of Object.entries(value)) result[key] = jsonValue(item);
    return result;
  }
  return value;
}

function receiptSummary(hash, receipt) {
  const item = receipt || {};
  const consensus = item.consensus_data ?? item.consensusData ?? {};
  const leader = consensus.leader_receipt?.[0] ?? consensus.leaderReceipt?.[0] ?? consensus.validators?.find((value) => value?.mode === "leader");
  return {
    hash,
    status: item.status_name ?? item.statusName ?? item.status ?? null,
    result: item.result_name ?? item.resultName ?? item.result ?? null,
    execution_result: item.txExecutionResultName ?? item.txExecutionResult?.status ?? item.execution_result ?? item.executionResult ?? leader?.execution_result ?? leader?.executionResult ?? null,
    error: item.txExecutionError ?? item.txExecutionResult?.error ?? item.error ?? leader?.genvm_result?.error_description ?? null,
    receipt_keys: Object.keys(item),
    consensus_keys: Object.keys(consensus),
    from: item.from_address ?? item.sender ?? null,
    to: item.to_address ?? item.recipient ?? null,
  };
}

async function loadRole(name) {
  const filename = path.join(keystoreDir, `${name}.json`);
  const encrypted = fs.readFileSync(filename, "utf8");
  const wallet = await Wallet.fromEncryptedJson(encrypted, password);
  addresses[name] = wallet.address;
  clients[name] = createClient({ chain: studionet, account: createAccount(wallet.privateKey) });
}

async function read(method, args = []) {
  return retryRead(`read ${method}`, async () => {
    const client = createClient({ chain: studionet });
    const value = await client.readContract({
      address: mainAddress,
      functionName: method,
      args,
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
    return typeof value === "string" ? JSON.parse(value) : jsonValue(value);
  });
}

async function readTarget(observationId) {
  return retryRead(`read target ${observationId}`, async () => {
    const client = createClient({ chain: studionet });
    const value = await client.readContract({
      address: fixtureAddress,
      functionName: "get_equivtest_case",
      args: [observationId],
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
    return typeof value === "string" ? JSON.parse(value) : jsonValue(value);
  });
}

async function write(role, contract, method, args, label, allowFailure = false) {
  console.log(`LIVE ${label}`);
  const client = clients[roles[role] || role];
  if (!client) throw new Error(`No loaded role ${role}`);
  let hash = "";
  try {
    hash = await client.writeContract({
      address: contract,
      functionName: method,
      args,
      value: 0n,
    });
    const receipt = await retryRead(`wait ${label}`, () => client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.FINALIZED,
      interval: 3000,
      retries: 200,
    }));
    const summary = receiptSummary(hash, receipt);
    const success = ["FINISHED_WITH_RETURN", "SUCCESS"].includes(summary.execution_result);
    const event = { label, role, contract, method, args: jsonValue(args), ...summary, success };
    events.push(event);
    if (!success && !allowFailure) throw new Error(`${label} did not execute successfully: ${JSON.stringify(event, (_, value) => typeof value === "bigint" ? value.toString() : value)}`);
    return event;
  } catch (error) {
    const event = { label, role, contract, method, args: jsonValue(args), hash, success: false, error: String(error) };
    events.push(event);
    if (!allowFailure) throw error;
    return event;
  }
}

async function publishAndReview(observationId, releaseState, findings, note, firstPosition, secondPosition, incomplete = false) {
  let current = await readTarget(observationId).catch(() => null);
  if (!current) {
    await write("deployer", fixtureAddress, "publish_observation", [observationId, releaseState, BigInt(findings), note], `${observationId}: publish`);
    current = await readTarget(observationId);
  }
  const reviewerA = current.claims?.reviewer_a?.author;
  const reviewerB = current.claims?.reviewer_b?.author;
  if (!reviewerA) {
    await write("reviewerA", fixtureAddress, "submit_interpretation", [observationId, firstPosition, `Independent reading: ${firstPosition}`, "observed.release_state"], `${observationId}: review A`);
    current = await readTarget(observationId);
  }
  if (!incomplete && !reviewerB) {
    await write("reviewerB", fixtureAddress, "submit_interpretation", [observationId, secondPosition, `Independent reading: ${secondPosition}`, "observed.unresolved_critical_findings"], `${observationId}: review B`);
  }
  const observation = await readTarget(observationId);
  events.push({ label: `${observationId}: target readback`, observation });
  return observation;
}

async function evaluateRun(runId, observationId, label) {
  await write("tester", mainAddress, "capture_case", [runId, "C-1", observationId], `${label}: capture`);
  await write("tester", mainAddress, "evaluate_case", [runId, "C-1"], `${label}: evaluate`);
  const verdict = await read("get_verdict", [runId, "C-1"]);
  events.push({ label: `${label}: verdict readback`, verdict });
  await write("tester", mainAddress, "close_run", [runId], `${label}: close`);
  const run = await read("get_run", [runId]);
  const conformance = await read("get_conformance", [runId, suiteId, targetId]);
  events.push({ label: `${label}: run readback`, run, conformance });
  return { run, verdict, conformance };
}

async function main() {
  for (const name of new Set(Object.values(roles))) await loadRole(name);
  const target = await read("get_target", [targetId]).catch(() => null);
  events.push({ label: "role addresses", roles, addresses, target_before: target });

  if (!target) {
    await write("deployer", mainAddress, "register_target", [address(fixtureAddress), "Adversarial release fixture"], "register target");
  }
  const targetAfter = await read("get_target", [targetId]).catch(() => null);
  if (!targetAfter) throw new Error(`Target ${targetId} was not readable after registration.`);

  let suite = await read("get_suite", [suiteId]).catch(() => null);
  if (!suite) {
    await write("curator", mainAddress, "create_suite", [targetId, "Adversarial release certification", "Independent parties submit conflicting interpretations of a frozen release requirement and the target's public state.", "", address(addresses[roles.requirementAuthor])], "create suite");
    suite = await read("get_suite", [suiteId]);
  }
  if (!suite?.case_ids?.length) {
    await write("requirementAuthor", mainAddress, "add_case", [suiteId, caseTitle, requirement, criteria, "CRITICAL"], "add contested case");
    suite = await read("get_suite", [suiteId]);
  }
  if (!suite?.frozen) {
    await write("curator", mainAddress, "freeze_suite", [suiteId], "freeze suite");
    suite = await read("get_suite", [suiteId]);
  }
  events.push({ label: "suite readback", suite });
  const actualSuiteId = suite?.id || suiteId;
  const actualCaseId = suite?.case_ids?.[0] || "C-1";
  if (actualSuiteId !== suiteId) throw new Error(`Expected suite id ${suiteId}, got ${actualSuiteId}`);
  if (actualCaseId !== "C-1") throw new Error(`Expected case id C-1, got ${actualCaseId}`);

  const passObs = "release-pass-20261018";
  const failObs = "release-fail-20261018";
  const uncertainObs = "release-inconclusive-20261018";
  const recheckObs = "release-recheck-20261018";
  await publishAndReview(passObs, "DEFERRED", 0, "Release is held for evidence review; no critical findings remain.", "CONFORMING", "NONCONFORMING");
  await write("tester", mainAddress, "open_run", [actualSuiteId], "open PASS run");
  const run1 = await evaluateRun("R-1", passObs, "PASS run");

  await publishAndReview(failObs, "ACTIVATED", 1, "Release is active while one critical finding remains unresolved.", "CONFORMING", "NONCONFORMING");
  await write("tester", mainAddress, "open_run", [actualSuiteId], "open FAIL run");
  const run2 = await evaluateRun("R-2", failObs, "FAIL run");

  await publishAndReview(uncertainObs, "DEFERRED", 0, "Release state is visible, but the second interpretation is unavailable.", "CONFORMING", "UNCERTAIN", true);
  await write("tester", mainAddress, "open_run", [actualSuiteId], "open INCONCLUSIVE run");
  const run3 = await evaluateRun("R-3", uncertainObs, "INCONCLUSIVE run");

  await publishAndReview(recheckObs, "DEFERRED", 0, "Recheck repeats the public state with a new observation and new reviewer record.", "CONFORMING", "NONCONFORMING");
  await write("secondTester", mainAddress, "open_recheck", ["R-1"], "open linked recheck");
  const recheck = await (async () => {
    const runId = "R-4";
    await write("secondTester", mainAddress, "capture_case", [runId, actualCaseId, recheckObs], "recheck: capture");
    await write("secondTester", mainAddress, "evaluate_case", [runId, actualCaseId], "recheck: evaluate");
    const verdict = await read("get_verdict", [runId, actualCaseId]);
    await write("secondTester", mainAddress, "close_run", [runId], "recheck: close");
    const run = await read("get_run", [runId]);
    const conformance = await read("get_conformance", [runId, actualSuiteId, targetId]);
    events.push({ label: "recheck: readback", run, verdict, conformance });
    return { run, verdict, conformance };
  })();

  const accepted = await write("consumer", consumerAddress, "enable_integration", ["release-gate-pass", "R-1"], "consumer accepts PASS");
  const rejected = await write("consumer", consumerAddress, "enable_integration", ["release-gate-fail", "R-2"], "consumer rejects FAIL", true);
  const integration = await (async () => {
    const client = clients[roles.consumer];
    const value = await retryRead("read consumer integration", () => client.readContract({ address: consumerAddress, functionName: "get_integration", args: ["release-gate-pass"], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }));
    return typeof value === "string" ? JSON.parse(value) : jsonValue(value);
  })();
  events.push({ label: "consumer integration readback", integration });

  const output = {
    network: { name: "StudioNet", chain_id: 61999, rpc: "https://studio.genlayer.com/api" },
    contracts: { main: mainAddress, adversarial_fixture: fixtureAddress, consumer: consumerAddress },
    target_id: targetId,
    suite_id: actualSuiteId,
    case_id: actualCaseId,
    roles: { addresses, labels: roles },
    runs: { pass: run1, fail: run2, inconclusive: run3, recheck },
    consumer: { accepted, rejected, integration },
    events,
  };
  fs.mkdirSync(path.join(process.cwd(), "artifacts"), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), "artifacts", "live-demo.json"), JSON.stringify(output, null, 2) + "\n");
  console.log(JSON.stringify({ contracts: output.contracts, target_id: targetId, suite_id: actualSuiteId, case_id: actualCaseId, run_ids: ["R-1", "R-2", "R-3", "R-4"], accepted: accepted.hash, rejected: rejected.hash }, null, 2));
}

await main();

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const entries = [
  { name: "equivtest", address: process.env.EQUIVTEST_ADDRESS || "0x6B29f5A39ba8D8CBbeDE2dB671657E39eB50d1BE", source: "contracts/equivtest.py", deployment_tx: process.env.EQUIVTEST_DEPLOYMENT_TX || "0x3dd6d100a620ce6dd6bc3246c1e30446fccd6158b383c4a4fe63a2478347d742" },
  { name: "fixture_adversarial", address: process.env.ADVERSARIAL_FIXTURE_ADDRESS || "0xA1144EfB7aFae409210b84e9Cbeb91C2AbC8c145", source: "contracts/fixture_adversarial.py", deployment_tx: process.env.ADVERSARIAL_DEPLOYMENT_TX || "0x91f38a5e77500df07d562b16d593b96a613da4a45e480eb4f4998b6a2fc34487" },
  { name: "fixture_consumer", address: process.env.CONSUMER_ADDRESS || "0xaf3f0Bc3289E86B53c1dF96F21b23389E8d19f71", source: "contracts/fixture_consumer.py", deployment_tx: process.env.CONSUMER_DEPLOYMENT_TX || "0xcb2ee8451f4dacfc6b1bb31a44e6346509e94f081297ab605413c1354d10c9ca" },
  { name: "fixture_milestone", address: process.env.MILESTONE_FIXTURE_ADDRESS || "0xe54ccca25ae4ACE1D484aF341adEf29C9b5feB10", source: "contracts/fixture_milestone.py", deployment_tx: process.env.MILESTONE_DEPLOYMENT_TX || "0x62f217afc0eb0ccec9df86b2c33377cb98f94486cd687467c34d5bfc37954125" },
];

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const client = createClient({ chain: studionet });
const deployments = [];
for (const entry of entries) {
  const local = fs.readFileSync(path.join(process.cwd(), entry.source));
  const deployed = Buffer.from(await client.getContractCode(entry.address), "utf8");
  deployments.push({
    ...entry,
    local_bytes: local.length,
    deployed_bytes: deployed.length,
    local_sha256: sha256(local),
    deployed_sha256: sha256(deployed),
    exact_byte_parity: local.equals(deployed),
  });
}
const result = {
  network: { name: "StudioNet", chain_id: 61999, rpc: "https://studio.genlayer.com/api", sdk: "genlayer-js@1.1.8" },
  retrieved_at: new Date().toISOString(),
  deployments,
  all_exact: deployments.every((entry) => entry.exact_byte_parity),
};
fs.mkdirSync(path.join(process.cwd(), "artifacts"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), "artifacts", "source-parity.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));

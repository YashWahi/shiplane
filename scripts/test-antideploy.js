/**
 * Self-check script for ShipLane MCP server and components.
 */
const assert = require("assert");
const { spawn } = require("child_process");
const path = require("path");

async function testMcpServer() {
  return new Promise((resolve, reject) => {
    const mcpPath = path.join(__dirname, "..", "packages", "antideploy-mcp", "index.js");
    const proc = spawn("node", [mcpPath], { stdio: ["pipe", "pipe", "inherit"] });

    let receivedData = "";
    proc.stdout.on("data", (chunk) => {
      receivedData += chunk.toString();
      if (receivedData.includes('"result"')) {
        proc.kill();
        try {
          const parsed = JSON.parse(receivedData.trim().split("\n")[0]);
          assert.strictEqual(parsed.jsonrpc, "2.0");
          assert.strictEqual(parsed.id, 1);
          assert.strictEqual(parsed.result.serverInfo.name, "ShipLane-mcp");
          console.log("✓ MCP server initialize test passed");
          resolve(true);
        } catch (err) {
          reject(err);
        }
      }
    });

    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }) + "\n");
  });
}

testMcpServer()
  .then(() => {
    console.log("All ShipLane self-checks passed!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import { instructions } from "./instructions.js";
import { startBridge } from "./bridge.js";

async function main(): Promise<void> {
  const server = new McpServer(
    {
      name: "mario-mcp",
      version: "0.0.1",
    },
    { instructions },
  );

  registerTools(server);
  startBridge();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[mario-mcp] server ready on stdio\n");
}

main().catch((e) => {
  process.stderr.write(`[mario-mcp] fatal: ${(e as Error).stack ?? e}\n`);
  process.exit(1);
});

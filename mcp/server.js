import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchTasksTool } from "./tools/fetchTasks.js";

export const server = new McpServer({
  name: "task-manager-mcp",
  version: "1.0.0"
});

server.registerTool(
  fetchTasksTool.name,
  {
    description: fetchTasksTool.description,
    inputSchema: fetchTasksTool.inputSchema
  },
  fetchTasksTool.handler
);
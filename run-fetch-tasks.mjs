import { fetchTasksTool } from "./mcp/tools/fetchTasks.js";

const res = await fetchTasksTool.handler();
const output = res && Array.isArray(res.content) && res.content[0] && typeof res.content[0].text === "string"
  ? res.content[0].text
  : JSON.stringify(res, null, 2);

console.log(output);

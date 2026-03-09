import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
import { server } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
await server.connect(transport);
console.log("started")
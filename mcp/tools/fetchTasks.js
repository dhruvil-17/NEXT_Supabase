import { z } from "zod";
import { supabaseAdmin } from "../../src/lib/supabase/adminClient.js";



export const fetchTasksTool = {
  name: "fetch_tasks",
  description: "Fetch all tasks from the tasks table",

  inputSchema: z.   object({}),

  async handler() {

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  }
};
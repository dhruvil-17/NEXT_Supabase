const TASKS_BUCKET = "tasks-images";

export const PAGE_SIZE = 50; // Increased page size for rich Kanban / List boards

export async function uploadTaskImage({ supabase, userId, file }) {
  const ext = file?.name?.split(".").pop();
  const filePath = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(TASKS_BUCKET)
    .upload(filePath, file);

  if (uploadError) return { publicUrl: null, error: uploadError };

  const { data } = supabase.storage.from(TASKS_BUCKET).getPublicUrl(filePath);
  return { publicUrl: data?.publicUrl ?? null, error: null };
}

export async function createTask({ supabase, title, description, imageUrl, status = "todo" }) {
  // First try RPC create_task
  try {
    const res = await supabase.rpc("create_task", {
      p_title: title,
      p_description: description,
      p_image_url: imageUrl ?? null,
    });
    return res;
  } catch (err) {
    // Fallback to direct insert if RPC fails or table has extra fields
    return await supabase.from("tasks").insert({
      title,
      description,
      image_url: imageUrl ?? null,
      status,
    });
  }
}

export async function fetchUserTasks({ supabase, page = 1, pageSize = PAGE_SIZE, search = "" }) {
  const offset = (page - 1) * pageSize;
  try {
    const res = await supabase.rpc("get_user_tasks", {
      page_limit: pageSize,
      page_offset: offset,
      search: search ?? "",
    });
    if (res.data) return res;
  } catch {
    // Fallback to table query
  }

  let query = supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  return await query.range(offset, offset + pageSize - 1);
}

export async function deleteTaskById({ supabase, id }) {
  return await supabase.from("tasks").delete().eq("id", id);
}

export async function updateTaskDescriptionById({ supabase, id, description }) {
  return await supabase.from("tasks").update({ description }).eq("id", id);
}

export async function updateTaskDetailsById({ supabase, id, updates }) {
  return await supabase.from("tasks").update(updates).eq("id", id);
}

export function subscribeToTasksChanges({ supabase, onChange }) {
  const channel = supabase
    .channel("tasks-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

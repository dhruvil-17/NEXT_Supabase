const TASKS_BUCKET = "tasks-images";

export const PAGE_SIZE = 3;

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

export async function createTask({ supabase, title, description, imageUrl }) {
  return await supabase.rpc("create_task", {
    p_title: title,
    p_description: description,
    p_image_url: imageUrl ?? null,
  });
}

export async function fetchUserTasks({ supabase, page, pageSize, search }) {
  const offset = (page - 1) * pageSize;
  return await supabase.rpc("get_user_tasks", {
    page_limit: pageSize,
    page_offset: offset,
    search: search ?? "",
  });
}

export async function deleteTaskById({ supabase, id }) {
  return await supabase.from("tasks").delete().eq("id", id);
}

export async function updateTaskDescriptionById({ supabase, id, description }) {
  return await supabase.from("tasks").update({ description }).eq("id", id);
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

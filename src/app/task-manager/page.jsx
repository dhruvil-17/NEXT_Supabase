"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useRouter } from "next/navigation";

export default function Tasks() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);

  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
  });

  const [editing, setEditing] = useState({});
  const [taskImage, setTaskImage] = useState(null);

  

  const handleUpload = async (file) => {
    const ext = file.name.split(".").pop();
    const filePath = `${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("tasks-images")
      .upload(filePath, file);

    if (error) return null;

    const { data } = supabase.storage
      .from("tasks-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddingTask(true);

    let imageURL = null;

    if (taskImage) {
      imageURL = await handleUpload(taskImage);
    }

    await supabase.from("tasks").insert([
      {
        ...newTask,
        email: session.user.email,
        image_url: imageURL,
      },
    ]);

    setNewTask({ title: "", description: "" });
    setTaskImage(null);
    setAddingTask(false);
  };



  const fetchTasks = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    setTasks(data || []);
    setLoading(false);
  };

  

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
  };

  const editTask = async (id) => {
    await supabase
      .from("tasks")
      .update({ description: editing[id] })
      .eq("id", id);

    setEditing((prev) => ({ ...prev, [id]: "" }));
  };



  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

 

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (!session) router.push("/");
    });

    fetchTasks();

    return () => subscription.unsubscribe();
  }, [router]);

  

  useEffect(() => {
    const channel = supabase
      .channel("tasks-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT")
            setTasks((p) => [payload.new, ...p]);

          if (payload.eventType === "UPDATE")
            setTasks((p) =>
              p.map((t) => (t.id === payload.new.id ? payload.new : t))
            );

          if (payload.eventType === "DELETE")
            setTasks((p) => p.filter((t) => t.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

 

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="w-full max-w-3xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Task Manager</h1>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow mb-6 space-y-3"
        >
          <input
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) =>
              setNewTask((p) => ({ ...p, title: e.target.value }))
            }
            className="w-full border p-3 rounded-lg"
          />

          <textarea
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) =>
              setNewTask((p) => ({ ...p, description: e.target.value }))
            }
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files && setTaskImage(e.target.files[0])
            }
          />

          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg flex justify-center w-32">
            {addingTask ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Add Task"
            )}
          </button>
        </form>

        {/* TASK LIST */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-5 rounded-xl shadow"
              >
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <p className="text-gray-600 mb-3">
                  {task.description}
                </p>

                {task.image_url && (
                  <img
                    src={task.image_url}
                    className="rounded-lg mb-3 max-h-60"
                  />
                )}

                <textarea
                  placeholder="Update description..."
                  value={editing[task.id] || ""}
                  onChange={(e) =>
                    setEditing((p) => ({
                      ...p,
                      [task.id]: e.target.value,
                    }))
                  }
                  className="w-full border p-2 rounded-lg mb-3"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => editTask(task.id)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                  >
                    Update
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
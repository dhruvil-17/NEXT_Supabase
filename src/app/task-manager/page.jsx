"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading/page";
import Image from "next/image";
import {
  PAGE_SIZE,
  createTask,
  deleteTaskById,
  fetchUserTasks,
  subscribeToTasksChanges,
  updateTaskDescriptionById,
  uploadTaskImage,
} from "@/lib/supabase/tasks";

export default function Tasks() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
  });
  const [editing, setEditing] = useState({});
  const [taskImage, setTaskImage] = useState(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef(null);

  //submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    setAddingTask(true);

    let imageURL = null;

    if (taskImage) {
      const { publicUrl, error } = await uploadTaskImage({
        supabase,
        userId: session?.user?.id,
        file: taskImage,
      });
      if (error) console.log(error);
      imageURL = publicUrl;
    }

    const { error } = await createTask({
      supabase,
      title: newTask.title,
      description: newTask.description,
      imageUrl: imageURL,
    });
    if (error) {
      console.log(error);
    }
    await fetchTasks();

    setNewTask({ title: "", description: "" });
    setTaskImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setAddingTask(false);
  };

  //fetch tasks handler
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await fetchUserTasks({
      supabase,
      page,
      pageSize: PAGE_SIZE,
      search,
    });

    if (error) console.log(error);

    setTasks(data || []);
    setLoading(false);
  };

  //Delete handler
  const deleteTask = async (id) => {
    const { error } = await deleteTaskById({ supabase, id });
    if (error) console.log(error);
    await fetchTasks();
  };

  const editTask = async (id) => {
    const { error } = await updateTaskDescriptionById({
      supabase,
      id,
      description: editing[id],
    });
    if (error) console.log(error);

    setEditing((prev) => ({ ...prev, [id]: "" }));
  };

  //logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  //auth state change effect
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (!session) router.push("/");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  //realtime subscripton handler
  useEffect(() => {
    if (!session) {
      return;
    }
    return subscribeToTasksChanges({
      supabase,
      onChange: (payload) => {
        if (payload.eventType === "INSERT") {
          setTasks((p) => [payload.new, ...p]);
        }
        if (payload.eventType === "UPDATE") {
          setTasks((p) => p.map((t) => (t.id === payload.new.id ? payload.new : t)));
        }

        if (payload.eventType === "DELETE") {
          setTasks((p) => p.filter((t) => t.id !== payload.old.id));
        }
      },
    });
  }, [session]);

  //only fetch tasks after session
  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [page, session, search]);

  return (
    <div className="min-h-screen bg-linear-to-tl from-blue-200 via-blue-300 to-blue-400 p-6 flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="w-full flex justify-between items-center mb-6  z-10 ">
          <h1 className="text-3xl font-bold text-white">Task Manager </h1>

          <button
            onClick={handleLogout}
            className="bg-white text-red-500 px-4 py-2 rounded-xl font-medium hover:text-white hover:bg-red-500 transition"
          >
            Logout
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="backdrop-blur-lg bg-white/95 p-6 rounded-2xl shadow-xl mb-6 space-y-4"
        >
          <input
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) =>
              setNewTask((p) => ({ ...p, title: e.target.value }))
            }
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <textarea
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) =>
              setNewTask((p) => ({ ...p, description: e.target.value }))
            }
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setTaskImage(e.target.files[0])}
            className="border border-gray-200 p-3 rounded-xl w-full"
          />

          <button className="bg-linear-to-r from-blue-600 to-blue-500 text-white px-5 py-2 rounded-xl flex justify-center w-32 font-medium hover:shadow-lg transition">
            {addingTask ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Add Task"
            )}
          </button>
        </form>

        <div className="backdrop-blur-lg bg-white/95 p-5 rounded-2xl shadow mb-6">
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white/70 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {search && tasks.length == 0 && (
              <div className="bg-white p-5 rounded-xl shadow text-center text-lg">
                No tasks found
              </div>
            )}

            {tasks.length == 0 && (
              <div className="bg-white p-5 rounded-xl shadow text-center text-lg">
                Add New Tasks...
              </div>
            )}

            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-lg text-gray-800">
                  Title: {task.title}
                </h3>

                <p className="text-gray-600 mb-3">
                  Description: {task.description}
                </p>

                {task.image_url && (
                  <Image
                    width={300}
                    height={200}
                    quality={80}
                    src={task.image_url}
                    className="rounded-xl mb-3 object-cover"
                    alt="Task image"
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
                  className="w-full border border-gray-200 p-2 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => editTask(task.id)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 transition"
                  >
                    Update
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 text-white text-lg mt-4">
              {page > 1 && (
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="bg-white text-blue-600 px-4 py-2 rounded-xl font-medium hover:shadow"
                >
                  Prev
                </button>
              )}

              <p className="font-semibold">Page {page}</p>

              {tasks.length == 3 && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-xl font-medium hover:shadow"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

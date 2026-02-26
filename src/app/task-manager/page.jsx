"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useRouter } from "next/navigation";

export default function Tasks() {
  const [newTask, setNewTask] = useState({ title: null, description: null });
  const [newDescription, setNewDescription] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const router = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("tasks")
      .insert([{...newTask , email : session.user.email}])
      .select()
      .single();

    if (error) {
      console.log("Error addding task ", error.message);
      return;
    } else {
      console.log("task added successfully");
    }

    setNewTask({ title: null, description: null });
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      console.log("Error Fetching tasks ", error.message);
      return;
    } else {
      console.log("tasks fetched successfully");
    }
    setTasks(data);
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.log("Error Deleting task ", error);
      return;
    } else {
      console.log("deleted successfully");
    }
  };

  const editTask = async (id) => {
    const { error } = await supabase
      .from("tasks")
      .update({ description: newDescription })
      .eq("id", id);
    if (error) {
      console.log("Error updating task ", error);
      return;
    } else {
      console.log("task description updated successfully");
    }
    setNewDescription(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push("/");
  };

    const init = async () => {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      router.replace("/");
      return;
    }

    setSession(data.session);
    await fetchTasks();
  };

  useEffect(() => {
  init();

}, []);

  return (
    <>
      <div className="app-container">
        <h1 className="title">Task App</h1>
        <button onClick={handleLogout}>Logout</button>
        <form onSubmit={handleSubmit}>
          <div className="task-form">
            <input
              type="text"
              placeholder="Enter task title"
              className="input-field"
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <textarea
              placeholder="Enter task description"
              className="input-field"
              rows="3"
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, description: e.target.value }))
              }
            />

            <button className="add-btn" type="submit">
              Add Task
            </button>
          </div>
        </form>

        <div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {tasks.map((task, key) => (
              <li
                key={key}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "1rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <h3>Title : {task.title}</h3>
                  <p>Description : {task.description}</p>
                  <textarea
                    placeholder="Updated Description..."
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="border-2"
                  ></textarea>

                  <button
                    style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
                    className="border-2 cursor-pointer"
                    onClick={() => editTask(task.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="border-2 cursor-pointer"
                    style={{ padding: "0.5rem 1rem" }}
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

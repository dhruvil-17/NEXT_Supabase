"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  Search,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Kanban,
  List as ListIcon,
  CheckCircle2,
  Circle,
  Clock,
  CheckSquare,
  X,
  Maximize2,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import {
  createTask,
  deleteTaskById,
  fetchUserTasks,
  subscribeToTasksChanges,
  updateTaskDescriptionById,
  updateTaskDetailsById,
  uploadTaskImage,
} from "@/lib/supabase/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";

const COLUMNS = [
  { id: "todo", label: "To Do", icon: Circle, color: "text-zinc-500", badgeVariant: "todo" },
  { id: "in_progress", label: "In Progress", icon: Clock, color: "text-amber-600", badgeVariant: "in_progress" },
  { id: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-600", badgeVariant: "completed" },
];

export default function TasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "list"

  // Status mapping stored locally to handle setups where remote DB doesn't have a status column
  const [statusOverrides, setStatusOverrides] = useState({});

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("todo");
  const [formImageFile, setFormImageFile] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const fileInputRef = useRef(null);

  // Load status overrides from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("taskflow_status_overrides");
      if (saved) setStatusOverrides(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to read status overrides", e);
    }
  }, []);

  // Sync status overrides to localStorage
  const setTaskStatus = async (taskId, newStatus) => {
    setStatusOverrides((prev) => {
      const updated = { ...prev, [taskId]: newStatus };
      try {
        localStorage.setItem("taskflow_status_overrides", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      await updateTaskDetailsById({ supabase, id: taskId, updates: { status: newStatus } });
    } catch {
      // Ignored if remote schema does not include status
    }
  };

  const getTaskStatus = (task) => {
    if (statusOverrides[task.id]) return statusOverrides[task.id];
    if (task.status) return task.status;
    return "todo";
  };

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await fetchUserTasks({
      supabase,
      page: 1,
      pageSize: 100,
      search,
    });
    if (error) console.error("Error fetching tasks:", error);
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (!session) router.push("/");
    });
    return () => subscription?.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!session) return;
    return subscribeToTasksChanges({
      supabase,
      onChange: (payload) => {
        if (payload.eventType === "INSERT") {
          setTasks((prev) => [payload.new, ...prev]);
        }
        if (payload.eventType === "UPDATE") {
          setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
        }
        if (payload.eventType === "DELETE") {
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      },
    });
  }, [session]);

  useEffect(() => {
    if (session) fetchTasks();
  }, [session, search]);

  const handleOpenCreate = (defaultStatus = "todo") => {
    setFormTitle("");
    setFormDescription("");
    setFormStatus(defaultStatus);
    setFormImageFile(null);
    setFormImagePreview(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormTitle(task.title || "");
    setFormDescription(task.description || "");
    setFormStatus(getTaskStatus(task));
    setFormImageFile(null);
    setFormImagePreview(task.image_url || null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      setFormImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);

    let imageURL = null;
    if (formImageFile) {
      const { publicUrl, error } = await uploadTaskImage({
        supabase,
        userId: session?.user?.id,
        file: formImageFile,
      });
      if (error) console.error(error);
      imageURL = publicUrl;
    }

    const { data, error } = await createTask({
      supabase,
      title: formTitle.trim(),
      description: formDescription.trim(),
      imageUrl: imageURL,
      status: formStatus,
    });

    if (error) console.error(error);

    if (data?.id) {
      setTaskStatus(data.id, formStatus);
    }

    await fetchTasks();
    setIsCreateOpen(false);
    setSubmitting(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask || !formTitle.trim()) return;
    setSubmitting(true);

    let imageURL = editingTask.image_url;
    if (formImageFile) {
      const { publicUrl, error } = await uploadTaskImage({
        supabase,
        userId: session?.user?.id,
        file: formImageFile,
      });
      if (!error && publicUrl) imageURL = publicUrl;
    }

    try {
      await updateTaskDetailsById({
        supabase,
        id: editingTask.id,
        updates: {
          title: formTitle.trim(),
          description: formDescription.trim(),
          image_url: imageURL,
          status: formStatus,
        },
      });
    } catch {
      await updateTaskDescriptionById({
        supabase,
        id: editingTask.id,
        description: formDescription.trim(),
      });
    }

    setTaskStatus(editingTask.id, formStatus);
    await fetchTasks();
    setEditingTask(null);
    setSubmitting(false);
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    const { error } = await deleteTaskById({ supabase, id: deletingTaskId });
    if (error) console.error(error);
    await fetchTasks();
    setDeletingTaskId(null);
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
    if (taskId) {
      setTaskStatus(taskId, columnId);
      setDraggingTaskId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks;
    const s = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title?.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s)
    );
  }, [tasks, search]);

  const counts = useMemo(() => {
    const res = { todo: 0, in_progress: 0, completed: 0, total: filteredTasks.length };
    filteredTasks.forEach((t) => {
      const st = getTaskStatus(t);
      if (res[st] !== undefined) res[st]++;
      else res.todo++;
    });
    return res;
  }, [filteredTasks, statusOverrides]);

  const completionPercentage = counts.total > 0
    ? Math.round((counts.completed / counts.total) * 100)
    : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar: Clean White & Green */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground flex items-center gap-2">
                TaskFlow
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                  Minimal
                </span>
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs rounded-xl bg-secondary/60 border-border focus-visible:bg-card focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher */}
            <div className="flex bg-secondary p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === "kanban"
                    ? "bg-card text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Board View"
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-card text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={() => handleOpenCreate("todo")}
              size="sm"
              className="text-xs font-medium h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Task
            </Button>

            <ThemeToggle />

            {/* User and Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div
                className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-semibold"
                title={session?.user?.email || "User"}
              >
                {session?.user?.email ? session.user.email[0].toUpperCase() : "U"}
              </div>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="iconSm"
                className="text-muted-foreground hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-secondary border-border"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Workspace Summary Bar: Clean White & Green */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border clean-card">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Workspace Overview</h2>
            <p className="text-xs text-muted-foreground">
              {counts.total} total {counts.total === 1 ? "task" : "tasks"}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Status counts */}
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-700">
                <Circle className="w-3 h-3 text-zinc-500" />
                To Do: {counts.todo}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/40">
                <Clock className="w-3 h-3 text-amber-600" />
                In Progress: {counts.in_progress}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Done: {counts.completed}
              </span>
            </div>

            {/* Clean green progress bar */}
            <div className="flex items-center gap-2 min-w-[130px]">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {completionPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((col) => (
              <div key={col} className="space-y-3">
                <div className="h-10 bg-secondary/80 rounded-xl animate-pulse" />
                <div className="h-32 bg-secondary/60 rounded-2xl animate-pulse" />
                <div className="h-32 bg-secondary/60 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          /* Global Empty State */
          <Card className="border border-dashed border-border p-12 text-center bg-card">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {search ? "No tasks matching your search" : "No tasks in your workspace"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {search
                  ? "Try searching for a different keyword or clear the search filter."
                  : "Keep your workflow clean and organized by creating your first task."}
              </p>
              <div className="pt-2">
                {search ? (
                  <Button variant="outline" size="sm" onClick={() => setSearch("")} className="text-xs">
                    Clear Search
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleOpenCreate("todo")} className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create Task
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : viewMode === "kanban" ? (
          /* =================== KANBAN BOARD VIEW =================== */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {COLUMNS.map((col) => {
              const columnTasks = filteredTasks.filter((t) => getTaskStatus(t) === col.id);
              const isOver = dragOverColumn === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={() => handleDragLeave(col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col rounded-2xl border transition-colors p-3 min-h-[500px] bg-secondary/40 dark:bg-secondary/30 ${
                    isOver
                      ? "border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-600/30"
                      : "border-border"
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <col.icon className={`w-4 h-4 ${col.color}`} />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {col.label}
                      </h3>
                      <span className="text-[11px] font-semibold text-muted-foreground bg-card px-2 py-0.5 rounded-full border border-border">
                        {columnTasks.length}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleOpenCreate(col.id)}
                      variant="ghost"
                      size="iconSm"
                      className="text-muted-foreground hover:text-emerald-700 hover:bg-card"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Task Cards */}
                  <div className="space-y-3 flex-1">
                    {columnTasks.length === 0 ? (
                      <div
                        onClick={() => handleOpenCreate(col.id)}
                        className="h-28 border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-emerald-600/60 hover:bg-card transition-colors group"
                      >
                        <p className="text-xs text-muted-foreground group-hover:text-foreground">
                          Drop tasks here or click to add
                        </p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className="group relative rounded-xl border border-border bg-card p-4 clean-card hover:border-emerald-600/50 transition-colors cursor-grab active:cursor-grabbing"
                        >
                          {/* Image preview banner */}
                          {task.image_url && (
                            <div className="relative mb-3 rounded-lg overflow-hidden border border-border bg-secondary aspect-[16/9] group/img">
                              <Image
                                src={task.image_url}
                                alt={task.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-200 group-hover/img:scale-102"
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewImage(task.image_url)}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity"
                                title="Expand image"
                              >
                                <Maximize2 className="w-5 h-5 drop-shadow-sm" />
                              </button>
                            </div>
                          )}

                          {/* Card Title & Actions */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="text-sm font-semibold text-foreground tracking-tight line-clamp-2">
                              {task.title}
                            </h4>

                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => handleOpenEdit(task)}
                                variant="ghost"
                                size="iconSm"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Edit task"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                onClick={() => setDeletingTaskId(task.id)}
                                variant="ghost"
                                size="iconSm"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed whitespace-pre-wrap">
                              {task.description}
                            </p>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border text-[11px]">
                            {/* Cycle status */}
                            <button
                              type="button"
                              onClick={() => {
                                const order = ["todo", "in_progress", "completed"];
                                const curIdx = order.indexOf(getTaskStatus(task));
                                const nextStatus = order[(curIdx + 1) % order.length];
                                setTaskStatus(task.id, nextStatus);
                              }}
                              className="inline-flex items-center gap-1 cursor-pointer"
                              title="Click to cycle status"
                            >
                              <Badge variant={col.badgeVariant} className="text-[10px] py-0 px-2 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-0.5" />
                                {col.label}
                              </Badge>
                            </button>

                            {task.created_at && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {formatDate(task.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =================== MINIMAL LIST VIEW =================== */
          <div className="rounded-2xl border border-border bg-card overflow-hidden clean-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4 hidden md:table-cell">Description</th>
                    <th className="py-3 px-4 hidden sm:table-cell w-28">Created</th>
                    <th className="py-3 px-4 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTasks.map((task) => {
                    const status = getTaskStatus(task);
                    const isCompleted = status === "completed";

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-secondary/40 transition-colors group"
                      >
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus = isCompleted ? "todo" : "completed";
                              setTaskStatus(task.id, nextStatus);
                            }}
                            className="text-muted-foreground hover:text-emerald-700 transition-colors cursor-pointer"
                            title={isCompleted ? "Mark incomplete" : "Mark completed"}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : status === "in_progress" ? (
                              <Clock className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-400" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold text-sm ${
                                isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.image_url && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(task.image_url)}
                                className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 hover:underline"
                              >
                                Image
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground line-clamp-1 max-w-md">
                          {task.description || "—"}
                        </td>

                        <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground text-[11px]">
                          {formatDate(task.created_at)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                            <Button
                              onClick={() => handleOpenEdit(task)}
                              variant="ghost"
                              size="iconSm"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              onClick={() => setDeletingTaskId(task.id)}
                              variant="ghost"
                              size="iconSm"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* =================== CREATE TASK DIALOG =================== */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Title</label>
              <Input
                placeholder="What needs to be done?"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                autoFocus
                className="text-xs focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Description</label>
              <Textarea
                placeholder="Add more details, checklists or context..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="text-xs min-h-[90px] focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Column Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Image Attachment</label>
                <label className="flex items-center justify-center gap-2 h-10 px-3 border border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary transition text-xs text-muted-foreground truncate">
                  <Upload className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                  <span className="truncate">{formImageFile ? formImageFile.name : "Upload Image"}</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {formImagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-border aspect-[16/9] bg-secondary max-h-48">
                <Image
                  src={formImagePreview}
                  alt="Attachment preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormImageFile(null);
                    setFormImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !formTitle.trim()}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Create Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =================== EDIT TASK DIALOG =================== */}
      <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update title, description, image attachment, or move across columns.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Title</label>
              <Input
                placeholder="Task title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="text-xs focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Description</label>
              <Textarea
                placeholder="Task description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="text-xs min-h-[90px] focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:border-emerald-600"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Replace Image</label>
                <label className="flex items-center justify-center gap-2 h-10 px-3 border border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary transition text-xs text-muted-foreground truncate">
                  <Upload className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                  <span className="truncate">{formImageFile ? formImageFile.name : "Upload new image"}</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {formImagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-border aspect-[16/9] bg-secondary max-h-48">
                <Image
                  src={formImagePreview}
                  alt="Attachment preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormImageFile(null);
                    setFormImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingTask(null)}
                disabled={submitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !formTitle.trim()}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =================== DELETE CONFIRMATION DIALOG =================== */}
      <Dialog open={Boolean(deletingTaskId)} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 flex items-center justify-center mx-auto mb-2 border border-red-200 dark:border-red-900">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-center">Delete Task?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingTaskId(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteTask}
              className="text-xs"
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =================== IMAGE LIGHTBOX DIALOG =================== */}
      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/90 border-zinc-800">
          <div className="relative aspect-[16/10] w-full max-h-[80vh]">
            {previewImage && (
              <Image
                src={previewImage}
                alt="Enlarged attachment"
                fill
                className="object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

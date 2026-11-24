export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          Loading TaskFlow...
        </p>
      </div>
    </div>
  );
}

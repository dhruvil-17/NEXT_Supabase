import "./globals.css";

export const metadata = {
  title: "TaskFlow — Minimalist Task Manager",
  description: "A clean, minimalist task workspace with white and green theme",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-emerald-100 selection:text-emerald-900 dark:selection:bg-emerald-900/40 dark:selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}

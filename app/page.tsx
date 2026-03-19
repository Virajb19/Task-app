"use client";

import { useSession } from "next-auth/react";
import { AuthScreen } from "@/components/auth-screen";
import { TaskDashboard } from "@/components/task-dashboard";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="bg-mesh" />
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <TaskDashboard />;
}

// 

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // your auth config
import { AuthScreen } from "@/components/auth-screen";
import { TaskDashboard } from "@/components/task-dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <AuthScreen />;
  }

  return <TaskDashboard />;
}
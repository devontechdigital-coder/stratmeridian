"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";

function RoleGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const role = session?.user?.role;
    if (role && role !== "admin" && role !== "sub-admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <AdminSpinner />;
  }

  if (session && (session.user?.role === "admin" || session.user?.role === "sub-admin")) {
    return children;
  }

  return <AdminSpinner />;
}

function AdminSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
    </div>
  );
}

export default function AdminClientShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <SessionProvider>
      <RoleGuard>
        <div className="flex min-h-screen bg-slate-100">
          <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={setSidebarCollapsed} />
          <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
            <AdminTopbar />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </RoleGuard>
    </SessionProvider>
  );
}

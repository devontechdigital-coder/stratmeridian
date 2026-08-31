"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, FilePlus2, FileText, FolderTree, ReceiptText, Settings, Users } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { getFirstAllowedAdminPath } from "@/lib/permissions";

const quickActions = [
  {
    label: "Add Page",
    href: "/admin/pages/add",
    desc: "Create public content",
    module: "pages",
    permissionType: "edit",
    icon: FilePlus2,
    primary: true,
  },
  {
    label: "Pages",
    href: "/admin/pages",
    desc: "Manage website pages",
    module: "pages",
    permissionType: "view",
    icon: FileText,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    desc: "Manage service groups",
    module: "categories",
    permissionType: "view",
    icon: FolderTree,
  },
  {
    label: "Services",
    href: "/admin/services",
    desc: "Manage pricing",
    module: "services",
    permissionType: "view",
    icon: BriefcaseBusiness,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    desc: "Review submissions",
    module: "orders",
    permissionType: "view",
    icon: ReceiptText,
  },
  {
    label: "Users",
    href: "/admin/users",
    desc: "Manage access",
    module: "users",
    permissionType: "view",
    icon: Users,
  },
  {
    label: "Theme Settings",
    href: "/admin/settings/theme",
    desc: "Update branding",
    module: "settings",
    permissionType: "view",
    icon: Settings,
  },
];

export default function AdminDashboard() {
  const { hasPermission, isLoading, user } = usePermissions();
  const router = useRouter();
  const [pageCount, setPageCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "sub-admin" && !hasPermission("dashboard", "view")) {
      router.replace(getFirstAllowedAdminPath(user));
    }
  }, [isLoading, user, hasPermission, router]);

  useEffect(() => {
    if (isLoading) return;
    if (!hasPermission("pages", "view")) return;

    fetch("/api/admin/pages")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPageCount(data.data?.length || 0);
      })
      .catch(() => setPageCount(0));
  }, [hasPermission, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!hasPermission("orders", "view")) return;

    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrderCount(data.data?.length || 0);
      })
      .catch(() => setOrderCount(0));
  }, [hasPermission, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!hasPermission("categories", "view")) return;

    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategoryCount(data.data?.length || 0);
      })
      .catch(() => setCategoryCount(0));
  }, [hasPermission, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!hasPermission("services", "view")) return;

    fetch("/api/admin/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServiceCount(data.data?.length || 0);
      })
      .catch(() => setServiceCount(0));
  }, [hasPermission, isLoading]);

  const visibleQuickActions = quickActions.filter((action) => hasPermission(action.module, action.permissionType));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading admin...</p>
      </div>
    );
  }

  if (user?.role === "sub-admin" && !hasPermission("dashboard", "view")) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-32">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-50 text-slate-200">
          <Settings className="h-12 w-12" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase text-slate-900">Access Restricted</h2>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select an authorized module from the sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 shadow-lg shadow-violet-200">
        <div className="relative">
          <h2 className="mb-1 text-2xl font-bold text-white">Welcome to Admin</h2>
          <p className="text-sm text-violet-100">Manage your website pages, users, menus, and theme settings from one place.</p>
          {hasPermission("pages", "edit") && (
            <Link
              href="/admin/pages/add"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-md transition-colors hover:bg-violet-50"
            >
              <FilePlus2 className="h-4 w-4" />
              Add Page
            </Link>
          )}
        </div>
      </div>

      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Overview</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Public Pages" value={pageCount} icon={FileText} accent="bg-violet-100 text-violet-600" />
          <StatCard title="Categories" value={categoryCount} icon={FolderTree} accent="bg-cyan-100 text-cyan-600" />
          <StatCard title="Services" value={serviceCount} icon={BriefcaseBusiness} accent="bg-emerald-100 text-emerald-600" />
          <StatCard title="Orders" value={orderCount} icon={ReceiptText} accent="bg-rose-100 text-rose-600" />
          <StatCard title="Users Module" value={hasPermission("users", "view") ? "Enabled" : "Hidden"} icon={Users} accent="bg-blue-100 text-blue-600" />
          <StatCard title="Theme" value={hasPermission("settings", "view") ? "Ready" : "Hidden"} icon={Settings} accent="bg-amber-100 text-amber-600" />
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {visibleQuickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group flex flex-col gap-3 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                  action.primary ? "bg-violet-600 text-white hover:bg-violet-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className={`mt-0.5 text-xs ${action.primary ? "text-violet-100" : "text-slate-500"}`}>{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

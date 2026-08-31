"use client";

import { usePathname } from "next/navigation";

const pageMap = {
  "/admin": { title: "Dashboard", subtitle: "Manage content, users, menus, and settings." },
  "/admin/users": { title: "Users", subtitle: "Manage registered users and access." },
  "/admin/pages": { title: "Pages", subtitle: "Create and edit public website pages." },
  "/admin/categories": { title: "Categories", subtitle: "Create service categories and parent groups." },
  "/admin/services": { title: "Services", subtitle: "Create services with pricing and categories." },
  "/admin/orders": { title: "Orders", subtitle: "Review service orders and payment status." },
  "/admin/settings/theme": { title: "Theme Settings", subtitle: "Update public branding and metadata." },
  "/admin/settings/menus/header": { title: "Header Menu", subtitle: "Manage public header navigation." },
  "/admin/settings/menus/footer": { title: "Footer Menu", subtitle: "Manage public footer navigation." },
  "/admin/sub-admins": { title: "Sub-Admins", subtitle: "Delegate admin access." },
};

export default function AdminTopbar() {
  const pathname = usePathname();
  let info = pageMap[pathname];

  if (!info && pathname.startsWith("/admin/pages/add")) {
    info = { title: "Add Page", subtitle: "Create a new public page." };
  }

  if (!info && pathname.startsWith("/admin/pages/edit")) {
    info = { title: "Edit Page", subtitle: "Update public page content." };
  }

  if (!info && pathname.startsWith("/admin/categories/add")) {
    info = { title: "Add Category", subtitle: "Create a new category." };
  }

  if (!info && pathname.startsWith("/admin/categories/edit")) {
    info = { title: "Edit Category", subtitle: "Update category content." };
  }

  if (!info && pathname.startsWith("/admin/services/add")) {
    info = { title: "Add Service", subtitle: "Create a new service." };
  }

  if (!info && pathname.startsWith("/admin/services/edit")) {
    info = { title: "Edit Service", subtitle: "Update service content and pricing." };
  }

  if (!info && pathname.startsWith("/admin/orders/")) {
    info = { title: "Order Details", subtitle: "View customer details, files, and payment status." };
  }

  if (!info && pathname.startsWith("/admin/users/edit")) {
    info = { title: "Edit User", subtitle: "Update user access and status." };
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">Admin</p>
        <h1 className="text-xl font-bold text-slate-900">{info?.title || "Control Panel"}</h1>
        <p className="text-sm text-slate-500">{info?.subtitle || "Manage your website."}</p>
      </div>
    </header>
  );
}

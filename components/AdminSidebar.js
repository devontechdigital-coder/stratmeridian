"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BriefcaseBusiness, FileText, FolderTree, Home, Images, LayoutDashboard, LogOut, Menu, MessageSquareText, ReceiptText, Settings, ShieldCheck, Users, X } from "lucide-react";
import { hasModulePermission } from "@/lib/permissions";

const navItems = [
  { label: "Dashboard", href: "/admin", exact: true, permission: "dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", permission: "users", icon: Users },
  { label: "Pages", href: "/admin/pages", permission: "pages", icon: FileText },
  { label: "Categories", href: "/admin/categories", permission: "categories", icon: FolderTree },
  { label: "Services", href: "/admin/services", permission: "services", icon: BriefcaseBusiness },
  { label: "Orders", href: "/admin/orders", permission: "orders", icon: ReceiptText },
  { label: "Enquiries", href: "/admin/enquiries", permission: "enquiries", icon: MessageSquareText },
  { label: "Gallery", href: "/admin/gallery", permission: "gallery", icon: Images },
  {
    label: "Settings",
    href: "/admin/settings",
    permission: "settings",
    icon: Settings,
    children: [
      { label: "Theme Settings", href: "/admin/settings/theme" },
      { label: "Home Page Settings", href: "/admin/settings/home-page" },
      { label: "Header Menu", href: "/admin/settings/menus/header" },
      { label: "Footer Menu", href: "/admin/settings/menus/footer" },
    ],
  },
  { label: "Sub-Admins", href: "/admin/sub-admins", adminOnly: true, icon: ShieldCheck },
];

export default function AdminSidebar({ collapsed, onToggleCollapse }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openDropdowns, setOpenDropdowns] = useState({ Settings: true });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [websiteName, setWebsiteName] = useState("");
  const [websiteLogo, setWebsiteLogo] = useState("");

  useEffect(() => {
    fetch("/api/settings/theme")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWebsiteName(data.data?.websiteName || "");
          setWebsiteLogo(data.data?.metaLogo || "");
        }
      })
      .catch(() => {});
  }, []);

  const isActive = (href, exact = false) => exact ? pathname === href : pathname.startsWith(href);
  const canSee = (item) => {
    if (session?.user?.role === "admin") return true;
    if (item.adminOnly) return false;
    if (item.permission) return hasModulePermission(session?.user, item.permission, "view");
    return true;
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-md lg:hidden"
        aria-label="Open sidebar"
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={`fixed left-0 top-0 z-30 flex h-full flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex min-h-[72px] items-center justify-between border-b border-slate-100 px-4 py-5">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              {websiteLogo && (
                <div className="flex h-11 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white">
                  <img src={websiteLogo} alt={websiteName || "Logo"} className="h-full w-full object-contain p-1.5" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold leading-tight tracking-wide text-slate-900">{websiteName ? `${websiteName} Admin` : "Admin"}</p>
                <p className="text-xs font-medium text-violet-500">Control Panel</p>
              </div>
            </div>
          ) : (
             null
          )}

          <button
            onClick={() => onToggleCollapse && onToggleCollapse(!collapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:flex"
            aria-label="Toggle sidebar"
            type="button"
          >
            <X className={`h-4 w-4 transition-transform ${collapsed ? "rotate-45" : ""}`} />
          </button>
        </div>

        {!collapsed && session?.user && (
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white shadow-sm">
                {session.user.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold text-slate-800">{session.user.name}</p>
                <p className="truncate text-xs text-slate-500">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}

        {!collapsed && <p className="px-4 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</p>}

        <nav className="flex-1  overflow-y-auto px-2 py-2">
          {navItems.filter(canSee).map((item) => {
            const Icon = item.icon;
            if (item.children) {
              const isOpen = openDropdowns[item.label];
              const active = item.children.some((child) => pathname.startsWith(child.href));

              return (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      if (collapsed) onToggleCollapse && onToggleCollapse(false);
                      setOpenDropdowns((prev) => ({ ...prev, [item.label]: !prev[item.label] }));
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                      active ? "border border-violet-200/70 bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    type="button"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="flex-1 text-left text-sm font-medium">{item.label}</span>}
                  </button>
                  {!collapsed && (
                    <div className={`overflow-hidden transition-all ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="ml-4 mt-0.5  border-l border-slate-200 pb-0.5 pl-4">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                              pathname.startsWith(child.href) ? "bg-violet-50 font-semibold text-violet-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  isActive(item.href, item.exact) ? "border border-violet-200/70 bg-violet-50 text-violet-700 shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className=" border-t border-slate-100 px-2 py-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800">
            <Home className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">View Site</span>}
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600" type="button">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

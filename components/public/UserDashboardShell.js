"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import styles from "@/components/public/meridianTheme.module.css";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "bi-grid-1x2", exact: true },
  { href: "/dashboard/orders", label: "My Orders", icon: "bi-bag-check" },
  { href: "/dashboard/invoices", label: "Invoices", icon: "bi-receipt" },
  { href: "/dashboard/profile", label: "My Profile", icon: "bi-person-circle" },
  { href: "/dashboard/documents", label: "Documents", icon: "bi-folder2-open" },
];

export default function UserDashboardShell({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState({ websiteName: "Strat Meridian", metaLogo: "" });
  const initials = (session?.user?.name || session?.user?.email || "U").slice(0, 2).toUpperCase();

  useEffect(() => {
    fetch("/api/settings/theme")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTheme({
            websiteName: data.data?.websiteName || "Strat Meridian",
            metaLogo: data.data?.metaLogo || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className={`ud-wrap ${styles.shell}`}>
      <aside className="ud-sidebar">
        <div className="ud-logo">
          {theme.metaLogo ? <img src={theme.metaLogo} alt={theme.websiteName || "Logo"} /> : theme.websiteName}
        </div>
        <div className="ud-user">
          <div className="ud-avatar">{initials}</div>
          <div>
            <div className="ud-name">{session?.user?.name || "Client"}</div>
            <div className="ud-email">{session?.user?.email}</div>
          </div>
        </div>
        <nav className="ud-nav">
          <div className="ud-section">Main</div>
          {nav.slice(0, 3).map((item) => <DashLink key={item.href} item={item} pathname={pathname} />)}
          <div className="ud-section mt-3">Account</div>
          {nav.slice(3).map((item) => <DashLink key={item.href} item={item} pathname={pathname} />)}
        </nav>
        <div className="ud-footer">
          <Link href="/"><i className="bi bi-box-arrow-left" /> Back to Website</Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })}><i className="bi bi-power" /> Sign Out</button>
        </div>
      </aside>
      <main className="ud-main">
        <div className="ud-topbar">
          <div className="ud-title">{titleForPath(pathname)}</div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn btn-sm btn-danger"><i className="bi bi-box-arrow-right" /> Sign Out</button>
 
        </div>
        <div className="ud-content">{children}</div>
      </main>
    </div>
  );
}

function DashLink({ item, pathname }) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  return (
    <Link href={item.href} className={`ud-link ${active ? "active" : ""}`}>
      <i className={`bi ${item.icon}`} /> {item.label}
    </Link>
  );
}

function titleForPath(pathname) {
  if (pathname.startsWith("/dashboard/orders")) return "My Orders";
  if (pathname.startsWith("/dashboard/invoices")) return "Invoices";
  if (pathname.startsWith("/dashboard/profile")) return "My Profile";
  if (pathname.startsWith("/dashboard/documents")) return "Documents";
  return "Dashboard";
}

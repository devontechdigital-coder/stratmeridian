import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import UserDashboardShell from "@/components/public/UserDashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
      <style>{`
        .ud-wrap{--green:var(--gold);--cyan:var(--gold);--coral:#F0A988;--dark:var(--ink-primary);--dark2:var(--ink-secondary);--dark3:var(--ink-secondary);--dark4:var(--ink-secondary);--muted:var(--text-on-dark-mute);--text:var(--text-on-dark-mute);--text-d:var(--text-on-dark-mute);display:flex;min-height:100vh;background:var(--dark);color:var(--text);font-family:var(--sans, Raleway, sans-serif)}
        .ud-sidebar{width:260px;position:fixed;inset:0 auto 0 0;background:var(--dark2);border-right:1px solid rgba(198,167,107,.12);display:flex;flex-direction:column;z-index:10}
        .ud-logo{height:76px;padding:16px 24px;border-bottom:1px solid rgba(198,167,107,.12);font-family:var(--serif, Raleway, sans-serif);font-weight:500;font-size:1.4rem;color:var(--text-on-dark, #fff);letter-spacing:.01em;display:flex;align-items:center}
        .ud-logo img{max-width:142px;max-height:46px;object-fit:contain;display:block}
        .ud-user{display:flex;gap:12px;align-items:center;padding:20px 24px;border-bottom:1px solid rgba(198,167,107,.12)}
        .ud-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--green);color:var(--ink-primary, #000);font-weight:900;flex-shrink:0}
        .ud-name{font-size:.88rem;font-weight:800;color:var(--text-on-dark, #fff)}.ud-email{font-size:.74rem;color:var(--muted);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .ud-nav{padding:20px 16px;flex:1}.ud-section{font-size:.6rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);padding:10px 12px 6px}
        .ud-link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:2px;color:var(--text-d);font-size:.88rem;font-weight:700;transition:.2s;margin-bottom:3px;text-decoration:none}
        .ud-link:hover{background:rgba(198,167,107,.06);color:var(--text-on-dark, #fff)}.ud-link.active{background:rgba(198,167,107,.1);color:var(--green);border:1px solid rgba(198,167,107,.28)}
        .ud-footer{padding:16px 24px;border-top:1px solid rgba(198,167,107,.12);display:grid;gap:10px}.ud-footer a,.ud-footer button{display:flex;align-items:center;gap:10px;background:none;border:0;color:var(--muted);font-size:.82rem;text-decoration:none;padding:0}.ud-footer a:hover,.ud-footer button:hover{color:var(--coral)}
        .ud-main{margin-left:260px;flex:1;min-height:100vh}.ud-topbar{position:sticky;top:0;z-index:5;background:var(--dark2);border-bottom:1px solid rgba(198,167,107,.12);padding:18px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px}.ud-title{font-family:var(--serif, Raleway, sans-serif);font-size:1.3rem;font-weight:500;color:var(--text-on-dark, #fff)}
        .ud-main-btn{display:inline-flex;align-items:center;gap:8px;background:var(--green);color:var(--ink-primary, #000)!important;font-weight:800;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;padding:11px 22px;border-radius:2px;text-decoration:none}.ud-content{padding:32px}
        .ud-card{background:var(--dark3);border:1px solid rgba(198,167,107,.14);border-radius:18px;padding:24px}.ud-card-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid rgba(198,167,107,.12)}.ud-card-title{font-size:.9rem;font-weight:900;color:var(--text-on-dark, #fff);margin:0}
        .ud-stat{background:var(--dark3);border:1px solid rgba(198,167,107,.14);border-radius:18px;padding:24px;position:relative;overflow:hidden}.ud-stat:before{content:"";position:absolute;inset:0 0 auto;height:2px;background:var(--green)}.ud-stat-val{font-family:var(--serif, Raleway, sans-serif);font-size:1.9rem;font-weight:500;color:var(--text-on-dark, #fff);line-height:1}.ud-stat-label{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:6px}
        .ud-table{width:100%;border-collapse:collapse}.ud-table th{font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding:12px 16px;border-bottom:1px solid rgba(198,167,107,.14);text-align:left}.ud-table td{padding:14px 16px;border-bottom:1px solid rgba(198,167,107,.08);font-size:.88rem;color:var(--text-d);vertical-align:middle}.ud-table td strong{color:var(--text-on-dark, #fff)}
        .ud-badge{display:inline-flex;padding:4px 10px;border-radius:999px;background:rgba(198,167,107,.12);color:var(--green);font-size:.68rem;font-weight:900;text-transform:uppercase;border:1px solid rgba(198,167,107,.28)}
        .ud-outline{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(198,167,107,.2);border-radius:6px;color:var(--text-d)!important;text-decoration:none;font-size:.75rem;font-weight:800;text-transform:uppercase;padding:7px 14px}.ud-outline:hover{color:var(--text-on-dark, #fff)!important;border-color:rgba(198,167,107,.45)}
        @media(max-width:991px){.ud-sidebar{position:relative;width:100%;min-height:auto}.ud-wrap{display:block}.ud-main{margin-left:0}.ud-topbar{position:relative}.ud-content{padding:20px}}
      `}</style>
      <UserDashboardShell>{children}</UserDashboardShell>
    </>
  );
}

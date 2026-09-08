import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PublicShell from "@/components/public/PublicShell";
import { getThemeSettings } from "@/lib/getSettings";
import { getMenuItems } from "@/lib/getMenus";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }) {
  const [settings, headerMenuItems, footerMenuItems] = await Promise.all([
    getThemeSettings(),
    getMenuItems("header"),
    getMenuItems("footer"),
  ]);

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
      <div className="atf-public" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--dark)' }}>
        <PublicShell>
          <Header settings={settings} initialNavItems={headerMenuItems} />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer settings={settings} initialFooterItems={footerMenuItems} />
        </PublicShell>
      </div>
    </>
  );
}

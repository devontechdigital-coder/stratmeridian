import Link from "next/link";
import styles from "@/components/public/meridianTheme.module.css";

const fallbackFooterItems = [
  { id: "footer-home", text: "Home", href: "/#home", target: "_self", children: [] },
  { id: "footer-services", text: "Services", href: "/#services", target: "_self", children: [] },
  { id: "footer-contact", text: "Contact Us", href: "/contact", target: "_self", children: [] },
  { id: "footer-transfer-pricing", text: "Transfer Pricing", href: "/service/transfer-pricing", target: "_self", children: [] },
  { id: "footer-international-tax", text: "International Tax", href: "/service/international-tax", target: "_self", children: [] },
  { id: "footer-uae-corporate-tax", text: "UAE Corporate Tax", href: "/service/uae-corporate-tax", target: "_self", children: [] },
  { id: "footer-accounting-services", text: "Accounting Services", href: "/service/accounting-services", target: "_self", children: [] },
];

export default function Footer({ settings = null, initialFooterItems = [] }) {
  const websiteName = settings?.websiteName?.trim() || "Strat Meridian";
  const logoUrl = settings?.metaLogo?.trim();
  const footerTagline = settings?.footerTagline?.trim() || "International tax, transfer pricing, UAE corporate tax, and accounting advisory for multinational groups and global investors.";
  const footerCredit = settings?.footerCredit?.trim();
  const phone = settings?.phoneNumber || "+1 234 567 890";
  const email = settings?.emailId || "info@example.com";
  const address = [settings?.address, settings?.city, settings?.state, settings?.country].filter(Boolean).join(", ");
  const footerItems = Array.isArray(initialFooterItems) && initialFooterItems.length > 0 ? initialFooterItems : fallbackFooterItems;
  const quickLinks = footerItems.filter((item) => !item.href?.startsWith("/service/"));
  const serviceLinks = footerItems.filter((item) => item.href?.startsWith("/service/"));

  return (
    <footer className={`${styles.shell} ${styles.footer}`}>
      <div className={styles.wrap}>
        <div className={styles.footerGrid}>
          <div>
            <span className={styles.footerLogo}>
              {logoUrl ? (
                <img width="100" src={logoUrl} alt={websiteName} style={{ borderRadius: 5 }} />
              ) : (
                websiteName
              )}
            </span>
            <p className={styles.footerTag}>{footerTagline}</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            {quickLinks.map((item) => <FooterLink key={item.id || item.href} item={item} />)}
          </div>
          <div>
            <h4>Services</h4>
            {serviceLinks.map((item) => <FooterLink key={item.id || item.href} item={item} />)}
          </div>
          <div>
            <h4>Connect</h4>
            {address && <span>{address}</span>}
            <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
            <a href={`mailto:${email}`}>{email}</a>
            <Link href="/contact">Book Consultation</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>{footerCredit || <>&copy; 2026 {websiteName}. All Rights Reserved.</>}</span>
          <span>
            Website Design By{" "}
            <a href="https://seotowebdesign.com/" target="_blank" rel="noreferrer">
              SEO To Webdesign
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ item }) {
  const href = item.href || "/";
  const target = item.target || "_self";
  const isExternal = /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");

  if (isExternal || target === "_blank") {
    return <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>{item.text}</a>;
  }

  return <Link href={href}>{item.text}</Link>;
}

import Link from "next/link";
import styles from "@/components/public/meridianTheme.module.css";

export default function Footer({ settings = null }) {
  const websiteName = settings?.websiteName?.trim() || "Strat Meridian";
  const logoUrl = settings?.metaLogo?.trim();
  const phone = settings?.phoneNumber || "+1 234 567 890";
  const email = settings?.emailId || "info@example.com";
  const address = [settings?.address, settings?.city, settings?.state, settings?.country].filter(Boolean).join(", ");

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
            <p className={styles.footerTag}>
              Professional US tax filing support for students, visa holders, citizens, and individuals with foreign income or complex tax situations.
            </p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <Link href="/#home">Home</Link>
            <Link href="/#services">Services</Link>
            <Link href="/#documents">Documents</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <div>
            <h4>Services</h4>
            <Link href="/#services">1040 Filing</Link>
            <Link href="/#services">1040NR Filing</Link>
            <Link href="/#services">Foreign Income Support</Link>
            <Link href="/#services">FBAR Assistance</Link>
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
          <span>© 2026 {websiteName}. All Rights Reserved.</span>
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

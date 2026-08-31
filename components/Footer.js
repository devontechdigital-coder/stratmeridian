import Link from "next/link";
import styles from "@/components/public/meridianTheme.module.css";

const logoUrl = "https://static.wixstatic.com/media/07bc36_bc0c9dbee948416eb3b96deace2dec65~mv2.png/v1/fill/w_276,h_108,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/07bc36_bc0c9dbee948416eb3b96deace2dec65~mv2.png";

export default function Footer({ settings = null }) {
  const websiteName = settings?.websiteName || "Strat Meridian";
  const phone = settings?.phoneNumber || "+1 234 567 890";
  const email = settings?.emailId || "info@example.com";
  const address = [settings?.address, settings?.city, settings?.state, settings?.country].filter(Boolean).join(", ");

  return (
    <footer className={`${styles.shell} ${styles.footer}`}>
      <div className={styles.wrap}>
        <div className={styles.footerGrid}>
          <div>
            <span className={styles.footerLogo}>
              <img width="100" src={logoUrl} alt={websiteName} style={{ borderRadius: 5 }} />
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

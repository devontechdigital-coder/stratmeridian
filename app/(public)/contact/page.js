"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EnquiryForm from "@/components/public/EnquiryForm";
import styles from "@/components/public/meridianTheme.module.css";

const trustItems = [
  ["bi-lightning-charge", "Quick Response", "Get timely replies to your tax filing questions and support needs."],
  ["bi-file-earmark-check", "Clear Guidance", "We explain the next steps, required documents, and filing flow simply."],
  ["bi-shield-lock", "Secure Process", "Your details are handled carefully with privacy and professionalism."],
  ["bi-people", "Friendly Support", "Helpful communication for both simple and more complex tax situations."],
];

export default function ContactPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const revealOnScroll = () => {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 80) el.classList.add(styles.active);
      });
    };
    revealOnScroll();
    window.addEventListener("scroll", revealOnScroll);
    return () => window.removeEventListener("scroll", revealOnScroll);
  }, []);

  useEffect(() => {
    fetch("/api/settings/theme")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSettings(data.data || {});
      })
      .catch(() => {});
  }, []);

  const contact = useMemo(() => {
    const address = [settings?.address, settings?.city, settings?.state, settings?.country].filter(Boolean).join(", ");
    return {
      name: settings?.websiteName || "Strat Meridian",
      logo: settings?.metaLogo || "",
      phone: settings?.phoneNumber || "",
      email: settings?.emailId || "",
      address,
    };
  }, [settings]);

  const contactCards = [
    { label: "Phone", main: contact.phone || "Add phone number in Theme Settings", href: contact.phone ? `tel:${contact.phone.replace(/\s/g, "")}` : "" },
    { label: "Email", main: contact.email || "Add email address in Theme Settings", href: contact.email ? `mailto:${contact.email}` : "" },
    { label: "Office Address", main: contact.address || "Add business address in Theme Settings", href: "" },
  ];

  return (
    <div className={`${styles.shell} ${styles.page}`}>
      <section className={styles.pageHero}>
        <div className={styles.wrap}>
          <div className={styles.breadcrumb}><Link href="/">Home</Link> / Contact</div>
          <div className={styles.heroEyebrow}>Get In Touch</div>
          <h1>Let&apos;s talk about your <em>tax filing needs</em>.</h1>
          <p>Have questions about your return, documents, pricing, or next steps? Reach out and we&apos;ll guide you with clear, professional support.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.contactGrid}>
            <div className={styles.reveal} data-reveal>
              <div className={styles.eyebrow}>Reach Us</div>
              <h2 className={styles.serif} style={{ fontSize: "clamp(28px,3vw,38px)", margin: "16px 0 30px" }}>
                Get in touch.
              </h2>
              {contact.logo && (
                <div style={{ marginBottom: 24 }}>
                  <img src={contact.logo} alt={contact.name} style={{ maxHeight: 54, maxWidth: 180, objectFit: "contain" }} />
                </div>
              )}
              <div className={styles.contactCards}>
                {contactCards.map((card) => (
                  <div className={styles.contactCard} key={card.label}>
                    <div className={styles.ccLabel}>{card.label}</div>
                    {card.href ? (
                      <a className={styles.ccLink} href={card.href}>{card.main}</a>
                    ) : (
                      <div className={styles.ccSub}>{card.main}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.reveal} data-reveal id="cu-contact-form">
              <div className={styles.contactFormPanel}>
                <h3>Send Us a Message</h3>
                <p className={styles.csub}>Fill out the form below and our team will get back to you as soon as possible.</p>
                <EnquiryForm source="contact" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={`${styles.head} ${styles.reveal}`} data-reveal style={{ textAlign: "center", margin: "0 auto 50px" }}>
            <div className={styles.eyebrow}>Why Contact Us</div>
            <h2>We&apos;re Here to <span style={{ color: "var(--gold)" }}>Help</span></h2>
            <p>We keep communication simple, professional, and focused on helping you move forward confidently.</p>
          </div>
          <div className={`${styles.whyGrid} ${styles.reveal}`} data-reveal>
            {trustItems.map(([icon, title, text]) => (
              <div className={styles.whyPanel} key={title}>
                <i className={`bi ${icon}`} style={{ color: "var(--gold)", fontSize: 22, marginBottom: 16, display: "block" }} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

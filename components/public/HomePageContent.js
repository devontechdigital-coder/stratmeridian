"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EnquiryForm from "@/components/public/EnquiryForm";
import styles from "@/components/public/meridianTheme.module.css";

export default function HomePageContent({ settings }) {
  const [typed, setTyped] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [activeService, setActiveService] = useState(0);
  const [openServiceCards, setOpenServiceCards] = useState(() => new Set());

  useEffect(() => {
    const words = settings.hero.words?.filter(Boolean) || [];
    if (!words.length) return undefined;
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer;
    const typeEffect = () => {
      const word = words[wordIndex];
      setTyped(word.substring(0, charIndex));
      if (!deleting && charIndex < word.length) {
        charIndex += 1;
        timer = setTimeout(typeEffect, 85);
      } else if (deleting && charIndex > 0) {
        charIndex -= 1;
        timer = setTimeout(typeEffect, 40);
      } else {
        deleting = !deleting;
        if (!deleting) wordIndex = (wordIndex + 1) % words.length;
        timer = setTimeout(typeEffect, deleting ? 1400 : 300);
      }
    };
    typeEffect();
    return () => clearTimeout(timer);
  }, [settings.hero.words]);

  useEffect(() => {
    const revealOnScroll = () => {
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight - 70) element.classList.add(styles.active);
      });
    };
    revealOnScroll();
    window.addEventListener("scroll", revealOnScroll);
    return () => window.removeEventListener("scroll", revealOnScroll);
  }, []);

  const heroStyle = settings.hero.backgroundImage
    ? { backgroundImage: `linear-gradient(rgba(7, 15, 28, .72), rgba(7, 15, 28, .82)), url("${settings.hero.backgroundImage}")`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  const toggleServiceCard = (index) => {
    setOpenServiceCards((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className={`${styles.shell} ${styles.page}`}>
      {settings.hero.enabled && (
        <section className={styles.hero} id="home" style={heroStyle}>
          <div className={styles.wrap}>
            <div>
              <div className={styles.heroEyebrow}><i className={`bi ${settings.hero.badgeIcon}`} /> {settings.hero.badge}</div>
              <h1>{settings.hero.title}</h1>
              {!!settings.hero.words?.length && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 22, color: "var(--gold)" }}>{typed}</span>
                </div>
              )}
              <p className={styles.heroSub}>{settings.hero.description}</p>
              <div className={styles.heroCtas}>
                <SmartLink link={settings.hero.primaryButton} className={`${styles.btn} ${styles.btnGold}`} />
                <SmartLink link={settings.hero.secondaryButton} className={`${styles.btn} ${styles.btnOutlineLight}`} />
              </div>
              <div className={styles.heroTrust}>
                <span>Dubai advisory firm</span><span className={styles.sep} /><span>Multinational groups</span><span className={styles.sep} /><span>Global investors</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {settings.stats.enabled && (
        <div className={styles.wrap}>
          <div className={`${styles.statsRow} ${styles.reveal}`} data-reveal>
            {settings.stats.items.map((item, index) => (
              <div className={styles.statCell} key={`${item.label}-${index}`}>
                <div className={styles.statNum}>{item.value}</div>
                <div className={styles.statLabel}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settings.trust.enabled && (
        <div className={styles.authority}>
          <div className={styles.wrap}>
            {settings.trust.items.map((item, index) => (
              <div className={styles.authorityItem} key={`${item.label}-${index}`}>
                <span className={styles.mark}>—</span> {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {settings.approach?.enabled && (
      <section className={`${styles.positioning} ${styles.section}`}>
        <div className={styles.wrap}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.eyebrow}>{settings.approach.eyebrow}</div>
            <h2>{settings.approach.title}<br />{settings.approach.highlight}</h2>
            <p>{settings.approach.description}</p>
          </div>
          <div className={`${styles.flow} ${styles.reveal}`} data-reveal>
            {settings.approach.items.map((item, index) => (
              <div className={`${styles.flowStep} ${index === settings.approach.items.length - 1 ? styles.flowStepActive : ""}`} key={`${item.label}-${index}`}>
                <div className={styles.flabel}>{item.label}</div>
                <div className={styles.fword}>{item.word}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {settings.services.enabled && (
        <section className={`${styles.services} ${styles.section}`} id="services">
          <SectionIntro section={settings.services} headClassName={styles.head} />
          <div className={styles.wrap}>
            <div className={`${styles.serviceGrid} ${styles.reveal}`} data-reveal>
              <div className={styles.serviceList}>
                {settings.services.items.map((item, index) => (
                  <button
                    type="button"
                    key={`${item.title}-${index}`}
                    className={`${styles.serviceItem} ${activeService === index ? styles.serviceItemActive : ""}`}
                    onMouseEnter={() => setActiveService(index)}
                    onClick={() => setActiveService(index)}
                  >
                    <span className={styles.siNum}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.siTitle}>{item.title}</span>
                    <span className={styles.siLine} />
                  </button>
                ))}
              </div>
              <div className={styles.serviceDetail}>
                {settings.services.items[activeService] && (
                  <div className={styles.sdPane} key={activeService}>
                    <div className={styles.sdEyebrow}>Service {String(activeService + 1).padStart(2, "0")}</div>
                    <div className={styles.sdTitle}>{settings.services.items[activeService].title}</div>
                    <p className={styles.sdDesc}>{settings.services.items[activeService].text}</p>
                    {settings.services.items[activeService].href && (
                      <div style={{ marginTop: 24 }}>
                        <Link href={settings.services.items[activeService].href} className={`${styles.btn} ${styles.btnGold}`}>
                          Know More about Services
                          <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" /></svg>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.serviceAccordion}>
              {settings.services.items.map((item, index) => (
                <div key={`${item.title}-${index}`} className={`${styles.saItem} ${openServiceCards.has(index) ? styles.saItemOpen : ""}`}>
                  <button type="button" className={styles.saHead} onClick={() => toggleServiceCard(index)}>
                    <span className={styles.siTitle}>{String(index + 1).padStart(2, "0")} — {item.title}</span>
                    <span className={styles.saPlus} />
                  </button>
                  <div className={styles.saBody}>
                    <div className={styles.saBodyInner}>
                      {item.text}
                      {item.href && (
                        <div style={{ marginTop: 18 }}>
                          <Link href={item.href} className={`${styles.btn} ${styles.btnOutlineDark}`}>
                            Know More about Services
                            <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" /></svg>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.documents.enabled && (
        <section className={`${styles.checklist} ${styles.section}`} id="documents">
          <div className={styles.wrap}>
            <div className={`${styles.checklistIntro} ${styles.reveal}`} data-reveal>
              <div className={styles.eyebrow}>{settings.documents.eyebrow}</div>
              <h2>{settings.documents.title} <span style={{ color: "var(--gold)" }}>{settings.documents.highlight}</span></h2>
              <p>{settings.documents.description}</p>
            </div>
            <div className={`${styles.checklistGrid} ${styles.reveal}`} data-reveal>
              {settings.documents.items.map((item, index) => (
                <div className={styles.checklistGroup} key={`${item.title}-${index}`}>
                  <div className={styles.checklistLabel}><i className={`bi ${item.icon}`} /> {item.title}</div>
                  <ul className={styles.checklistList}>
                    {item.list.map((entry, entryIndex) => <li key={`${entry}-${entryIndex}`}>{entry}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 44 }}><SmartLink link={settings.documents.button} className={`${styles.btn} ${styles.btnOutlineDark}`} /></div>
          </div>
        </section>
      )}

      {settings.global?.enabled && (
      <section className={`${styles.global} ${styles.section}`}>
        <div className={styles.wrap}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.eyebrow}>{settings.global.eyebrow}</div>
            <h2>{settings.global.title}<br />{settings.global.highlight}</h2>
            {settings.global.description && <p>{settings.global.description}</p>}
          </div>
          <div className={`${styles.globalCols} ${styles.reveal}`} data-reveal>
            {settings.global.items.map((col, index) => (
              <div key={`${col.title}-${index}`}><h3>{col.title}</h3><p>{col.text}</p></div>
            ))}
          </div>
        </div>
      </section>
      )}

      {settings.features.enabled && (
        <section className={`${styles.why} ${styles.section}`} id="about">
          <SectionIntro section={settings.features} headClassName={styles.head} />
          <div className={styles.wrap}>
            <div className={`${styles.whyGrid} ${styles.reveal}`} data-reveal>
              {settings.features.items.map((item, index) => (
                <div className={styles.whyPanel} key={`${item.title}-${index}`}>
                  <div className={styles.wn}>{String(index + 1).padStart(2, "0")} / {String(settings.features.items.length).padStart(2, "0")}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.leadership?.enabled && (
      <section className={`${styles.leadership} ${styles.section}`} id="leadership">
        <div className={styles.wrap}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.eyebrow}>{settings.leadership.eyebrow}</div>
            <h2>{settings.leadership.title} <span style={{ color: "var(--gold)" }}>{settings.leadership.highlight}</span></h2>
            {settings.leadership.description && <p>{settings.leadership.description}</p>}
          </div>
        </div>
        <div className={styles.wrap}>
          <div className={`${styles.partnerGrid} ${styles.reveal}`} data-reveal>
            {settings.leadership.items.map((member, index) => (
              <Link className={styles.partnerCard} href={member.href || "/our-leadership-team"} key={`${member.title}-${index}`}>
                <div className={styles.partnerPhoto}>
                  {member.image ? (
                    <img src={member.image} alt={member.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className={styles.initials}>{getInitials(member.title)}</span>
                  )}
                </div>
                <div className={styles.partnerInfo}>
                  <h3>{member.title}</h3>
                  {member.role && <p className={styles.partnerRole}>{member.role}</p>}
                  <p className={styles.partnerBio}>{member.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {settings.who?.enabled && (
      <section className={`${styles.who} ${styles.section}`}>
        <div className={styles.wrap}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.eyebrow}>{settings.who.eyebrow}</div>
            <h2>{settings.who.title} <span style={{ color: "var(--gold)" }}>{settings.who.highlight}</span></h2>
            {settings.who.description && <p>{settings.who.description}</p>}
          </div>
          <div className={`${styles.whoList} ${styles.reveal}`} data-reveal>
            {settings.who.items.map((item, index) => (
              <div className={styles.whoItem} key={`${item.num}-${index}`}>
                <div className={styles.wn}>{item.num}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {settings.process.enabled && (
        <section className={`${styles.process} ${styles.section}`} id="process">
          <SectionIntro section={settings.process} headClassName={styles.head} />
          <div className={styles.wrap}>
            <div className={`${styles.processRow} ${styles.reveal}`} data-reveal>
              <div className={styles.processLineFill} />
              {settings.process.items.map((item, index) => (
                <div className={styles.processStep} key={`${item.number}-${index}`}>
                  <div className={styles.pnum}>{item.number}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.insights?.enabled && (
      <section className={`${styles.insights} ${styles.section}`} id="insights">
        <div className={styles.wrap}>
          <div className={`${styles.head} ${styles.reveal}`} data-reveal>
            <div>
              <div className={styles.eyebrow}>{settings.insights.eyebrow}</div>
              <h2>{settings.insights.title} <span style={{ color: "var(--gold)" }}>{settings.insights.highlight}</span></h2>
              {settings.insights.description && <p>{settings.insights.description}</p>}
            </div>
          </div>
          <div className={`${styles.articleGrid} ${styles.reveal}`} data-reveal>
            {settings.insights.items.map((article, index) => (
              <div className={styles.articleCard} key={article.title}>
                <div className={styles.acBody}>
                  {article.href ? <Link href={article.href}><h3>{article.title}</h3></Link> : <h3>{article.title}</h3>}
                  <div className={styles.articleTag}>{article.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {settings.faq.enabled && (
        <section className={`${styles.faq} ${styles.section}`} id="faq">
          <SectionIntro section={settings.faq} headClassName={styles.head} />
          <div className={styles.wrap}>
            <div className={styles.reveal} data-reveal>
              {settings.faq.items.map((item, index) => (
                <div className={`${styles.faqItem} ${openFaq === index ? styles.faqItemOpen : ""}`} key={`${item.question}-${index}`}>
                  <button type="button" className={styles.faqQ} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    {item.question}
                    <span className={styles.faqPlus} />
                  </button>
                  <div className={styles.faqA}>
                    <div className={styles.faqAInner}>{item.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.cta.enabled && (
        <section className={styles.finalCta}>
          <div className={styles.wrap}>
            <div className={styles.eyebrow}>{settings.cta.eyebrow}</div>
            <h2>{settings.cta.title}<br /><span style={{ color: "var(--gold)" }}>{settings.cta.highlight}</span></h2>
            <p>{settings.cta.description}</p>
            <div className={styles.finalCtaCtas}>
              <SmartLink link={settings.cta.primaryButton} className={`${styles.btn} ${styles.btnGold}`} />
              <SmartLink link={settings.cta.secondaryButton} className={`${styles.btn} ${styles.btnOutlineLight}`} />
            </div>
          </div>
        </section>
      )}

      {settings.contact.enabled && <ContactSection section={settings.contact} />}
    </div>
  );
}

function SmartLink({ link, className }) {
  if (!link?.label) return null;
  const href = link.href || "#";
  const content = (
    <>
      {link.label}
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" /></svg>
    </>
  );
  if (href.startsWith("/") && !href.startsWith("//")) return <Link href={href} className={className}>{content}</Link>;
  return <a href={href} className={className}>{content}</a>;
}

function getInitials(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3);
}

function SectionIntro({ section, headClassName }) {
  return (
    <div className={styles.wrap}>
      <div className={`${headClassName} ${styles.reveal}`} data-reveal>
        <div className={styles.eyebrow}>{section.eyebrow}</div>
        <h2>{section.title} <span style={{ color: "var(--gold)" }}>{section.highlight}</span></h2>
        <p>{section.description}</p>
      </div>
    </div>
  );
}

function ContactSection({ section }) {
  return (
    <section className={`${styles.section}`} id="contact">
      <div className={styles.wrap}>
        <div className={`${styles.head} ${styles.reveal}`} data-reveal>
          <div className={styles.eyebrow}>{section.eyebrow}</div>
          <h2 style={{ color: "black" }} >{section.title} <span style={{ color: "var(--gold)" }}>{section.highlight}</span></h2>
          <p>{section.description}</p>
        </div>
        <div className={styles.contactGrid}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.contactFormPanel}>
              <h3>{section.panelTitle}</h3>
              <p className={styles.csub}>{section.panelDescription}</p>
              <EnquiryForm source="home" content={section.form} />
            </div>
          </div>
          <div className={styles.reveal} data-reveal>
            <div className={styles.contactCards}>
              {section.items.map((item, index) => (
                <div className={styles.contactCard} key={`${item.title}-${index}`}>
                  <div className={styles.ccLabel}><i className={`bi ${item.icon}`} /> {item.title}</div>
                  <div className={styles.ccMain}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

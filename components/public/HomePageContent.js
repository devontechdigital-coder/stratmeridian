"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EnquiryForm from "@/components/public/EnquiryForm";
import styles from "@/components/public/meridianTheme.module.css";

const whoWeHelp = [
  { num: "01", title: "Students", text: "First-time filers navigating US tax rules alongside coursework and campus life." },
  { num: "02", title: "Visa Holders", text: "Nonresident and dual-status filers who need 1040NR and treaty guidance done right." },
  { num: "03", title: "US Citizens Abroad", text: "Expats balancing US filing obligations with income and accounts held overseas." },
  { num: "04", title: "Foreign Income Filers", text: "Individuals reporting foreign income, FBAR, and FATCA alongside a US return." },
];

const crossBorderCols = [
  { title: "Foreign Income", text: "Reporting foreign wages, investments, and self-employment income correctly." },
  { title: "Treaty Benefits", text: "Identifying tax treaty relief available to your visa or residency status." },
  { title: "FBAR & FATCA", text: "Foreign account and asset disclosure handled alongside your regular filing." },
];

const ourTeam = [
  { num: "01 / 03", title: "Filing Specialists", text: "Prepare and review 1040, 1040NR, and foreign income returns end to end." },
  { num: "02 / 03", title: "Document Review", text: "Check every upload against the requirements for your specific filing type." },
  { num: "03 / 03", title: "Client Support", text: "Answer questions by message or call as your filing moves through each step." },
];

const insightsPreview = [
  { title: "Filing a 1040NR for the first time: what international students should know", tag: "Placeholder — article pending" },
  { title: "FBAR vs FATCA: do you need to file both?", tag: "Placeholder — article pending" },
  { title: "Claiming tax treaty benefits as a visa holder", tag: "Placeholder — article pending" },
];

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
                <span>Trusted filing support</span><span className={styles.sep} /><span>Students &amp; visa holders</span><span className={styles.sep} /><span>Foreign income specialists</span>
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

      <section className={`${styles.positioning} ${styles.section}`}>
        <div className={styles.wrap}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.eyebrow}>Our Approach</div>
            <h2>Beyond filing.<br />Built for clarity.</h2>
            <p>We help students, visa holders, and individuals with foreign income navigate US tax filing with confidence — from a first W-2 to complex FBAR and foreign income reporting.</p>
          </div>
          <div className={`${styles.flow} ${styles.reveal}`} data-reveal>
            <div className={styles.flowStep}><div className={styles.flabel}>Starting Point</div><div className={styles.fword}>Complexity</div></div>
            <div className={styles.flowStep}><div className={styles.flabel}>Our Process</div><div className={styles.fword}>Review</div></div>
            <div className={styles.flowStep}><div className={styles.flabel}>Our Approach</div><div className={styles.fword}>Guidance</div></div>
            <div className={`${styles.flowStep} ${styles.flowStepActive}`}><div className={styles.flabel}>The Outcome</div><div className={styles.fword}>Clarity</div></div>
          </div>
        </div>
      </section>

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
                    <div className={styles.saBodyInner}>{item.text}</div>
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

      <section className={`${styles.global} ${styles.section}`}>
        <div className={styles.wrap}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.eyebrow}>Cross-Border Filing</div>
            <h2>Foreign income and accounts,<br />reported the right way.</h2>
          </div>
          <div className={`${styles.globalCols} ${styles.reveal}`} data-reveal>
            {crossBorderCols.map((col) => (
              <div key={col.title}><h3>{col.title}</h3><p>{col.text}</p></div>
            ))}
          </div>
        </div>
      </section>

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

      <section className={`${styles.leadership} ${styles.section}`}>
        <div className={styles.wrap}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.eyebrow}>Our Team</div>
            <h2>Support at every step of filing.</h2>
          </div>
        </div>
        <div className={styles.wrap}>
          <div className={`${styles.partnerGrid} ${styles.reveal}`} data-reveal>
            {ourTeam.map((member) => (
              <div className={styles.partnerCard} key={member.title}>
                <div className={styles.partnerPhoto}><span className={styles.initials}>{member.num}</span></div>
                <div className={styles.partnerInfo}>
                  <h3>{member.title}</h3>
                  <p className={styles.partnerBio}>{member.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.who} ${styles.section}`}>
        <div className={styles.wrap}>
          <div className={styles.reveal} data-reveal>
            <div className={styles.eyebrow}>Who We Help</div>
            <h2>Filing support built around your situation.</h2>
          </div>
          <div className={`${styles.whoList} ${styles.reveal}`} data-reveal>
            {whoWeHelp.map((item) => (
              <div className={styles.whoItem} key={item.num}>
                <div className={styles.wn}>{item.num}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className={`${styles.insights} ${styles.section}`} id="insights">
        <div className={styles.wrap}>
          <div className={`${styles.head} ${styles.reveal}`} data-reveal>
            <div><div className={styles.eyebrow}>Insights</div><h2>Perspective on what matters.</h2></div>
          </div>
          <div className={`${styles.articleGrid} ${styles.reveal}`} data-reveal>
            {insightsPreview.map((article) => (
              <div className={styles.articleCard} key={article.title}>
                <div className={styles.acBody}>
                  <h3>{article.title}</h3>
                  <div className={styles.articleTag}>{article.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

import connectToDatabase from '@/lib/mongodb';
import Service from '@/models/Service';
import '@/models/Category';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import EnquiryForm from '@/components/public/EnquiryForm';
import styles from '@/components/public/meridianTheme.module.css';

function renderHtml(model) {
  return model.editorPreference === 'raw' ? model.rawHtml : model.htmlContent;
}

function cssUrl(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function heroFeaturesFor(service) {
  const features = Array.isArray(service.heroFeatures)
    ? service.heroFeatures.filter((feature) => feature?.title || feature?.description)
    : [];
  if (features.length) return features;

  return [
    {
      icon: 'bi-shield-check',
      title: 'Secure filing support',
      description: 'Your details and documents stay organized through checkout.',
    },
    {
      icon: 'bi-file-earmark-check',
      title: 'Document guidance',
      description: service.uploadLabel || 'Upload the documents needed for your filing.',
    },
    {
      icon: 'bi-person-check',
      title: 'Expert review',
      description: 'Our team checks your submission before moving it forward.',
    },
  ];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectToDatabase();
  const service = await Service.findOne({ slug, status: 'active' });

  if (!service) return {};

  return {
    title: service.metaTitle || service.title,
    description: service.metaDescription,
    keywords: service.metaKeywords,
  };
}

export default async function PublicServicePage({ params }) {
  const { slug } = await params;
  await connectToDatabase();
  const service = await Service.findOne({ slug, status: 'active' }).populate('category', 'title slug');

  if (!service) {
    notFound();
  }
  const heroFeatures = heroFeaturesFor(service);
  const backgroundImageUrl = service.backgroundImageUrl?.trim();
  const heroStyle = backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(13,43,41,.86), rgba(7,28,27,.94)), url("${cssUrl(backgroundImageUrl)}")`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }
    : undefined;

  return (
    <div className={`${styles.shell} ${styles.page}`}>
      {service.customCss && <style dangerouslySetInnerHTML={{ __html: service.customCss }} />}
      <style>{`
        .service-enquiry-band{background:var(--ink-secondary);border-top:1px solid var(--gold);border-bottom:1px solid var(--gold);padding:34px 0}
        .service-enquiry-strip{display:grid;grid-template-columns:minmax(180px,1fr) minmax(180px,1fr) minmax(180px,1fr) minmax(240px,1.35fr) auto;gap:16px;align-items:end;max-width:var(--container);margin:0 auto;padding:0 40px}
        .service-enquiry-field{display:flex;flex-direction:column;gap:8px;min-width:0}
        .service-enquiry-field label{color:var(--gold);font-size:13px;font-weight:800;margin:0;letter-spacing:.04em;text-transform:uppercase}
        .service-enquiry-field input{height:52px;border:1px solid rgba(16,25,24,.14);border-radius:2px;background:var(--surface);color:var(--text-primary);font-size:15px;padding:0 14px;outline:none;width:100%;min-width:0;font-family:var(--sans)}
        .service-enquiry-field input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(198,167,107,.18)}
        .service-enquiry-submit{height:52px;border:0!important;border-radius:2px;background:var(--gold)!important;color:var(--ink-primary)!important;font-weight:700;font-size:14px;padding:0 20px;display:inline-flex;align-items:center;justify-content:center;gap:10px;white-space:nowrap}
        .service-enquiry-submit:hover{background:#d8bb84!important}
        .service-enquiry-submit:disabled{opacity:.7}
        .service-hero-card{position:relative;overflow:hidden;background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(198,167,107,.28);padding:32px}
        .service-hero-price{display:flex;align-items:end;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(237,234,224,.14);padding-bottom:20px;margin-bottom:22px}
        .service-hero-price span{display:block;color:var(--text-on-dark-mute);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em}
        .service-hero-price strong{display:block;color:var(--text-on-dark);font-size:32px;line-height:1;font-weight:300;font-family:var(--serif)}
        .service-hero-chip{border:1px solid rgba(198,167,107,.35);background:rgba(198,167,107,.1);color:var(--gold);border-radius:2px;padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
        .service-feature-grid{display:grid;gap:14px}
        .service-feature-card{display:grid;grid-template-columns:40px 1fr;gap:14px;align-items:start;border:1px solid rgba(237,234,224,.1);border-radius:2px;padding:16px;transition:.2s}
        .service-feature-card:hover{border-color:rgba(198,167,107,.4);background:rgba(198,167,107,.06)}
        .service-feature-icon{width:40px;height:40px;border-radius:2px;display:flex;align-items:center;justify-content:center;background:var(--gold);color:var(--ink-primary);font-size:18px}
        .service-feature-card h3{margin:0 0 5px;color:var(--text-on-dark);font-size:15px;font-weight:600;font-family:var(--sans)}
        .service-feature-card p{margin:0;color:var(--text-on-dark-mute);font-size:13px;line-height:1.5}
        .service-hero-action{position:relative;margin-top:20px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid rgba(237,234,224,.1);padding-top:20px;color:var(--text-on-dark-mute);font-size:13px}
        .service-hero-action a{display:inline-flex;align-items:center;gap:8px;color:var(--ink-primary)!important;background:var(--gold);border-radius:2px;padding:10px 16px;text-decoration:none;font-size:12px;font-weight:700;text-transform:uppercase;white-space:nowrap}
        @media(max-width:1199px){.service-enquiry-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.service-enquiry-submit{width:100%}}
        @media(max-width:640px){.service-enquiry-strip{grid-template-columns:1fr}.service-enquiry-field input{font-size:16px}.service-enquiry-submit{font-size:16px}}
      `}</style>

      <section
        className={styles.pageHero}
        style={heroStyle}
      >
        <div className={styles.wrap}>
          <div className={styles.serviceHeroGrid}>
            <div>
              <div className={styles.breadcrumb}><Link href="/">Home</Link> / {service.title}</div>
              <div className={styles.heroEyebrow}>Service</div>
              <h1 style={{ fontSize: "clamp(36px,4.4vw,56px)" }}>{service.title}</h1>

              {service.shortParagraph && <p>{service.shortParagraph}</p>}

              <div style={{ marginTop: 28 }}>
                <Link href={`/checkout?service=${service.slug}`} className={`${styles.btn} ${styles.btnGold}`}>
                  {service.buttonLabel || 'Apply Now'}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" /></svg>
                </Link>
              </div>
            </div>

            <div className="service-hero-card">
              <div className="service-hero-price">
                <div>
                  <span>Service fee</span>
                  <strong>
                    {Number(service.price || 0) > 0
                      ? `$${Number(service.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'Custom'}
                  </strong>
                </div>
                <div className="service-hero-chip">Ready online</div>
              </div>
              <div className="service-feature-grid">
                {heroFeatures.map((feature, index) => (
                  <div className="service-feature-card" key={`${feature.title || 'feature'}-${index}`}>
                    <div className="service-feature-icon">
                      <i className={`bi ${feature.icon || 'bi-shield-check'}`} />
                    </div>
                    <div>
                      <h3>{feature.title || 'Service feature'}</h3>
                      {feature.description && <p>{feature.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="service-hero-action">
                <span>Start securely and finish details on checkout.</span>
                <Link href={`/checkout?service=${service.slug}`}>Buy Now</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="service-enquiry-band">
        <EnquiryForm
          source="service"
          serviceId={service._id.toString()}
          serviceTitle={service.title}
          variant="strip"
        />
      </section>

      {renderHtml(service) && (
        <div className={styles.section}>
          <div className={styles.wrap} style={{ color: "var(--text-primary)" }} dangerouslySetInnerHTML={{ __html: renderHtml(service) }} />
        </div>
      )}

      {service.customJs && (
        <Script id={`custom-js-service-${service.slug}`} strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: service.customJs }} />
      )}
    </div>
  );
}

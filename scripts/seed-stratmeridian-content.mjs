import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

loadEnv(path.join(process.cwd(), '.env.local'));

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is missing in .env.local');
}

const SettingsSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ServiceSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const CategorySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const PageSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const MenuItemSchema = new mongoose.Schema({}, { strict: false, _id: false });
const MenuSchema = new mongoose.Schema({
  type: String,
  items: [MenuItemSchema],
}, { strict: false, timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Page = mongoose.models.Page || mongoose.model('Page', PageSchema);
const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);

const sourceUrl = 'https://www.stratmeridian.com/';
const leadershipSourceUrl = 'https://www.stratmeridian.com/leadership-team';

const leaders = [
  {
    name: 'Preeti Bhatnagar',
    slug: 'preeti-bhatnagar',
    role: 'Partner - CIA(US), CPA(US)',
    image: 'https://static.wixstatic.com/media/ab906c_7d061c3fdc3b4edd96da1fadac9732b3~mv2.jpg/v1/fill/w_469,h_663,al_c,q_80,enc_auto/ab906c_7d061c3fdc3b4edd96da1fadac9732b3~mv2.jpg',
    intro: 'Strategic finance and tax professional with 19+ years of experience spanning audit, transfer pricing, corporate tax, and international taxation.',
    focus: ['Transfer pricing', 'Corporate tax', 'International taxation', 'Audit and finance advisory'],
  },
  {
    name: 'Sagar Bajaj',
    slug: 'sagar-bajaj',
    role: 'Partner - CPA(US), CPA(AU)',
    image: 'https://static.wixstatic.com/media/2a8b7d_b42507c1bda74847a875d5f1866878be~mv2.png/v1/crop/x_80,y_0,w_640,h_800/fill/w_640,h_800,al_c,q_90,enc_auto/2a8b7d_b42507c1bda74847a875d5f1866878be~mv2.png',
    intro: 'International tax and finance professional with experience in global taxation, audit, accounting, and cross-border advisory across the US, UK, Australia, Canada, India, and UAE.',
    focus: ['International tax', 'Cross-border advisory', 'Accounting and audit', 'Global compliance'],
  },
  {
    name: 'Deepak Tulsiyan',
    slug: 'deepak-tulsiyan',
    role: 'Partner - CPA(USA), CA (India), LLB',
    image: 'https://static.wixstatic.com/media/ab906c_6c637b2f8a5c4cd58710d748cf86710b~mv2.jpg/v1/fill/w_409,h_529,al_c,q_80,enc_auto/ab906c_6c637b2f8a5c4cd58710d748cf86710b~mv2.jpg',
    intro: 'Seasoned finance and advisory professional with 30+ years of experience across accounting, taxation, audit, financial management, and strategic business advisory.',
    focus: ['Accounting', 'Taxation', 'Audit', 'Financial management', 'Strategic business advisory'],
  },
];

const services = [
  {
    title: 'Transfer Pricing Advisory',
    slug: 'transfer-pricing-advisory',
    shortParagraph: 'Design and defend robust transfer pricing models that stand up to scrutiny in every jurisdiction you operate in.',
    metaDescription: 'Transfer pricing advisory including Master File, Local File, salary benchmarking, RPT transaction benchmarking, TP policy design, audit support, and OECD-aligned solutions.',
    icon: 'bi-diagram-3',
    color: 'green',
    bullets: ['Master File & Local File', 'Salary Benchmarking', 'RPT transactions Benchmarking (TNMM, CUP, etc)', 'TP policy design', 'Audit support', 'OECD-aligned solutions'],
    pillars: [
      { title: 'Design', text: 'Build intercompany pricing models aligned with value creation and commercial realities.' },
      { title: 'Defend', text: 'Prepare documentation and benchmarking that can withstand tax authority scrutiny.' },
      { title: 'Govern', text: 'Create repeatable policies and review processes for ongoing compliance.' },
    ],
    outcomes: ['Reduced TP controversy risk', 'Clearer global pricing governance', 'Documentation aligned to OECD and local rules'],
  },
  {
    title: 'UAE Corporate Tax',
    slug: 'uae-corporate-tax',
    shortParagraph: 'Navigate the UAE corporate tax regime with confidence, from registration to ongoing compliance.',
    metaDescription: 'UAE Corporate Tax support including registration, return filing, Free Zone QFZP advisory, Small Business Relief, and tax health checks.',
    icon: 'bi-building-check',
    color: 'orange',
    bullets: ['Corporate Tax Registration', 'Corporate Tax Return filing', 'Free Zone (QFZP) advisory', 'Small Business Relief', 'Tax health checks'],
    pillars: [
      { title: 'Register', text: 'Set up Corporate Tax obligations correctly and understand filing responsibilities.' },
      { title: 'Comply', text: 'Prepare CT returns, calculations, and supporting documentation with clear review steps.' },
      { title: 'Optimize', text: 'Assess reliefs, Free Zone considerations, and effective tax-rate planning.' },
    ],
    outcomes: ['FTA-ready compliance position', 'Cleaner Free Zone and QFZP assessment', 'Lower risk through periodic health checks'],
  },
  {
    title: 'Strategic Global Tax Solutions',
    slug: 'strategic-global-tax-solutions',
    shortParagraph: 'Optimize your global footprint with technical tax expertise across the UAE, India, UK, EU, and US.',
    metaDescription: 'Strategic global tax advisory for cross-border structuring, investment planning, treaty relief, and coordinated compliance across major jurisdictions.',
    icon: 'bi-globe2',
    color: 'cyan',
    bullets: ['Cross-border structuring and investment planning', 'Double taxation treaties and relief optimization', 'Coordinated compliance and tax return filing support across US, UK, Australia, Canada and Singapore'],
    pillars: [
      { title: 'Structure', text: 'Cross-border structuring and investment planning for global holding and operating models.' },
      { title: 'Advisory', text: 'Double taxation treaty analysis and relief optimization across key markets.' },
      { title: 'Compliance', text: 'Coordinated tax return and compliance support across multiple jurisdictions.' },
    ],
    outcomes: ['Practical multi-country tax strategy', 'Better treaty and relief visibility', 'Coordinated global compliance roadmap'],
  },
  {
    title: 'VAT Advisory',
    slug: 'vat-advisory',
    shortParagraph: 'Stay compliant with UAE VAT while keeping your operations efficient and audit-ready.',
    metaDescription: 'UAE VAT advisory including VAT registration, return filing, audit support, process implementation, and dispute support.',
    icon: 'bi-receipt-cutoff',
    color: 'orange',
    bullets: ['VAT registration', 'Return filing', 'Audit support'],
    pillars: [
      { title: 'Assess', text: 'Review VAT implications across transactions, supply chains, and operating processes.' },
      { title: 'Implement', text: 'Set up VAT processes and records that support accurate recurring filings.' },
      { title: 'Respond', text: 'Support VAT audits, reviews, disputes, and authority communication.' },
    ],
    outcomes: ['Cleaner VAT filing process', 'Improved audit readiness', 'Reduced indirect tax leakage and penalties'],
  },
  {
    title: 'Accounting & CFO Advisory',
    slug: 'accounting-cfo-advisory',
    shortParagraph: 'Reliable numbers and strategic financial insight without building a large in-house team.',
    metaDescription: 'Accounting and CFO advisory including bookkeeping, MIS reporting, financial statements, e-invoicing, board reporting, and controls.',
    icon: 'bi-calculator',
    color: 'green',
    bullets: ['Bookkeeping', 'MIS reporting', 'Financial statements', 'E - Invoicing'],
    pillars: [
      { title: 'Record', text: 'Maintain dependable books and transaction records for tax, management, and audit needs.' },
      { title: 'Report', text: 'Deliver MIS, financial statements, and decision-ready reporting for stakeholders.' },
      { title: 'Advise', text: 'Provide virtual CFO perspective on controls, cash flow, margins, and investor readiness.' },
    ],
    outcomes: ['Timely management reporting', 'Stronger financial controls', 'Board and investor-ready information'],
  },
  {
    title: 'Management Consultancy and Business Setup',
    slug: 'management-consultancy-business-setup',
    shortParagraph: 'Set up and scale your UAE presence with the right free zone, mainland, and global structure from day one.',
    metaDescription: 'Management consultancy and business setup support including free zone and mainland setup, licensing, global structuring, and entity planning.',
    icon: 'bi-briefcase',
    color: 'cyan',
    bullets: ['Free zone & mainland setup', 'Global structuring'],
    pillars: [
      { title: 'Plan', text: 'Identify the business, licensing, tax, and ownership considerations before setup.' },
      { title: 'Set Up', text: 'Guide free zone and mainland options with practical entity-formation support.' },
      { title: 'Scale', text: 'Align the UAE structure with cross-border expansion and long-term growth needs.' },
    ],
    outcomes: ['Clear setup route', 'Structure aligned with tax and compliance needs', 'Practical launch and growth roadmap'],
  },
];

const serviceSlugs = services.map((service) => service.slug);

function serviceHtmlContent(service) {
  return `
    <section class="service-content">
      <h2>${service.title}</h2>
      <p>${service.shortParagraph}</p>
      <h3>Service Inclusions</h3>
      <ul>
        ${service.bullets.map((item) => `<li>${item}</li>`).join('')}
      </ul>
      <p>${service.metaDescription}</p>
    </section>
  `;
}

function leaderCard(leader) {
  return `
    <a class="sm-leader-card" href="/${leader.slug}">
      <img src="${leader.image}" alt="${leader.name}" loading="lazy" />
      <span class="sm-leader-kicker">Partner</span>
      <h2>${leader.name}</h2>
      <p class="sm-role">${leader.role}</p>
      <p>${leader.intro}</p>
      <span class="sm-card-link">View Full Bio</span>
    </a>
  `;
}

function leadershipIndexHtml() {
  return `
    <div class="sm-page sm-leadership-page">
      <section class="sm-intro">
        <p class="sm-eyebrow">Leadership Team</p>
        <h2>Senior advisory leadership for complex international tax, transfer pricing, UAE corporate tax, and accounting matters.</h2>
        <p>Strat Meridian is led by experienced partners who combine technical tax depth, accounting discipline, audit experience, and practical cross-border judgment.</p>
      </section>
      <section class="sm-leader-grid">
        ${leaders.map(leaderCard).join('')}
      </section>
      <section class="sm-band">
        <div>
          <p class="sm-eyebrow">Global Expertise. Strategic Precision.</p>
          <h2>Ready to navigate complex tax landscapes?</h2>
          <p>Connect with Strat Meridian's senior advisors to simplify global complexity and mitigate risk for your multinational operations.</p>
        </div>
        <a class="sm-button" href="/contact">Book a Consultation</a>
      </section>
    </div>
  `;
}

function leaderDetailHtml(leader) {
  return `
    <div class="sm-page sm-profile-page">
      <section class="sm-profile">
        <div class="sm-profile-photo">
          <img src="${leader.image}" alt="${leader.name}" loading="lazy" />
        </div>
        <div class="sm-profile-copy">
          <p class="sm-eyebrow">Leadership Team</p>
          <h2>${leader.name}</h2>
          <p class="sm-role">${leader.role}</p>
          <p>${leader.intro}</p>
          <div class="sm-focus-list">
            ${leader.focus.map((item) => `<span>${item}</span>`).join('')}
          </div>
          <a class="sm-button" href="/contact">Book a Consultation</a>
        </div>
      </section>
      <section class="sm-section-grid">
        <div>
          <p class="sm-eyebrow">Advisory Approach</p>
          <h3>Technical depth with practical judgment</h3>
          <p>${leader.name} supports clients with a focus on clarity, defensible positions, and execution-ready recommendations across complex advisory and compliance matters.</p>
        </div>
        <div>
          <p class="sm-eyebrow">Strat Meridian</p>
          <h3>Partner-led client service</h3>
          <p>Clients work with senior professionals who understand international structures, tax risk, reporting needs, and the operational realities behind cross-border decisions.</p>
        </div>
      </section>
      <p><a class="sm-back-link" href="/our-leadership-team">Back to Leadership Team</a></p>
    </div>
  `;
}

function serviceRawHtml(service) {
  return `
    <div class="sm-page sm-service-page">
      <section class="sm-intro">
        <p class="sm-eyebrow">Service Spectrum</p>
        <h2>${service.title}</h2>
        <p>${service.shortParagraph}</p>
      </section>
      <section class="sm-service-layout">
        <div class="sm-service-main">
          <p class="sm-eyebrow">What We Support</p>
          <h3>Focused advisory built around the work your business actually needs.</h3>
          <p>${service.metaDescription}</p>
          <div class="sm-bullet-grid">
            ${service.bullets.map((item) => `<span>${item}</span>`).join('')}
          </div>
        </div>
        <aside class="sm-callout">
          <p class="sm-eyebrow">Partner-Led Advisory</p>
          <h3>Bespoke solutions for global complexity</h3>
          <p>Our work helps multinational groups, founders, and investors manage compliance obligations while improving decision quality and reducing risk.</p>
          <a class="sm-button" href="/contact">Book a Consultation</a>
        </aside>
      </section>
      <section class="sm-pillar-grid">
        ${service.pillars.map((pillar, index) => `
          <div>
            <span>${String(index + 1).padStart(2, '0')}</span>
            <h3>${pillar.title}</h3>
            <p>${pillar.text}</p>
          </div>
        `).join('')}
      </section>
      <section class="sm-outcomes">
        <div>
          <p class="sm-eyebrow">Client Outcomes</p>
          <h3>Clearer decisions. Stronger compliance. Less avoidable risk.</h3>
        </div>
        <ul>
          ${service.outcomes.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </section>
      <section class="sm-process">
        <div><span>01</span><h3>Review</h3><p>We understand the structure, documents, transactions, and jurisdictions involved.</p></div>
        <div><span>02</span><h3>Analyze</h3><p>We identify key risks, compliance requirements, and available advisory positions.</p></div>
        <div><span>03</span><h3>Deliver</h3><p>We prepare clear outputs and support execution with partner-led guidance.</p></div>
      </section>
      <section class="sm-band">
        <div>
          <p class="sm-eyebrow">Ready to discuss your structure or next transaction?</p>
          <h2>Get a focused, partner-led view on your options.</h2>
          <p>Share a few details about your situation and Strat Meridian will respond with practical next steps.</p>
        </div>
        <a class="sm-button" href="/contact">Book a Consultation</a>
      </section>
    </div>
  `;
}

const stratPageCss = `
  .sm-page{font-family:var(--sans);color:var(--text-primary)}
  .sm-intro{max-width:920px;margin:0 auto 44px;text-align:center}
  .sm-eyebrow{color:var(--gold);font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;margin:0 0 14px}
  .sm-intro h2,.sm-profile-copy h2{font-family:var(--serif);font-weight:400;font-size:clamp(34px,4.2vw,58px);line-height:1.05;margin:0 0 18px;color:var(--ink-primary)}
  .sm-intro p,.sm-profile-copy p,.sm-section-grid p,.sm-callout p,.sm-process p{font-size:16px;line-height:1.8;color:var(--text-secondary)}
  .sm-leader-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px}
  .sm-leader-card{display:block;background:var(--surface);border:1px solid rgba(16,25,24,.08);text-decoration:none;color:inherit;padding-bottom:28px;transition:.2s}
  .sm-leader-card:hover{transform:translateY(-4px);box-shadow:0 24px 60px rgba(16,25,24,.12)}
  .sm-leader-card img{width:100%;aspect-ratio:4/5;object-fit:cover;background:#f3efe6;display:block}
  .sm-leader-card h2{font-family:var(--serif);font-size:27px;font-weight:400;color:var(--ink-primary);margin:8px 28px}
  .sm-leader-card p,.sm-leader-kicker,.sm-card-link{margin-left:28px;margin-right:28px}
  .sm-leader-kicker,.sm-card-link{display:block;color:var(--gold);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-top:24px}
  .sm-role{color:var(--gold)!important;font-weight:700;margin-bottom:10px!important}
  .sm-card-link{margin-top:18px}
  .sm-band{margin-top:54px;background:var(--ink-primary);color:var(--text-on-dark);padding:42px;display:flex;align-items:center;justify-content:space-between;gap:28px}
  .sm-band h2{font-family:var(--serif);font-size:36px;font-weight:400;margin:0 0 10px;color:var(--text-on-dark)}
  .sm-band p{color:var(--text-on-dark-mute);max-width:680px}
  .sm-button{display:inline-flex;align-items:center;justify-content:center;background:var(--gold);color:var(--ink-primary)!important;text-decoration:none;padding:14px 22px;border-radius:2px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
  .sm-profile{display:grid;grid-template-columns:minmax(260px,380px) 1fr;gap:54px;align-items:center}
  .sm-profile-photo img{width:100%;aspect-ratio:4/5;object-fit:cover;background:#f3efe6}
  .sm-focus-list{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}
  .sm-focus-list span{border:1px solid rgba(198,167,107,.45);color:var(--ink-primary);padding:9px 12px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
  .sm-section-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:48px}
  .sm-section-grid>div,.sm-callout{background:var(--surface);border:1px solid rgba(16,25,24,.08);padding:32px}
  .sm-section-grid h3,.sm-callout h3,.sm-process h3{font-family:var(--serif);font-size:28px;font-weight:400;color:var(--ink-primary);margin:0 0 12px}
  .sm-service-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:28px;margin-top:48px}
  .sm-service-main,.sm-callout{background:var(--surface);border:1px solid rgba(16,25,24,.08);padding:34px}
  .sm-service-main h3,.sm-pillar-grid h3,.sm-outcomes h3,.sm-callout h3{font-family:var(--serif);font-size:30px;font-weight:400;color:var(--ink-primary);line-height:1.15;margin:0 0 14px}
  .sm-bullet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:26px}
  .sm-bullet-grid span{display:flex;align-items:center;min-height:54px;border:1px solid rgba(198,167,107,.32);background:rgba(198,167,107,.06);padding:13px 15px;font-size:13px;font-weight:800;color:var(--ink-primary);line-height:1.35}
  .sm-pillar-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:32px}
  .sm-pillar-grid>div{background:var(--ink-primary);color:var(--text-on-dark);padding:32px}
  .sm-pillar-grid span{display:block;color:var(--gold);font-size:12px;font-weight:900;letter-spacing:.14em;margin-bottom:28px}
  .sm-pillar-grid h3{color:var(--text-on-dark)}
  .sm-pillar-grid p{color:var(--text-on-dark-mute)}
  .sm-outcomes{display:grid;grid-template-columns:.8fr 1.2fr;gap:30px;margin-top:32px;padding:34px;border:1px solid rgba(16,25,24,.08);background:linear-gradient(135deg,rgba(198,167,107,.12),rgba(255,255,255,.7))}
  .sm-outcomes ul{margin:0;padding:0;list-style:none;display:grid;gap:12px}
  .sm-outcomes li{position:relative;padding-left:26px;color:var(--text-secondary);font-size:16px;line-height:1.7}
  .sm-outcomes li:before{content:"";position:absolute;left:0;top:12px;width:9px;height:9px;background:var(--gold)}
  .sm-service-page ul{margin:18px 0 0;padding-left:20px;color:var(--text-secondary);line-height:1.9}
  .sm-process{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:38px}
  .sm-process div{background:var(--ink-primary);color:var(--text-on-dark);padding:30px}
  .sm-process span{color:var(--gold);font-weight:900;font-size:13px;letter-spacing:.14em}
  .sm-process h3{color:var(--text-on-dark);margin-top:18px}
  .sm-process p{color:var(--text-on-dark-mute)}
  .sm-back-link{color:var(--gold);font-weight:800;text-decoration:none}
  @media(max-width:900px){.sm-leader-grid,.sm-profile,.sm-section-grid,.sm-service-layout,.sm-pillar-grid,.sm-outcomes,.sm-process{grid-template-columns:1fr}.sm-band{display:block}.sm-band .sm-button{margin-top:18px}.sm-bullet-grid{grid-template-columns:1fr}}
`;

const homeContent = {
  seo: {
    title: 'Strat Meridian Consultancy | International Tax, Transfer Pricing & UAE Corporate Tax',
    description: 'Dubai-based advisory firm providing international tax, transfer pricing, UAE corporate tax, and accounting services for multinational groups and global investors.',
    keywords: 'Strat Meridian, Dubai tax consultant, transfer pricing, international tax, UAE corporate tax, accounting services, corporate tax Dubai',
  },
  hero: {
    enabled: true,
    badge: 'Expert Consultation',
    badgeIcon: 'bi-shield-check',
    title: 'World-Class Insight. Precise Strategy. Elite Advisory',
    description: 'Expert international tax, transfer pricing, and UAE corporate tax and accounting services for multinational groups and global investors.',
    words: ['Transfer Pricing', 'International Tax', 'UAE Corporate Tax', 'Accounting Services'],
    primaryButton: { label: 'Book a Consultation', href: '#contact', icon: '' },
    secondaryButton: { label: 'Our Services', href: '#services', icon: '' },
    backgroundImage: '',
  },
  stats: {
    enabled: true,
    items: [
      { value: '19+', label: 'Years Leadership Experience', color: 'g' },
      { value: '30+', label: 'Years Senior Advisory Experience', color: 'c' },
      { value: '6+', label: 'Key Jurisdictions Covered', color: 'o' },
      { value: '4', label: 'Core Advisory Service Lines', color: 'w' },
    ],
  },
  trust: {
    enabled: true,
    items: [
      { icon: 'bi-globe2', label: 'Global Expertise' },
      { icon: 'bi-person-check', label: 'Partner-Led Approach' },
      { icon: 'bi-building-check', label: 'UAE Specialization' },
      { icon: 'bi-bullseye', label: 'Strategic Precision' },
    ],
  },
  approach: {
    enabled: true,
    eyebrow: 'Our Approach',
    title: 'Simplifying global complexity.',
    highlight: 'Built for strategic clarity.',
    description: 'Strat Meridian Consulting FZCO is a premier international consulting firm based in Dubai, dedicated to trusted advisory services that mitigate risk and enable sustainable growth for MNCs and HNWIs.',
    items: [
      { label: 'Starting Point', word: 'Complexity' },
      { label: 'Our Process', word: 'Review' },
      { label: 'Our Approach', word: 'Guidance' },
      { label: 'The Outcome', word: 'Clarity' },
    ],
  },
  services: {
    enabled: true,
    eyebrow: 'Key Services',
    eyebrowIcon: 'bi-grid-3x3-gap',
    title: 'Strategic Excellence &',
    highlight: 'Bespoke Solutions',
    description: 'A focused service spectrum for multinational groups, global investors, and internationally active businesses.',
    items: services.map((service) => ({
      icon: service.icon,
      title: service.title,
      text: service.shortParagraph,
      color: service.color,
      href: `/service/${service.slug}`,
    })),
  },
  features: {
    enabled: true,
    eyebrow: 'Why Choose Us',
    eyebrowIcon: 'bi-star',
    title: 'Global Expertise.',
    highlight: 'Strategic Precision.',
    description: 'We simplify global complexity through senior-led advisory, technical depth, and a practical focus on risk mitigation and sustainable growth.',
    items: [
      { icon: 'bi-globe2', title: 'Global Expertise', text: 'Deeply rooted in international tax and transfer pricing, we provide the strategic clarity needed for complex global operations.', color: 'green' },
      { icon: 'bi-person-check', title: 'Partner-Led Approach', text: 'Direct access to senior partners with decades of combined leadership experience, ensuring high-level strategic precision.', color: 'cyan' },
      { icon: 'bi-building-check', title: 'UAE Specialization', text: 'Expertise in Free Zone structuring, QFZP considerations, corporate tax compliance, and the evolving regulatory landscape of the UAE.', color: 'orange' },
      { icon: 'bi-bullseye', title: 'Strategic Precision', text: 'Mitigating risk and enabling growth through multi-country tax capability and a focus on strategic advisory, not just compliance.', color: 'green' },
    ],
  },
  documents: {
    enabled: false,
    eyebrow: 'Documentation',
    eyebrowIcon: 'bi-folder2-open',
    title: 'Documentation',
    highlight: 'Prepared with Rigor',
    description: 'We guide required records and filings based on the advisory scope.',
    button: { label: 'Book a Consultation', href: '#contact', icon: '' },
    items: [],
  },
  global: {
    enabled: true,
    eyebrow: 'Cross-Border Advisory',
    title: 'International advisory,',
    highlight: 'delivered with precision.',
    description: '',
    items: [
      { title: 'International Tax', text: 'Multi-country tax return support and cross-border compliance for global footprints.' },
      { title: 'Transfer Pricing', text: 'Local File, Master File, benchmarking, and defensible documentation support.' },
      { title: 'UAE Corporate Tax', text: 'CT registration, CT return filing, Free Zone structuring, and ongoing UAE compliance.' },
    ],
  },
  leadership: {
    enabled: true,
    eyebrow: 'Our Team',
    title: 'Leadership Team',
    highlight: '',
    description: '',
    items: leaders.map((leader) => ({
      title: leader.name,
      role: leader.role,
      href: `/${leader.slug}`,
      image: leader.image,
      text: leader.intro,
    })),
  },
  who: {
    enabled: true,
    eyebrow: 'Who We Help',
    title: 'Advisory support built around global complexity.',
    highlight: '',
    description: '',
    items: [
      { num: '01', title: 'Multinational Groups', text: 'Strategic transfer pricing, documentation, and compliance support across key jurisdictions.' },
      { num: '02', title: 'Global Investors', text: 'International tax guidance for investors managing assets, entities, and obligations across borders.' },
      { num: '03', title: 'UAE Businesses', text: 'Corporate Tax, Free Zone, QFZP, and ongoing compliance support for UAE operating structures.' },
      { num: '04', title: 'International Businesses', text: 'Accounting, reporting, and audit support for sophisticated businesses with global needs.' },
    ],
  },
  process: {
    enabled: true,
    eyebrow: 'How We Work',
    eyebrowIcon: 'bi-arrow-right-circle',
    title: 'Clear Process.',
    highlight: 'Senior Review.',
    description: 'A structured advisory process designed for clarity, defensible positions, and practical execution.',
    items: [
      { number: '01', title: 'Understand Scope', text: 'We review your structure, jurisdictions, transactions, and compliance needs.', color: 'green' },
      { number: '02', title: 'Assess Risk', text: 'We identify key tax, transfer pricing, accounting, and UAE compliance considerations.', color: 'cyan' },
      { number: '03', title: 'Build Strategy', text: 'We prepare documentation, filings, and advisory recommendations aligned with your objectives.', color: 'orange' },
      { number: '04', title: 'Support Execution', text: 'We help you move forward with clear deliverables and ongoing compliance support.', color: 'green' },
    ],
  },
  insights: {
    enabled: true,
    eyebrow: 'Insights',
    title: 'Perspective on what matters.',
    highlight: '',
    description: '',
    items: [
      { title: 'Transfer pricing documentation that holds up across jurisdictions', tag: 'Insight pending', href: '' },
      { title: 'Preparing for UAE Corporate Tax compliance with confidence', tag: 'Insight pending', href: '' },
      { title: 'Why international tax strategy needs accounting discipline', tag: 'Insight pending', href: '' },
    ],
  },
  cta: {
    enabled: true,
    eyebrow: 'Ready to Navigate Complex Tax Landscapes?',
    eyebrowIcon: 'bi-lightning-charge',
    title: 'Connect with Our',
    highlight: 'Global Experts',
    description: 'Connect with our global experts to simplify complexity and mitigate risk for your multinational operations.',
    primaryButton: { label: 'Book a Consultation', href: '#contact', icon: 'bi-calendar-check' },
    secondaryButton: { label: 'Know More about Services', href: '#services', icon: 'bi-arrow-right' },
    backgroundImage: '',
  },
  faq: {
    enabled: true,
    eyebrow: 'FAQ',
    eyebrowIcon: 'bi-question-circle',
    title: 'Frequently Asked',
    highlight: 'Questions',
    description: 'Quick answers for businesses and investors considering Strat Meridian advisory support.',
    items: [
      { question: 'Where is Strat Meridian based?', answer: 'Strat Meridian Consulting FZCO is based in Dubai, UAE and supports multinational groups, global investors, and internationally active businesses.' },
      { question: 'Which services does Strat Meridian provide?', answer: 'Core services include transfer pricing, international tax, UAE corporate tax, and accounting services.' },
      { question: 'Can you support UAE Corporate Tax registration and filing?', answer: 'Yes. We support CT registration, CT return filing, Free Zone and QFZP structuring considerations, and ongoing UAE Corporate Tax compliance.' },
      { question: 'Do you handle multi-country tax matters?', answer: 'Yes. The firm supports international tax matters involving jurisdictions such as the US, UK, Canada, Australia, India, and the UAE.' },
    ],
  },
  contact: {
    enabled: true,
    eyebrow: 'Contact',
    eyebrowIcon: 'bi-send',
    title: 'Book a',
    highlight: 'Consultation',
    description: 'Share your details and our advisory team will help you understand the next steps.',
    panelTitle: 'Global Expertise. Strategic Precision.',
    panelDescription: 'Speak with Strat Meridian about international tax, transfer pricing, UAE corporate tax, or accounting support.',
    form: {
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Your name',
      emailLabel: 'Email Address',
      emailPlaceholder: 'you@example.com',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '+971 50 30 58938',
      commentLabel: 'Comment',
      commentPlaceholder: 'Tell us what you need help with...',
      buttonLabel: 'Book a Consultation',
    },
    items: [
      { icon: 'bi-geo-alt', title: 'Dubai, UAE', text: 'Strat Meridian Consulting FZCO, Dubai', color: 'green' },
      { icon: 'bi-telephone', title: 'UAE Phone', text: '+971 50 30 58938', color: 'cyan' },
      { icon: 'bi-telephone', title: 'India Phone', text: '+91 95822 29267', color: 'orange' },
      { icon: 'bi-briefcase', title: 'Advisory Focus', text: 'International tax, transfer pricing, UAE corporate tax, and accounting services', color: 'green' },
    ],
  },
};

const themeSettings = {
  type: 'theme',
  websiteName: 'Strat Meridian Consulting FZCO',
  metaTitle: homeContent.seo.title,
  metaDescription: homeContent.seo.description,
  metaKeywords: homeContent.seo.keywords,
  footerTagline: 'Professional advisory support for multinational groups, global investors, and businesses navigating complex tax landscapes.',
  footerCredit: '(c) 2026 Strat Meridian Consulting FZCO. All rights reserved.',
  phoneNumber: '+971 50 30 58938',
  defaultPhoneCountry: 'AE',
  emailId: '',
  address: 'Dubai, UAE',
  city: 'Dubai',
  state: '',
  country: 'United Arab Emirates',
};

const headerMenuItems = [
  { id: 'home', text: 'Home', href: '/#home', target: '_self', children: [] },
  {
    id: 'services',
    text: 'Services',
    href: '/#services',
    target: '_self',
    children: services.map((service) => ({
      id: service.slug,
      text: service.title,
      href: `/service/${service.slug}`,
      target: '_self',
      children: [],
    })),
  },
  { id: 'about', text: 'About', href: '/#about', target: '_self', children: [] },
  { id: 'leadership', text: 'Our Leadership Team', href: '/our-leadership-team', target: '_self', children: [] },
  { id: 'faq', text: 'FAQ', href: '/#faq', target: '_self', children: [] },
  { id: 'contact', text: 'Contact Us', href: '/contact', target: '_self', children: [] },
];

const footerMenuItems = [
  { id: 'footer-home', text: 'Home', href: '/#home', target: '_self', children: [] },
  { id: 'footer-services', text: 'Services', href: '/#services', target: '_self', children: [] },
  ...services.map((service) => ({
    id: `footer-${service.slug}`,
    text: service.title,
    href: `/service/${service.slug}`,
    target: '_self',
    children: [],
  })),
  { id: 'footer-contact', text: 'Contact Us', href: '/contact', target: '_self', children: [] },
];

await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });

const category = await Category.findOneAndUpdate(
  { slug: 'advisory-services' },
  {
    $set: {
      title: 'Advisory Services',
      slug: 'advisory-services',
      status: 'active',
      metaTitle: 'Advisory Services | Strat Meridian Consulting FZCO',
      metaDescription: 'International tax, transfer pricing, UAE corporate tax, and accounting services.',
      editorPreference: 'rich',
      htmlContent: '<p>Strategic advisory services for multinational groups, global investors, and internationally active businesses.</p>',
    },
  },
  { upsert: true, returnDocument: 'after' }
);

await Service.deleteMany({
  sourceUrl,
  slug: { $nin: serviceSlugs },
});

for (const service of services) {
  await Service.findOneAndUpdate(
    { slug: service.slug },
    {
      $set: {
        title: service.title,
        slug: service.slug,
        price: 0,
        uploadLabel: 'Upload relevant documents',
        buttonLabel: 'Book a Consultation',
        shortParagraph: service.shortParagraph,
        heroFeatures: [
          { icon: 'bi-shield-check', title: 'Strategic Advisory', description: 'Senior-led support focused on clarity, risk mitigation, and sustainable growth.' },
          { icon: 'bi-file-earmark-check', title: 'Documentation Support', description: 'Practical guidance and documentation aligned with your jurisdictional needs.' },
          { icon: service.icon, title: service.title, description: service.metaDescription },
        ],
        category: category._id,
        htmlContent: serviceHtmlContent(service),
        rawHtml: serviceRawHtml(service),
        editorPreference: 'raw',
        metaTitle: `${service.title} | Strat Meridian Consulting FZCO`,
        metaDescription: service.metaDescription,
        metaKeywords: `${service.title}, Strat Meridian, Dubai advisory, international tax, transfer pricing, UAE corporate tax, accounting services`,
        customCss: stratPageCss,
        status: 'active',
        sourceUrl,
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );
}

await Settings.findOneAndUpdate(
  { type: 'homepage' },
  { $set: { type: 'homepage', content: homeContent, sourceUrl } },
  { upsert: true, returnDocument: 'after' }
);

await Settings.findOneAndUpdate(
  { type: 'theme' },
  { $set: { ...themeSettings, sourceUrl } },
  { upsert: true, returnDocument: 'after' }
);

await Page.findOneAndUpdate(
  { slug: 'our-leadership-team' },
  {
    $set: {
      title: 'Our Leadership Team',
      slug: 'our-leadership-team',
      rawHtml: leadershipIndexHtml(),
      editorPreference: 'raw',
      metaTitle: 'Our Leadership Team | Strat Meridian Consulting FZCO',
      metaDescription: 'Meet Strat Meridian leadership: Preeti Bhatnagar, Sagar Bajaj, and Deepak Tulsiyan.',
      metaKeywords: 'Strat Meridian leadership, Preeti Bhatnagar, Sagar Bajaj, Deepak Tulsiyan, Dubai tax advisors',
      customCss: stratPageCss,
      status: 'active',
      sourceUrl: leadershipSourceUrl,
    },
  },
  { upsert: true, returnDocument: 'after' }
);

for (const leader of leaders) {
  await Page.findOneAndUpdate(
    { slug: leader.slug },
    {
      $set: {
        title: leader.name,
        slug: leader.slug,
        rawHtml: leaderDetailHtml(leader),
        editorPreference: 'raw',
        metaTitle: `${leader.name} | Strat Meridian Leadership`,
        metaDescription: leader.intro,
        metaKeywords: `${leader.name}, Strat Meridian, ${leader.role}, leadership team, Dubai advisory`,
        customCss: stratPageCss,
        status: 'active',
        sourceUrl: leadershipSourceUrl,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
}

await Menu.findOneAndUpdate(
  { type: 'header' },
  { $set: { type: 'header', items: headerMenuItems, sourceUrl } },
  { upsert: true, returnDocument: 'after' }
);

await Menu.findOneAndUpdate(
  { type: 'footer' },
  { $set: { type: 'footer', items: footerMenuItems, sourceUrl } },
  { upsert: true, returnDocument: 'after' }
);

console.log(`Updated homepage settings from ${sourceUrl}`);
console.log(`Updated theme/contact settings for ${themeSettings.websiteName}`);
console.log(`Upserted ${services.length} services in /admin/services`);
console.log(`Upserted leadership index and ${leaders.length} leader pages in /admin/pages`);
console.log(`Updated header menu with ${headerMenuItems.length} top-level items`);
console.log(`Updated footer menu with ${footerMenuItems.length} items`);

await mongoose.disconnect();

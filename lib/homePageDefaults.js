export const homePageDefaults = {
  seo: {
    title: "US Tax Filing Made Simple | Strat Meridian",
    description: "Expert support for US tax filing, foreign income reporting, and visa-based tax returns.",
    keywords: "US tax filing, 1040, 1040NR, foreign income tax",
  },
  hero: {
    enabled: true,
    badge: "Simple. Secure. Accurate.",
    badgeIcon: "bi-shield-check",
    title: "US Tax Filing Made Simple",
    description: "Expert support for 1040, 1040NR, foreign income reporting, visa-based tax filing, and individual tax return preparation.",
    words: ["For Foreign Students", "For Visa Holders", "For US Citizens", "For Global Earners", "For Families & Individuals"],
    primaryButton: { label: "Start Filing", href: "/login", icon: "" },
    secondaryButton: { label: "Explore Services", href: "#services", icon: "" },
    backgroundImage: "",
  },
  stats: {
    enabled: true,
    items: [
      { value: "12+", label: "Years of Experience", color: "g" },
      { value: "100K+", label: "Successful Projects", color: "c" },
      { value: "80K+", label: "Satisfied Clients", color: "o" },
      { value: "100+", label: "Industry Partners", color: "w" },
    ],
  },
  trust: {
    enabled: true,
    items: [
      { icon: "bi-patch-check", label: "Accurate Filing" },
      { icon: "bi-lock", label: "Secure Documents" },
      { icon: "bi-people", label: "Expert Support" },
      { icon: "bi-lightning-charge", label: "Fast Process" },
    ],
  },
  services: {
    enabled: true,
    eyebrow: "Services",
    eyebrowIcon: "bi-grid-3x3-gap",
    title: "Who Do We",
    highlight: "Help?",
    description: "Simple tax support based on your status, residency, and income type.",
    items: [
      { icon: "bi-mortarboard", title: "Foreign Students", text: "1040NR filing support for F-1 and J-1 visa holders with stipend or scholarship income.", color: "green" },
      { icon: "bi-briefcase", title: "Visa Holders", text: "Tax return help for H1B, L1, O1, TN, and resident aliens on dual-status years.", color: "cyan" },
      { icon: "bi-person-badge", title: "US Citizens", text: "Individual 1040 filing with deductions, credits, and AMT optimization support.", color: "orange" },
      { icon: "bi-globe2", title: "Foreign Income Cases", text: "Help with income earned abroad, tax treaty benefits, and required reporting forms.", color: "cyan" },
      { icon: "bi-airplane", title: "Citizens Living Abroad", text: "Tax filing and FEIE support for US citizens residing outside the United States.", color: "orange" },
      { icon: "bi-diagram-3", title: "Different Filing Status", text: "Support for MFJ, MFS, HOH, qualifying widow/widower, and other filing situations.", color: "green" },
    ],
  },
  features: {
    enabled: true,
    eyebrow: "Why Us",
    eyebrowIcon: "bi-star",
    title: "Why Choose",
    highlight: "Strat Meridian",
    description: "Clear guidance, smooth process, and support for both simple and complex tax cases.",
    items: [
      { icon: "bi-ui-checks-grid", title: "Simple Process", text: "We keep each step clear so filing feels easier and stress-free.", color: "green" },
      { icon: "bi-file-earmark-check", title: "Document Guidance", text: "Know exactly what documents are needed for your filing type.", color: "cyan" },
      { icon: "bi-bar-chart-line", title: "Complex Case Support", text: "Foreign income, reporting forms, and multi-source income handled with care.", color: "orange" },
      { icon: "bi-chat-dots", title: "Easy Communication", text: "Quick coordination, clear updates, and a smoother filing experience.", color: "green" },
    ],
  },
  documents: {
    enabled: true,
    eyebrow: "Documents",
    eyebrowIcon: "bi-folder2-open",
    title: "What Documents",
    highlight: "Do You Need?",
    description: "We guide you based on your tax category, income type, and filing status.",
    button: { label: "Get Document Guidance", href: "#contact", icon: "" },
    items: [
      { title: "Personal & Identity", icon: "bi-person-vcard", color: "green", list: ["Passport and visa copy", "SSN or ITIN", "I-94, I-20, or I-797", "Dependent details"] },
      { title: "Income Documents", icon: "bi-cash-stack", color: "cyan", list: ["Form W-2", "Form 1099", "Form 1042-S", "Business or freelance records"] },
      { title: "Financial & Deductions", icon: "bi-receipt", color: "orange", list: ["1099-INT, 1099-DIV, 1099-B", "Mortgage and education forms", "Donation and childcare records", "Foreign account details if applicable"] },
    ],
  },
  process: {
    enabled: true,
    eyebrow: "How It Works",
    eyebrowIcon: "bi-arrow-right-circle",
    title: "Four",
    highlight: "Simple Steps",
    description: "A streamlined process designed to save time and reduce confusion.",
    items: [
      { number: "01", title: "Share Details", text: "Tell us your visa status, income type, and filing situation.", color: "green" },
      { number: "02", title: "Upload Documents", text: "Send the required documents in a secure and organized way.", color: "cyan" },
      { number: "03", title: "Return Preparation", text: "We review and prepare the right return based on your case.", color: "orange" },
      { number: "04", title: "Review & File", text: "Final review, guidance, and filing support from start to finish.", color: "green" },
    ],
  },
  cta: {
    enabled: true,
    eyebrow: "Complex Cases Welcome",
    eyebrowIcon: "bi-lightning-charge",
    title: "Need Help with a",
    highlight: "Complex Tax Case?",
    description: "We also assist with foreign income, FBAR, Form 8938, investments, dependents, multi-source income, and residency-based tax situations.",
    primaryButton: { label: "Talk to an Expert", href: "tel:1234567890", icon: "bi-telephone" },
    secondaryButton: { label: "View FAQs", href: "#faq", icon: "bi-arrow-right" },
    backgroundImage: "",
  },
  faq: {
    enabled: true,
    eyebrow: "FAQ",
    eyebrowIcon: "bi-question-circle",
    title: "Frequently Asked",
    highlight: "Questions",
    description: "Quick answers to the most common tax filing questions.",
    items: [
      { question: "Which form applies to me: 1040 or 1040NR?", answer: "It depends on your tax residency status, visa category, and time spent in the US. We help determine the correct form for your unique situation." },
      { question: "Can you help with foreign income reporting?", answer: "Yes. We assist with foreign income reporting, FEIE-related forms, foreign tax credits, and account disclosure support where applicable." },
      { question: "What documents do I need before starting?", answer: "Usually identity documents, income forms, immigration records, deduction-related documents, and prior returns if available. The exact list depends on your filing type." },
      { question: "Do you help with FBAR and Form 8938?", answer: "Yes. If foreign bank account and asset reporting applies to your case, we guide you on the relevant forms and required details." },
    ],
  },
  contact: {
    enabled: true,
    eyebrow: "Contact",
    eyebrowIcon: "bi-send",
    title: "Let's Start Your",
    highlight: "Tax Filing",
    description: "Share your details and we'll help you understand the next steps.",
    panelTitle: "Why Contact Us?",
    panelDescription: "Whether your case is simple or complex, we make the filing process easier, clearer, and more organized.",
    form: {
      fullNameLabel: "Full Name",
      fullNamePlaceholder: "John Doe",
      emailLabel: "Email Address",
      emailPlaceholder: "john@email.com",
      phoneLabel: "Phone Number",
      phonePlaceholder: "+1 234 567 890",
      commentLabel: "Comment",
      commentPlaceholder: "Tell us what you need help with...",
      buttonLabel: "Submit Enquiry",
    },
    items: [
      { icon: "bi-person-workspace", title: "Personalized Guidance", text: "Support based on your exact filing category", color: "green" },
      { icon: "bi-folder2-open", title: "Document Clarity", text: "Know what to prepare before you file", color: "cyan" },
      { icon: "bi-globe-americas", title: "Foreign Reporting Support", text: "Help with foreign income and account disclosures", color: "orange" },
      { icon: "bi-shield-lock", title: "Secure Process", text: "Professional and organized handling of your case", color: "green" },
    ],
  },
};

function mergeValue(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) return Array.isArray(savedValue) ? savedValue : defaultValue;
  if (defaultValue && typeof defaultValue === "object") {
    const saved = savedValue && typeof savedValue === "object" ? savedValue : {};
    return Object.fromEntries(Object.entries(defaultValue).map(([key, value]) => [key, mergeValue(value, saved[key])]));
  }
  return savedValue === undefined || savedValue === null ? defaultValue : savedValue;
}

export function withHomePageDefaults(saved = {}) {
  return mergeValue(homePageDefaults, saved);
}

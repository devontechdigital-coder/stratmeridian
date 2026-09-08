import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Order from "@/models/Order";
import Service from "@/models/Service";
import CheckoutPayButton from "./CheckoutPayButton";
import PendingServiceCheckout from "./PendingServiceCheckout";
import ServiceOrderForm from "@/components/public/ServiceOrderForm";
import { getThemeSettings } from "@/lib/getSettings";
import { getMenuItems } from "@/lib/getMenus";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PublicShell from "@/components/public/PublicShell";

const serviceCheckoutFormId = "service-checkout-form";

function money(amount, currency = "usd") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
}

export default async function CheckoutPage({ searchParams }) {
  const params = await searchParams;
  const pendingService = params?.pendingService === "1";
  const session = await getServerSession(authOptions);

  if (pendingService) {
    return <CheckoutShell><PendingServiceCheckout /></CheckoutShell>;
  }

  const orderId = params?.orderId;
  const serviceSlug = params?.service;
  await connectToDatabase();

  if (serviceSlug) {
    const [service, settings, headerMenuItems, footerMenuItems] = await Promise.all([
      Service.findOne({ slug: serviceSlug, status: "active" }),
      getThemeSettings(),
      getMenuItems("header"),
      getMenuItems("footer"),
    ]);
    if (!service) redirect("/checkout");

    return <ServiceCheckout service={service} settings={settings} headerMenuItems={headerMenuItems} footerMenuItems={footerMenuItems} />;
  }

  if (!session?.user?.id) redirect("/login");

  if (!orderId) {
    const services = await Service.find({ status: "active" }).sort({ createdAt: -1 });
    return <CheckoutShell><ServicePicker services={services} /></CheckoutShell>;
  }

  const order = await Order.findOne({ _id: orderId, user: session.user.id }).populate("service", "title slug price");
  if (!order) redirect("/dashboard");
  if (order.paymentStatus === "paid" || order.paymentStatus === "not_required") redirect(`/thank-you?orderId=${order._id}`);

  return (
    <CheckoutShell>
      <div className="row g-4 justify-content-center mt-2">
        <div className="col-lg-7">
          <div className="ud-card">
            <div className="ud-stat-label">Checkout</div>
            <h1 style={{ color: "#fff" }}>Complete Payment</h1>
            <p className="text-secondary">Your order has been created. Complete secure payment through Stripe to continue processing.</p>
            <div className="rounded-4 p-4 my-4" style={{ background: "rgba(255,255,255,.04)" }}>
              <Row label="Service" value={order.service?.title} />
              <Row label="Order" value={`#${order._id.toString().slice(-8).toUpperCase()}`} />
              <div className="d-flex justify-content-between align-items-center pt-2">
                <span className="text-white fw-bold">Total</span>
                <strong className="fs-3" style={{ color: "var(--green)" }}>{money(order.amount, order.currency || "usd")}</strong>
              </div>
            </div>
            <CheckoutPayButton orderId={order._id.toString()} />
          </div>
        </div>
      </div>
    </CheckoutShell>
  );
}

function ServiceCheckout({ service, settings, headerMenuItems, footerMenuItems }) {
  const currency = settings?.stripeCurrency || "usd";
  const price = Number(service.price || 0);
  const total = money(price, currency);

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
      <style>{darkCheckoutCss}</style>
      <div className="atf-public checkout-dark-page" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--dark)" }}>
        <PublicShell>
        <Header settings={settings} initialNavItems={headerMenuItems} />
        <main className="checkout-wrap">
          <div className="container">
            <div className="checkout-hero-mini">
              <div className="section-eyebrow"><i className="bi bi-shield-check" /> Secure Checkout</div>
              <h1>Complete Your <span>Order</span></h1>
              <p>Verify your details, upload documents, and continue with secure payment for your selected service.</p>
            </div>

            <div className="row g-4 align-items-start">
              <div className="col-lg-7 col-xl-8">
                <section className="checkout-card checkout-form-card">
                  <ServiceOrderForm
                    serviceId={service._id.toString()}
                    serviceTitle={service.title}
                    servicePrice={price}
                    uploadLabel={service.uploadLabel}
                    submitButtonLabel={service.buttonLabel}
                    defaultPhoneCountry={settings?.defaultPhoneCountry || "US"}
                    formId={serviceCheckoutFormId}
                    hideSubmitButton
                    directCheckout
                  />
                </section>

                <section className="checkout-card">
                  <div className="dark-panel-title"><i className="bi bi-briefcase" /> Selected Service</div>
                  <div className="selected-service-row">
                    <div>
                      <strong>{service.title}</strong>
                      <span>{service.metaDescription || service.shortParagraph || "Expert service support with document guidance."}</span>
                    </div>
                    <b>{total}</b>
                  </div>
                </section>

                <section className="checkout-card">
                  <div className="dark-panel-title"><i className="bi bi-credit-card" /> Payment Option</div>
                  <label className="dark-pay-option">
                    <input type="radio" name="pay" defaultChecked />
                    <strong>Pay Online</strong>
                    <span>Stripe, cards, secure checkout</span>
                  </label>
                  <label className="dark-pay-option">
                    <input type="radio" name="pay" />
                    <strong>Pay Later</strong>
                    <span>Submit request now</span>
                  </label>
                </section>
              </div>

              <div className="col-lg-5 col-xl-4">
                <aside className="dark-summary">
                  <div className="dark-summary-head">
                    <i className="bi bi-bag-check" />
                    <h2>Order Summary</h2>
                  </div>
                  <div className="dark-summary-body">
                    <div className="summary-service">
                      <div className="summary-service-icon"><i className="bi bi-briefcase" /></div>
                      <div>
                        <strong>{service.title}</strong>
                        <span>Service request with identity, address, and document details.</span>
                      </div>
                    </div>

                    <div className="coupon-line">
                      <input type="text" placeholder="Enter coupon code" />
                      <button type="button">Apply</button>
                    </div>

                    <div className="dark-price-list">
                      <div><span>Price</span><strong>{total}</strong></div>
                      <div><span>Tax</span><strong>{money(0, currency)}</strong></div>
                    </div>

                    <div className="dark-total">
                      <span>Total Amount</span>
                      <strong>{total}</strong>
                    </div>

                    <button className="summary-pay" form={serviceCheckoutFormId} type="submit">
                      <i className="bi bi-lock-fill" /> Pay {total}
                    </button>
                    <Link href={`/service/${service.slug}`} className="summary-back">Back to Service</Link>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>
        <Footer settings={settings} initialFooterItems={footerMenuItems} />
        </PublicShell>
      </div>
    </>
  );
}

const darkCheckoutCss = `
.checkout-dark-page {
  /* Remap the old dark/green-cyan palette to the Strat Meridian ink/gold palette. Every rule
     below still reads var(--dark)/var(--green)/etc, so redefining them here recolors the whole
     page (and ServiceOrderForm's own CSS, since it renders as a descendant) without touching
     each individual rule. */
  --green: var(--gold);
  --green-d: #d8bb84;
  --cyan: var(--gold);
  --cyan-d: #d8bb84;
  --dark: var(--ink-primary);
  --dark2: var(--ink-primary);
  --dark3: var(--ink-secondary);
  --dark4: var(--ink-secondary);
  --muted: var(--text-on-dark-mute);
  --border-g: rgba(198,167,107,.22);
  --border-c: rgba(198,167,107,.22);
  --border-o: rgba(198,167,107,.22);
  --text: var(--text-on-dark-mute);
  --text-d: var(--text-on-dark-mute);
  --white: var(--text-on-dark);
  font-family: var(--sans);
  --checkout-panel: var(--dark3);
  --checkout-border: rgba(198,167,107,.16);
}
.checkout-wrap {
  min-height: auto;
  margin-top: 96px;
  background:
    radial-gradient(circle at 50% -10%, rgba(198,167,107,.13), transparent 36%),
    linear-gradient(180deg, rgba(237,234,224,.02), transparent 22%),
    var(--dark);
  padding: 62px 0 92px;
}
.checkout-hero-mini {
  max-width: 760px;
  margin-bottom: 34px;
}
.checkout-hero-mini h1 {
  color: var(--white);
  font-size: clamp(2.2rem,4.2vw,4.4rem);
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0;
  margin: 16px 0 14px;
}
.checkout-hero-mini h1 span { color: var(--green); }
.checkout-hero-mini p {
  color: var(--text-d);
  max-width: 620px;
  line-height: 1.8;
  margin: 0;
}
.checkout-card,
.dark-summary {
  background: var(--checkout-panel);
  border: 1px solid var(--checkout-border);
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0,0,0,.28);
}
.checkout-card {
  padding: 26px;
  margin-bottom: 24px;
}
.checkout-form-card { padding: 0; overflow: hidden; }
.checkout-dark-page .f-root {
  --bg: var(--dark3);
  --white: #ffffff;
  --border: rgba(255,255,255,.08);
  --border-focus: var(--green);
  --accent: var(--green);
  --accent-light: rgba(138,217,116,.08);
  --accent-mid: rgba(138,217,116,.12);
  --text: var(--white);
  --text-mid: var(--text);
  --text-muted: var(--muted);
  --success: var(--green);
  --success-bg: rgba(138,217,116,.08);
  min-height: auto;
}
.checkout-dark-page .f-wrap { margin: 0; }
.checkout-dark-page .f-title,
.checkout-dark-page .f-steps { display: none; }
.checkout-dark-page .f-card {
  background: var(--dark3);
  border: 0;
  box-shadow: none;
  border-radius: 0;
  padding: 26px;
  margin: 0;
}
.checkout-dark-page .f-location-address,
.checkout-dark-page .f-location-meta,
.checkout-dark-page .f-addr-chosen,
.checkout-dark-page .f-file-name,
.checkout-dark-page .f-file-meta,
.checkout-dark-page .f-file-link {
  color: var(--text);
}
.checkout-dark-page .f-file {
  background: rgba(255,255,255,.025);
  border-color: rgba(255,255,255,.08);
}
.checkout-dark-page .f-file-label-input {
  background: rgba(255,255,255,.025);
  border-color: rgba(255,255,255,.08);
  color: var(--white);
}
.checkout-dark-page .f-file-label-input::placeholder {
  color: #676767;
}
.checkout-dark-page .f-file-btn {
  background: rgba(255,255,255,.04);
  border-color: rgba(255,255,255,.1);
  color: var(--text);
}
.checkout-dark-page .f-file-btn:hover {
  border-color: rgba(138,217,116,.45);
  color: var(--green);
  background: rgba(138,217,116,.08);
}
.checkout-dark-page .f-file-btn.rm {
  color: var(--coral);
  border-color: rgba(240,169,136,.22);
}
.checkout-dark-page .f-card + .f-card {
  border-top: 1px solid var(--checkout-border);
}
.checkout-dark-page .f-card-head {
  border: 0;
  padding: 0;
  margin-bottom: 24px;
}
.checkout-dark-page .f-card-icon {
  width: auto;
  height: auto;
  background: transparent;
  color: var(--green);
  font-size: 14px;
}
.checkout-dark-page .f-card-label,
.dark-panel-title {
  color: var(--white);
  font-size: 16px;
  font-weight: 900;
}
.dark-panel-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 18px;
}
.dark-panel-title i { color: var(--green); }
.checkout-dark-page .f-label {
  color: var(--text);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: none;
}
.checkout-dark-page .f-field { gap: 9px; margin-bottom: 20px; }
.checkout-dark-page .f-contact-grid { gap: 18px; }
.checkout-dark-page .f-input,
.checkout-dark-page .f-country-select,
.checkout-dark-page .f-phone-inner {
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  min-height: 50px;
  padding: 13px 14px;
  color: var(--white);
  font-size: 15px;
}
.checkout-dark-page .f-input::placeholder { color: #676767; }
.checkout-dark-page .f-country-select option { background: var(--dark3); color: var(--white); }
.checkout-dark-page .f-phone-inner { padding: 0 14px; }
.checkout-dark-page .f-phone-inner input { color: var(--white); font-size: 15px; padding: 13px 0; }
.checkout-dark-page .f-email-row { gap: 10px; }
.checkout-dark-page .f-verify-btn,
.checkout-dark-page .f-otp-btn {
  background: var(--green);
  border-color: var(--green);
  color: var(--dark);
  border-radius: 12px;
}
.checkout-dark-page .f-pill {
  width: auto;
  justify-content: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 12px;
}
.checkout-dark-page .f-drop {
  background: rgba(138,217,116,.035);
  border: 1.5px dashed rgba(138,217,116,.32);
  border-radius: 14px;
  padding: 30px 20px;
}
.checkout-dark-page .f-drop-icon {
  background: transparent;
  border: 0;
  color: var(--green);
  font-size: 22px;
}
.checkout-dark-page .f-drop-title,
.checkout-dark-page .f-drop-sub,
.checkout-dark-page .f-drop-btn {
  color: var(--green);
  font-weight: 800;
}
.checkout-dark-page .f-drop-btn {
  border: 0;
  background: transparent;
  padding: 4px 8px;
}
.selected-service-row {
  border: 1px solid var(--checkout-border);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}
.selected-service-row strong,
.selected-service-row b {
  color: var(--green);
  font-weight: 900;
}
.selected-service-row span {
  display: block;
  margin-top: 5px;
  color: var(--text-d);
}
.dark-pay-option {
  border: 1px solid var(--checkout-border);
  border-radius: 12px;
  padding: 17px 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  color: var(--text-d);
}
.dark-pay-option input { accent-color: var(--green); }
.dark-pay-option:has(input:checked) {
  border-color: rgba(138,217,116,.55);
  background: rgba(138,217,116,.055);
  color: var(--text);
}
.dark-pay-option:has(input:checked) strong { color: var(--green); }
.dark-pay-option strong { color: var(--white); }
.dark-summary {
  position: sticky;
  top: calc(var(--nh) + 24px);
  overflow: hidden;
}
.dark-summary-head {
  padding: 21px 24px;
  border-bottom: 1px solid var(--checkout-border);
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--cyan);
}
.dark-summary-head h2 {
  font-size: 20px;
  margin: 0;
  font-weight: 900;
  color: var(--white);
}
.dark-summary-body { padding: 24px; }
.summary-service {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 22px;
}
.summary-service-icon {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: rgba(97,203,243,.08);
  border: 1px solid var(--border-c);
  color: var(--cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.summary-service strong {
  display: block;
  color: var(--white);
  font-weight: 900;
}
.summary-service span {
  display: block;
  color: var(--text-d);
  font-size: 13px;
}
.coupon-line {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--checkout-border);
}
.coupon-line input {
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  min-height: 50px;
  padding: 0 14px;
  outline: none;
  color: var(--white);
}
.coupon-line button {
  border: 0;
  border-radius: 12px;
  background: var(--green);
  color: var(--dark);
  font-weight: 900;
  padding: 0 24px;
}
.dark-price-list > div,
.dark-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-d);
  margin-bottom: 12px;
}
.dark-price-list strong { color: var(--white); }
.dark-total {
  background: linear-gradient(135deg, rgba(138,217,116,.1), rgba(97,203,243,.06));
  border: 1px solid rgba(138,217,116,.18);
  border-radius: 12px;
  padding: 18px;
  margin: 18px 0 22px;
}
.dark-total span { color: var(--white); font-weight: 800; }
.dark-total strong {
  color: var(--green);
  font-size: 24px;
  font-weight: 900;
}
.summary-pay {
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 999px;
  background: var(--green);
  color: var(--dark);
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}
.summary-pay:hover { background: var(--green-d); }
.summary-back {
  min-height: 48px;
  margin-top: 14px;
  border-radius: 999px;
  background: transparent;
  border: 1px solid rgba(255,255,255,.12);
  color: var(--text);
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 991px) {
  .dark-summary { position: static; }
}
@media (max-width: 640px) {
  .checkout-wrap { padding: 34px 0 60px; }
  .checkout-card { padding: 18px; border-radius: 16px; }
  .checkout-dark-page .f-card { padding: 20px; }
  .dark-pay-option { grid-template-columns: auto 1fr; }
  .dark-pay-option span { grid-column: 2; }
  .coupon-line { grid-template-columns: 1fr; }
}
`;

function Row({ label, value }) {
  return <div className="d-flex justify-content-between border-bottom border-secondary-subtle pb-3 mb-3"><span className="text-secondary">{label}</span><strong className="text-white">{value}</strong></div>;
}

function CheckoutShell({ children, backHref = "/dashboard" }) {
  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
      <style>{`.ud-wrap{--green:var(--gold);--dark:var(--ink-primary);--dark3:var(--ink-secondary);min-height:100vh;background:var(--dark);color:var(--text-on-dark-mute);font-family:var(--sans);padding-top:96px}.ud-content{padding:32px}.ud-card{background:var(--dark3);border:1px solid rgba(198,167,107,.16);border-radius:18px;padding:24px}.ud-stat-label{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-on-dark-mute);margin-bottom:6px}.ud-main-btn{display:inline-flex;align-items:center;gap:8px;background:var(--green);color:var(--ink-primary)!important;font-weight:800;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;padding:13px 22px;border-radius:4px;text-decoration:none;justify-content:center}`}</style>
      <div className="ud-wrap"><main className="ud-main" style={{ marginLeft: 0 }}><div className="ud-content"><Link href={backHref} style={{ color: "var(--green)", fontWeight: 800 }}>Back</Link>{children}</div></main></div>
    </>
  );
}

function ServicePicker({ services }) {
  return (
    <div className="row g-4 mt-2">
      <div className="col-12"><div className="ud-stat-label">New Order</div><h1 style={{ color: "#fff" }}>Select a service</h1></div>
      {services.map((service) => (
        <div className="col-md-6 col-xl-4" key={service._id.toString()}>
          <Link href={`/checkout?service=${service.slug}`} className="ud-card d-block h-100 text-decoration-none">
            <h2 className="h5" style={{ color: "#fff" }}>{service.title}</h2>
            <p className="text-secondary mb-3">{service.metaDescription || "Start this service and upload your documents."}</p>
            <strong style={{ color: "var(--green)" }}>{money(service.price || 0, "usd")}</strong>
          </Link>
        </div>
      ))}
      {services.length === 0 && <div className="col-12 text-secondary">No active services available.</div>}
    </div>
  );
}

import Link from "next/link";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";

export default async function ThankYouPage({ searchParams }) {
  const params = await searchParams;
  const orderId = params?.orderId || "";
  const sessionId = params?.session_id || "";

  if (orderId && sessionId) {
    await connectToDatabase();
    const settings = await Settings.findOne({ type: "theme" });
    if (settings?.stripeSecretKey) {
      try {
        const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${settings.stripeSecretKey}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.payment_status === "paid") {
          await Order.findByIdAndUpdate(orderId, {
            paymentStatus: "paid",
            stripeCheckoutSessionId: data.id,
            stripePaymentIntentId: data.payment_intent || "",
          });
        }
      } catch {}
    }
  }

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
      <div className="d-flex align-items-center" style={{ background: "#000", minHeight: "100vh", color: "#e8e8e8" }}>
        <div className="container py-5">
          <div className="mx-auto text-center" style={{ maxWidth: 720 }}>
            <div style={{ color: "#8AD974", textTransform: "uppercase", fontWeight: 800, letterSpacing: ".14em", fontSize: ".75rem", marginBottom: 14 }}>Thank You</div>
            <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(2rem,4vw,3.4rem)" }}>Your order is submitted</h1>
            <p className="text-secondary mx-auto">We created your client account and saved your order. You can track progress, view documents, and check payment status from your dashboard.</p>
            <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
              {orderId ? (
                <Link href={`/dashboard/orders/${orderId}`} className="btn" style={{ background: "#8AD974", color: "#000", fontWeight: 800 }}>Track Order <i className="bi bi-arrow-right" /></Link>
              ) : (
                <Link href="/dashboard" className="btn" style={{ background: "#8AD974", color: "#000", fontWeight: 800 }}>Go to Dashboard</Link>
              )}
              <Link href="/dashboard" className="btn btn-outline-light">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Order from "@/models/Order";
import "@/models/Service";

function money(amount, currency = "usd") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
}

function paid(order) {
  return order.paymentStatus === "paid";
}

export default async function DashboardInvoicesPage() {
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const orders = await Order.find({ user: session.user.id }).populate("service", "title slug price").sort({ createdAt: -1 });
  const totalPaid = orders.filter(paid).reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const totalDue = orders.filter((order) => !paid(order)).reduce((sum, order) => sum + Number(order.amount || 0), 0);

  return (
    <div className="space-y-4">
      <style>{`
        .inv-hero{position:relative;overflow:hidden;border:1px solid rgba(198,167,107,.16);background:linear-gradient(135deg,rgba(198,167,107,.16),rgba(198,167,107,.06) 56%,rgba(240,169,136,.08));border-radius:24px;padding:24px;margin-bottom:22px}
        .inv-hero:before{content:"";position:absolute;right:-80px;top:-90px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(198,167,107,.22),transparent 68%)}
        .inv-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px;position:relative}
        .inv-stat{border:1px solid rgba(198,167,107,.14);background:rgba(0,0,0,.18);border-radius:16px;padding:14px}
        .inv-stat strong{display:block;color:var(--text-on-dark, #fff);font-size:1.15rem;font-weight:900}
        .inv-table-wrap{overflow:hidden;border:1px solid rgba(198,167,107,.12);border-radius:20px;background:rgba(255,255,255,.02)}
        .inv-row-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
        .inv-download{background:rgba(198,167,107,.1)!important;border-color:rgba(198,167,107,.28)!important;color:var(--cyan)!important}
        .inv-status{display:inline-flex;align-items:center;border-radius:999px;padding:5px 11px;font-size:.68rem;font-weight:900;text-transform:uppercase;border:1px solid rgba(255,255,255,.16);white-space:nowrap}
        .inv-paid{background:rgba(138,217,116,.13);border-color:rgba(138,217,116,.34);color:var(--green)}
        .inv-due{background:rgba(240,169,136,.12);border-color:rgba(240,169,136,.32);color:var(--coral)}
        @media(max-width:760px){.inv-stats{grid-template-columns:1fr}.inv-row-actions{justify-content:flex-start}}
      `}</style>

      <section className="inv-hero">
        <div className="position-relative d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <div className="ud-stat-label">Billing Center</div>
            <h1 className="m-0" style={{ color: "#fff", fontWeight: 900 }}>Invoices</h1>
            <p className="mb-0 mt-2 text-secondary">Download GST-ready tax invoices for your service orders.</p>
          </div>
          <span className="ud-badge">{orders.length} invoice{orders.length === 1 ? "" : "s"}</span>
        </div>
        <div className="inv-stats">
          <div className="inv-stat">
            <div className="ud-stat-label">Total Paid</div>
            <strong>{money(totalPaid, orders[0]?.currency || "usd")}</strong>
          </div>
          <div className="inv-stat">
            <div className="ud-stat-label">Total Due</div>
            <strong>{money(totalDue, orders[0]?.currency || "usd")}</strong>
          </div>
          <div className="inv-stat">
            <div className="ud-stat-label">Latest Invoice</div>
            <strong>{orders[0] ? `INV-${orders[0]._id.toString().slice(-8).toUpperCase()}` : "-"}</strong>
          </div>
        </div>
      </section>

      <div className="ud-card">
        <div className="ud-card-header">
          <h2 className="ud-card-title"><i className="bi bi-receipt me-2" style={{ color: "var(--cyan)" }} />Invoice History</h2>
        </div>
        <div className="table-responsive inv-table-wrap">
          <table className="ud-table">
            <thead><tr><th>Invoice</th><th>Order</th><th>Service</th><th>Date</th><th>Status</th><th>Amount</th><th /></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id.toString()}>
                  <td><strong>INV-{order._id.toString().slice(-8).toUpperCase()}</strong></td>
                  <td>#{order._id.toString().slice(-8).toUpperCase()}</td>
                  <td>{order.service?.title || "Service"}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td><span className={`inv-status ${paid(order) ? "inv-paid" : "inv-due"}`}>{paid(order) ? "Paid" : "Due"}</span></td>
                  <td><strong>{money(order.amount, order.currency || "usd")}</strong></td>
                  <td>
                    <div className="inv-row-actions">
                      <Link href={`/dashboard/orders/${order._id}`} className="ud-outline"><i className="bi bi-eye" /> View</Link>
                      <a href={`/api/account/orders/${order._id}/invoice`} className="ud-outline inv-download">
                        <i className="bi bi-download" /> Download PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="7" className="text-center py-5">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

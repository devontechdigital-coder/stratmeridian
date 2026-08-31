import Link from "next/link";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Order from "@/models/Order";
import "@/models/Service";

function money(amount, currency = "usd") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const orders = await Order.find({ user: session.user.id }).populate("service", "title slug price").sort({ createdAt: -1 });
  const completed = orders.filter((order) => order.status === "completed").length;
  const inProgress = orders.filter((order) => order.status !== "completed").length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

  return (
    <div>
      <div className="row g-3 mb-4">
        <Stat icon="bi-bag-check" label="Total Orders" value={orders.length} />
        <Stat icon="bi-check-circle" label="Completed" value={completed} />
        <Stat icon="bi-hourglass-split" label="In Progress" value={inProgress} />
        <Stat icon="bi-currency-dollar" label="Total Spent" value={money(totalSpent, orders[0]?.currency || "usd")} />
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="ud-card">
            <div className="ud-card-header">
              <h2 className="ud-card-title"><i className="bi bi-clock-history me-2" style={{ color: "var(--green)" }} />Recent Orders</h2>
              <Link href="/dashboard/orders" style={{ color: "var(--green)", fontSize: ".78rem", fontWeight: 800 }}>View All →</Link>
            </div>
            <OrdersTable orders={orders.slice(0, 4)} />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="ud-card">
            <h2 className="ud-card-title mb-4"><i className="bi bi-activity me-2" style={{ color: "var(--cyan)" }} />Recent Activity</h2>
            {orders.slice(0, 4).map((order) => (
              <div key={order._id.toString()} className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: ".88rem" }}>Order {order.status}</div>
                <div style={{ color: "var(--text-d)", fontSize: ".8rem" }}>{order.service?.title || "Service"} · #{order._id.toString().slice(-8).toUpperCase()}</div>
                <div style={{ color: "var(--muted)", fontSize: ".72rem", marginTop: 4 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-secondary mb-0">No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="col-lg-3 col-md-6">
      <div className="ud-stat">
        <div className="mb-3"><i className={`bi ${icon}`} style={{ color: "var(--green)", fontSize: "1.35rem" }} /></div>
        <div className="ud-stat-val">{value}</div>
        <div className="ud-stat-label">{label}</div>
      </div>
    </div>
  );
}

function OrdersTable({ orders }) {
  return (
    <div className="table-responsive">
      <table className="ud-table">
        <thead><tr><th>Order</th><th>Service</th><th>Date</th><th>Status</th><th>Amount</th><th /></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id.toString()}>
              <td><strong>#{order._id.toString().slice(-8).toUpperCase()}</strong></td>
              <td>{order.service?.title || "Service"}</td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td><span className="ud-badge">{order.status}</span></td>
              <td>{money(order.amount, order.currency || "usd")}</td>
              <td><Link className="ud-outline" href={`/dashboard/orders/${order._id}`}>View</Link></td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan="6" className="text-center py-5">No orders yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

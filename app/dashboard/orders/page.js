import Link from "next/link";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Order from "@/models/Order";
import "@/models/Service";
import UserOrdersTable from "@/components/public/UserOrdersTable";

export default async function DashboardOrdersPage() {
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const orders = await Order.find({ user: session.user.id }).populate("service", "title slug price").sort({ createdAt: -1 });
  const serializedOrders = JSON.parse(JSON.stringify(orders));

  return (
    <div className="ud-card">
      <div className="ud-card-header">
        <h1 className="ud-card-title"><i className="bi bi-bag-check me-2" style={{ color: "var(--green)" }} />All Orders</h1>
        <Link href="/checkout" className="ud-main-btn"><i className="bi bi-plus" /> New Order</Link>
      </div>
      <UserOrdersTable initialOrders={serializedOrders} />
    </div>
  );
}

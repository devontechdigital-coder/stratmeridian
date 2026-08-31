import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Order from "@/models/Order";
import "@/models/Service";

export default async function DashboardDocumentsPage() {
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const orders = await Order.find({ user: session.user.id }).populate("service", "title slug").sort({ createdAt: -1 });
  const documents = orders.flatMap((order) => (order.documents || []).map((doc) => ({ ...doc, order })));

  return (
    <div className="ud-card">
      <div className="ud-card-header">
        <h1 className="ud-card-title"><i className="bi bi-folder2-open me-2" style={{ color: "var(--coral)" }} />My Documents</h1>
      </div>
      <div className="row g-3">
        {documents.map((doc) => (
          <div className="col-md-6 col-lg-4" key={`${doc.order._id}-${doc.publicId || doc.url}`}>
            <a href={doc.url} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-3 rounded-3 p-3 text-decoration-none" style={{ background: "var(--dark4)", border: "1px solid rgba(255,255,255,.07)" }}>
              <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: 44, height: 44, color: "var(--cyan)", background: "rgba(97,203,243,.08)", border: "1px solid rgba(97,203,243,.2)" }}>
                <i className="bi bi-file-earmark-text" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="text-white fw-bold text-truncate">{doc.name}</div>
                <div className="text-secondary small">{Math.round((doc.size || 0) / 1024)} KB · {doc.order.service?.title || "Order"}</div>
              </div>
            </a>
          </div>
        ))}
        {documents.length === 0 && <div className="col-12 text-center text-secondary py-5">No documents uploaded yet.</div>}
      </div>
    </div>
  );
}

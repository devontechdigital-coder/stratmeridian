import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Order from "@/models/Order";
import "@/models/Service";

function money(amount, currency = "usd") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
}

function documentTitle(doc) {
  return doc.displayName || String(doc.name || "").split("/").pop() || "Document";
}

function isAdminDocument(doc) {
  return doc.source === "admin" || String(doc.publicId || doc.name || "").includes("/admin-documents/");
}

function progressIndex(status) {
  const normalized = status === "submitted" ? "pending" : status;
  if (normalized === "new") return 0;
  if (normalized === "pending") return 1;
  if (normalized === "processing") return 2;
  if (normalized === "completed") return 4;
  if (normalized === "cancelled") return 0;
  return 1;
}

export default async function DashboardOrderViewPage({ params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  await connectToDatabase();
  const order = await Order.findOne({ _id: id, user: session.user.id }).populate("service", "title slug price");
  if (!order) notFound();

  const activeIndex = progressIndex(order.status);
  const documents = order.documents || [];
  const userDocuments = documents.filter((doc) => !isAdminDocument(doc));
  const adminDocuments = documents.filter(isAdminDocument);

  return (
    <div>
      <style>{`
        .order-hero{position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,rgba(198,167,107,.16),rgba(198,167,107,.06) 48%,rgba(240,169,136,.08));border:1px solid rgba(198,167,107,.16);padding:26px;margin:14px 0 24px}
        .order-hero:before{content:"";position:absolute;inset:auto -80px -110px auto;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(198,167,107,.2),transparent 65%)}
        .order-back{color:var(--green)!important;font-weight:900;text-decoration:none}
        .order-meta-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:22px}
        .order-meta{border:1px solid rgba(198,167,107,.14);background:rgba(0,0,0,.18);border-radius:14px;padding:14px}
        .doc-grid{display:grid;gap:12px}
        .doc-card{display:flex;align-items:center;justify-content:space-between;gap:14px;text-decoration:none;border:1px solid rgba(198,167,107,.14);background:rgba(255,255,255,.04);border-radius:14px;padding:14px;color:var(--text)!important;transition:.2s}
        .doc-card:hover{border-color:rgba(198,167,107,.32);background:rgba(198,167,107,.08)}
        .doc-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);color:var(--green);flex-shrink:0}
        .doc-title{font-weight:900;color:var(--text-on-dark, #fff);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px}
        .doc-meta{font-size:.76rem;color:var(--muted);font-weight:700}
        .doc-pill{font-size:.62rem;font-weight:900;text-transform:uppercase;border-radius:999px;padding:5px 9px;border:1px solid rgba(198,167,107,.16)}
        .doc-pill.user{color:var(--green);background:rgba(198,167,107,.1);border-color:rgba(198,167,107,.24)}
        .doc-pill.admin{color:var(--cyan);background:rgba(198,167,107,.1);border-color:rgba(198,167,107,.24)}
        .doc-empty{border:1px dashed rgba(198,167,107,.2);border-radius:14px;padding:22px;text-align:center;color:var(--muted);font-weight:700}
        .progress-row:last-child{padding-bottom:0!important}
        @media(max-width:991px){.order-meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:575px){.order-meta-grid{grid-template-columns:1fr}.doc-card{align-items:flex-start}.doc-title{max-width:190px}}
      `}</style>

      <Link href="/dashboard/orders" className="order-back">Back to orders</Link>

      <section className="order-hero">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 position-relative">
          <div>
            <div className="ud-stat-label">Order ID</div>
            <h1 className="m-0" style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 900 }}>#{order._id.toString().slice(-8).toUpperCase()}</h1>
            <p className="mb-0 mt-2 text-secondary">{order.service?.title || "Service"}</p>
          </div>
          <span className="ud-badge">{order.status}</span>
        </div>
        <div className="order-meta-grid position-relative">
          <Meta label="Placed On" value={new Date(order.createdAt).toLocaleDateString()} />
          <Meta label="Payment" value={order.paymentStatus} />
          <Meta label="Amount" value={money(order.amount, order.currency || "usd")} />
          <Meta label="Documents" value={`${documents.length} file${documents.length === 1 ? "" : "s"}`} />
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="ud-card">
            <h2 className="ud-card-title mb-4"><i className="bi bi-list-check me-2" style={{ color: "var(--green)" }} />Filing Progress</h2>
            {["Order Placed", "Documents Received", "Return Preparation", "Review & Approval", "Filed with IRS"].map((step, index) => (
              <div key={step} className="progress-row d-flex gap-3 pb-4">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 38, height: 38, background: index <= activeIndex ? "var(--green)" : "rgba(255,255,255,.06)", color: index <= activeIndex ? "#000" : "var(--muted)", fontWeight: 900 }}>
                  {index <= activeIndex ? <i className="bi bi-check" /> : index + 1}
                </div>
                <div>
                  <h3 className="h6 mb-1" style={{ color: "#fff" }}>{step}</h3>
                  <p className="text-secondary mb-0 small">{index === 0 ? `Created ${new Date(order.createdAt).toLocaleString()}` : index <= activeIndex ? "Completed or in progress." : "Pending"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="ud-card mb-4">
            <h2 className="ud-card-title mb-4"><i className="bi bi-folder2-open me-2" style={{ color: "var(--green)" }} />User Documents</h2>
            <DocumentList documents={userDocuments} source="user" />
          </div>
          <div className="ud-card mb-4">
            <h2 className="ud-card-title mb-4"><i className="bi bi-folder-check me-2" style={{ color: "var(--cyan)" }} />Admin Documents</h2>
            <DocumentList documents={adminDocuments} source="admin" />
          </div>
          <div className="ud-card">
            <h2 className="ud-card-title mb-4">Order Details</h2>
            <Info label="Name" value={order.fullName} full />
            <Info label="Email" value={order.email} full />
            <Info label="Phone" value={order.phone} full />
            <Info label="Address" value={order.address} full />
            {order.adminComment && <Info label="Admin Note" value={order.adminComment} full />}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentList({ documents, source }) {
  if (!documents.length) {
    return <div className="doc-empty">No {source} documents uploaded.</div>;
  }

  return (
    <div className="doc-grid">
      {documents.map((doc) => (
        <a key={doc.publicId || doc.url} href={doc.url} target="_blank" rel="noreferrer" className="doc-card">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div className="doc-icon"><i className="bi bi-file-earmark-text" /></div>
            <div className="min-w-0">
              <div className="doc-title">{documentTitle(doc)}</div>
              <div className="doc-meta">{doc.contentType || "Document"} / {Math.round((doc.size || 0) / 1024)} KB</div>
            </div>
          </div>
          <span className={`doc-pill ${source}`}>{source}</span>
        </a>
      ))}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="order-meta">
      <div className="ud-stat-label">{label}</div>
      <div style={{ color: "#fff", fontWeight: 900 }}>{value || "-"}</div>
    </div>
  );
}

function Info({ label, value, full }) {
  return (
    <div className={full ? "mb-3" : "col-6 col-md-3"}>
      <div className="ud-stat-label">{label}</div>
      <div style={{ color: "#fff", fontWeight: 800, overflowWrap: "anywhere" }}>{value || "-"}</div>
    </div>
  );
}

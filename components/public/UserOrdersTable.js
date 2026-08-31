"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

const editableStatuses = ["submitted", "pending", "processing"];

function money(amount, currency = "usd") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
}

function blankDocumentRow() {
  return { id: `${Date.now()}-${Math.random()}`, name: "", file: null };
}

function canEditOrder(order) {
  return editableStatuses.includes(order.status);
}

function documentTitle(doc) {
  return doc.displayName || String(doc.name || "").split("/").pop() || "Document";
}

function isAdminDocument(doc) {
  return doc.source === "admin" || String(doc.publicId || doc.name || "").includes("/admin-documents/");
}

function statusClass(status) {
  const normalized = status === "submitted" ? "pending" : status;
  const classes = {
    new: "state-new",
    pending: "state-pending",
    processing: "state-processing",
    completed: "state-completed",
    cancelled: "state-cancelled",
  };
  return classes[normalized] || "state-new";
}

function paymentClass(status) {
  const classes = {
    paid: "pay-paid",
    pending: "pay-pending",
    failed: "pay-failed",
    not_required: "pay-muted",
  };
  return classes[status] || "pay-muted";
}

function fileKind(doc) {
  const type = String(doc.contentType || "").toLowerCase();
  const name = documentTitle(doc).toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (type.includes("image") || /\.(png|jpe?g|webp|gif)$/i.test(name)) return "Image";
  if (/\.(doc|docx)$/i.test(name)) return "Doc";
  return "File";
}

export default function UserOrdersTable({ initialOrders = [] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [editingOrder, setEditingOrder] = useState(null);
  const [documents, setDocuments] = useState([blankDocumentRow()]);
  const [saving, setSaving] = useState(false);

  const openEdit = (order) => {
    setEditingOrder(order);
    setDocuments([blankDocumentRow()]);
  };

  const closeEdit = () => {
    if (!saving) setEditingOrder(null);
  };

  const updateDocumentRow = (id, patch) => {
    setDocuments((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addDocumentRow = () => setDocuments((prev) => [...prev, blankDocumentRow()]);

  const removeDocumentRow = (id) => {
    setDocuments((prev) => (prev.length === 1 ? [blankDocumentRow()] : prev.filter((row) => row.id !== id)));
  };

  const existingDocuments = editingOrder?.documents || [];
  const existingUserDocuments = existingDocuments.filter((doc) => !isAdminDocument(doc));
  const existingAdminDocuments = existingDocuments.filter(isAdminDocument);

  const saveDocuments = async () => {
    if (!editingOrder) return;
    const rowsWithFiles = documents.filter((row) => row.file);
    if (!rowsWithFiles.length) {
      toast.error("Please upload at least one document");
      return;
    }
    if (rowsWithFiles.some((row) => !row.name.trim())) {
      toast.error("Document name is required");
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      rowsWithFiles.forEach((row) => {
        body.append("documentNames", row.name.trim());
        body.append("documents", row.file);
      });

      const res = await fetch(`/api/account/orders/${editingOrder._id}`, {
        method: "PUT",
        body,
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((order) => (order._id === editingOrder._id ? data.data : order)));
        toast.success("Documents updated");
        setEditingOrder(null);
      } else {
        toast.error(data.message || "Document update failed");
      }
    } catch {
      toast.error("Document update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="table-responsive">
        <table className="ud-table">
          <thead><tr><th>Order ID</th><th>Service</th><th>Date</th><th>Status</th><th>Payment</th><th>Amount</th><th>Action</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td><strong>#{order._id.slice(-8).toUpperCase()}</strong></td>
                <td>{order.service?.title || "Service"}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td><span className={`ud-state-badge ${statusClass(order.status)}`}>{order.status}</span></td>
                <td><span className={`ud-state-badge ${paymentClass(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                <td><strong>{money(order.amount, order.currency || "usd")}</strong></td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    <Link href={`/dashboard/orders/${order._id}`} className="ud-outline"><i className="bi bi-eye" /> View</Link>
                    {canEditOrder(order) && (
                      <button type="button" className="ud-outline ud-edit-doc-btn" onClick={() => openEdit(order)}>
                        <i className="bi bi-upload" /> Edit Docs
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="7" className="text-center py-5">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {editingOrder && (
        <div className="ud-modal-backdrop">
          <div className="ud-modal">
            <div className="ud-modal-head">
              <div>
                <div className="ud-stat-label">Update Documents</div>
                <h2>{editingOrder.service?.title || "Service"}</h2>
                <p>Order #{editingOrder._id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="ud-modal-stats">
                <span className={`ud-state-badge ${statusClass(editingOrder.status)}`}>{editingOrder.status}</span>
                <span>{existingUserDocuments.length} user file{existingUserDocuments.length === 1 ? "" : "s"}</span>
              </div>
              <button type="button" onClick={closeEdit} aria-label="Close document upload"><i className="bi bi-x-lg" /></button>
            </div>

            <div className="ud-modal-body">
              <div className="ud-doc-note">
                <i className="bi bi-shield-check" />
                <span>You can add your own documents to this active order. Admin documents cannot be changed here.</span>
              </div>

              <div className="ud-existing-wrap">
                <ExistingDocuments title="Your Existing Documents" source="user" documents={existingUserDocuments} />
                <ExistingDocuments title="Admin Documents" source="admin" documents={existingAdminDocuments} />
              </div>

              <div className="ud-upload-title">
                <span>Add New Documents</span>
                <small>Document name is required</small>
              </div>
              {documents.map((row) => (
                <div className="ud-upload-row" key={row.id}>
                  <label className="ud-upload-field">
                    <span>Document Name</span>
                    <input value={row.name} onChange={(e) => updateDocumentRow(row.id, { name: e.target.value })} placeholder="e.g. Passport copy" />
                  </label>
                  <label className="ud-file-picker">
                    <input type="file" onChange={(e) => updateDocumentRow(row.id, { file: e.target.files?.[0] || null })} />
                    <span className="ud-file-icon"><i className="bi bi-cloud-arrow-up" /></span>
                    <span className="ud-file-text">{row.file?.name || "Choose file"}</span>
                  </label>
                  <button type="button" className="ud-upload-remove" onClick={() => removeDocumentRow(row.id)} aria-label="Remove document"><i className="bi bi-trash" /></button>
                </div>
              ))}
              <button type="button" className="ud-add-row" onClick={addDocumentRow}><i className="bi bi-plus-lg" /> Add another document</button>
            </div>

            <div className="ud-modal-foot">
              <button type="button" className="ud-outline" onClick={closeEdit} disabled={saving}>Cancel</button>
              <button type="button" className="ud-main-btn border-0" onClick={saveDocuments} disabled={saving}>
                {saving ? "Saving..." : "Save Documents"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ud-edit-doc-btn{background:rgba(138,217,116,.08)}
        .ud-state-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 11px;font-size:.68rem;font-weight:900;text-transform:uppercase;border:1px solid rgba(255,255,255,.16);white-space:nowrap}
        .state-new{background:rgba(97,203,243,.11);border-color:rgba(97,203,243,.28);color:var(--cyan)}
        .state-pending{background:rgba(240,169,136,.12);border-color:rgba(240,169,136,.32);color:var(--coral)}
        .state-processing{background:rgba(97,203,243,.14);border-color:rgba(97,203,243,.38);color:#8bdcff}
        .state-completed{background:rgba(138,217,116,.13);border-color:rgba(138,217,116,.34);color:var(--green)}
        .state-cancelled,.pay-failed{background:rgba(248,113,113,.13);border-color:rgba(248,113,113,.34);color:#fca5a5}
        .pay-paid{background:rgba(138,217,116,.13);border-color:rgba(138,217,116,.34);color:var(--green)}
        .pay-pending{background:rgba(240,169,136,.12);border-color:rgba(240,169,136,.32);color:var(--coral)}
        .pay-muted{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:var(--text-d)}
        .ud-modal-backdrop{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto}
        .ud-modal{width:min(920px,100%);background:#101010;border:1px solid rgba(255,255,255,.1);border-radius:22px;box-shadow:0 24px 80px rgba(0,0,0,.5);overflow:hidden}
        .ud-modal-head{display:grid;grid-template-columns:1fr auto auto;align-items:flex-start;gap:18px;padding:24px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(138,217,116,.08),rgba(255,255,255,.02))}
        .ud-modal-head h2{margin:4px 0;color:#fff;font-size:1.2rem;font-weight:900}
        .ud-modal-head p{margin:0;color:var(--muted);font-weight:800}
        .ud-modal-head button{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff}
        .ud-modal-stats{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;color:var(--text-d);font-size:.74rem;font-weight:900;text-transform:uppercase}
        .ud-modal-body{padding:24px;display:grid;gap:14px}
        .ud-doc-note{display:flex;gap:10px;align-items:center;border:1px solid rgba(138,217,116,.22);background:rgba(138,217,116,.08);color:var(--green);font-size:.86rem;font-weight:800;padding:13px 14px;border-radius:12px}
        .ud-existing-wrap{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        :global(.ud-doc-panel){border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border-radius:18px;padding:15px;min-width:0}
        :global(.ud-doc-panel-head){display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
        :global(.ud-doc-panel h3){margin:0;color:#fff;font-size:.78rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;line-height:1.2}
        :global(.ud-doc-count){border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(0,0,0,.2);color:var(--text-d);font-size:.65rem;font-weight:900;padding:4px 8px;white-space:nowrap}
        :global(.ud-existing-list){display:grid;gap:10px}
        :global(.ud-existing-doc){display:grid;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.24);border-radius:15px;padding:12px;color:var(--text)!important;text-decoration:none!important;transition:.2s}
        :global(.ud-existing-doc:hover){border-color:rgba(138,217,116,.34);background:rgba(138,217,116,.07);transform:translateY(-1px)}
        :global(.ud-existing-doc.admin:hover){border-color:rgba(97,203,243,.34);background:rgba(97,203,243,.07)}
        :global(.ud-existing-icon){width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(138,217,116,.22),rgba(97,203,243,.16));color:var(--green);font-size:1.25rem}
        :global(.ud-existing-doc.admin .ud-existing-icon){background:linear-gradient(135deg,rgba(97,203,243,.22),rgba(255,255,255,.06));color:var(--cyan)}
        :global(.ud-existing-info){min-width:0}
        :global(.ud-existing-name){display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-weight:900;font-size:.9rem}
        :global(.ud-existing-meta){display:flex;flex-wrap:wrap;gap:6px;margin-top:5px;color:var(--muted);font-size:.7rem;font-weight:900;text-transform:uppercase}
        :global(.ud-existing-meta span){border-radius:999px;background:rgba(255,255,255,.06);padding:3px 7px}
        :global(.ud-view-chip){display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(138,217,116,.24);background:rgba(138,217,116,.09);color:var(--green);border-radius:999px;padding:7px 10px;font-size:.68rem;font-weight:900;text-transform:uppercase;white-space:nowrap}
        :global(.ud-existing-doc.admin .ud-view-chip){border-color:rgba(97,203,243,.26);background:rgba(97,203,243,.09);color:var(--cyan)}
        :global(.ud-existing-empty){border:1px dashed rgba(255,255,255,.12);border-radius:14px;padding:22px;text-align:center;color:var(--muted);font-weight:800;font-size:.82rem;background:rgba(0,0,0,.16)}
        .ud-upload-title{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-top:2px;color:#fff;font-weight:900}
        .ud-upload-title small{color:var(--muted);font-size:.75rem;font-weight:800}
        .ud-upload-row{display:grid;grid-template-columns:1fr 1.15fr auto;gap:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);border-radius:16px;padding:12px}
        .ud-upload-field{display:grid;gap:7px;margin:0}
        .ud-upload-field span{font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
        .ud-upload-field input{min-height:46px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.22);color:#fff;padding:10px 12px;font-weight:800}
        .ud-upload-field input::placeholder{color:#777}
        .ud-file-picker{position:relative;display:flex;align-items:center;gap:10px;min-height:46px;margin-top:22px;border-radius:10px;border:1px dashed rgba(97,203,243,.32);background:rgba(97,203,243,.07);color:#fff;padding:10px 12px;font-weight:800;overflow:hidden}
        .ud-file-picker input{position:absolute;inset:0;opacity:0;cursor:pointer}
        .ud-file-icon{color:var(--cyan);font-size:1.1rem}
        .ud-file-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)}
        .ud-upload-remove{align-self:end;width:46px;height:46px;border-radius:10px;border:1px solid rgba(240,169,136,.28);background:rgba(240,169,136,.1);color:var(--coral)}
        .ud-add-row{justify-self:start;border:1px solid rgba(97,203,243,.28);background:rgba(97,203,243,.08);color:var(--cyan);font-weight:900;border-radius:10px;padding:10px 14px}
        .ud-modal-foot{display:flex;justify-content:flex-end;gap:12px;padding:18px 24px;border-top:1px solid rgba(255,255,255,.08);background:#0c0c0c}
        @media(max-width:820px){.ud-existing-wrap{grid-template-columns:1fr}}
        @media(max-width:720px){.ud-modal-head{grid-template-columns:1fr auto}.ud-modal-stats{grid-column:1/-1;justify-content:flex-start}:global(.ud-existing-doc){grid-template-columns:42px minmax(0,1fr)}:global(.ud-view-chip){grid-column:1/-1;justify-content:center}.ud-upload-row{grid-template-columns:1fr}.ud-file-picker{margin-top:0}.ud-upload-remove{width:100%}.ud-modal-foot{flex-direction:column}.ud-modal-foot button,.ud-modal-foot a{justify-content:center}.ud-upload-title{display:block}.ud-upload-title small{display:block;margin-top:4px}}
      `}</style>
    </>
  );
}

function ExistingDocuments({ title, source, documents }) {
  return (
    <section className="ud-doc-panel">
      <div className="ud-doc-panel-head">
        <h3>{title}</h3>
        <span className="ud-doc-count">{documents.length} file{documents.length === 1 ? "" : "s"}</span>
      </div>
      <div className="ud-existing-list">
        {documents.map((doc) => (
          <a key={doc.publicId || doc.url} href={doc.url} target="_blank" rel="noreferrer" className={`ud-existing-doc ${source}`}>
            <div className="ud-existing-icon">
              <i className={`bi ${source === "admin" ? "bi-folder-check" : "bi-file-earmark-text"}`} />
            </div>
            <div className="ud-existing-info">
              <span className="ud-existing-name">{documentTitle(doc)}</span>
              <div className="ud-existing-meta">
                <span>{fileKind(doc)}</span>
                <span>{Math.round((doc.size || 0) / 1024)} KB</span>
                <span>{source}</span>
              </div>
            </div>
            <span className="ud-view-chip"><i className="bi bi-box-arrow-up-right" /> View</span>
          </a>
        ))}
        {documents.length === 0 && <div className="ud-existing-empty">No documents yet.</div>}
      </div>
    </section>
  );
}

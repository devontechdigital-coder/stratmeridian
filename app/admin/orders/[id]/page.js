import Link from 'next/link';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import '@/models/User';
import '@/models/Service';

function money(amount, currency = 'usd') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'usd' }).format(Number(amount || 0));
}

function documentTitle(doc) {
  return doc.displayName || String(doc.name || '').split('/').pop() || 'Document';
}

function isAdminDocument(doc) {
  return doc.source === 'admin' || String(doc.publicId || doc.name || '').includes('/admin-documents/');
}

export default async function AdminOrderDetailPage({ params }) {
  const { id } = await params;
  await connectToDatabase();
  const order = await Order.findById(id).populate('user', 'name email').populate('service', 'title slug price');
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm font-semibold text-violet-600 hover:text-violet-700">Back to orders</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Order #{order._id.toString().slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-slate-500">{order.service?.title}</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-slate-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</p>
          <p className="text-xl font-black text-slate-900">{money(order.amount, order.currency)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-800">Customer</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Name" value={order.fullName} />
            <Info label="Email" value={order.email} />
            <Info label="Phone" value={order.phone} />
            <Info label="Phone Country" value={order.phoneCountry} />
            <div className="md:col-span-2"><Info label="Address" value={order.address} /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-800">Status</h2>
          <Info label="Order Status" value={order.status} />
          <div className="mt-4"><Info label="Payment Status" value={order.paymentStatus} /></div>
          <div className="mt-4"><Info label="Created" value={new Date(order.createdAt).toLocaleString()} /></div>
          <div className="mt-4"><Info label="Admin Comment" value={order.adminComment} /></div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-800">Documents</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(order.documents || []).map((doc) => (
            <a key={doc.publicId || doc.url} href={doc.url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-slate-900">{documentTitle(doc)}</p>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase ${isAdminDocument(doc) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {isAdminDocument(doc) ? 'admin' : 'user'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{doc.contentType || 'Document'} / {Math.round((doc.size || 0) / 1024)} KB</p>
            </a>
          ))}
          {(!order.documents || order.documents.length === 0) && <p className="text-sm text-slate-400">No documents uploaded.</p>}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
  );
}

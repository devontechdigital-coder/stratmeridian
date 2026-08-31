import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import '@/models/User';
import '@/models/Service';
import { requireModulePermission } from '@/lib/adminPermissions';
import { uploadFile } from '@/lib/gcs';
import { getSmtpSettings, sendSmtpMail } from '@/lib/emailSmtp';

const editableStatuses = ['new', 'pending', 'processing', 'completed', 'cancelled'];

function cleanDocumentName(name = '') {
  return String(name)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}

function isFile(value) {
  return value && typeof value === 'object' && typeof value.arrayBuffer === 'function' && value.size > 0;
}

function getExtension(filename = '') {
  const parts = String(filename).split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

function fileWithDisplayName(file, displayName) {
  const safeName = cleanDocumentName(displayName);
  const hasExtension = /\.[a-z0-9]{1,10}$/i.test(safeName);
  const fileName = hasExtension ? safeName : `${safeName}${getExtension(file.name)}`;
  return {
    name: fileName,
    type: file.type || 'application/octet-stream',
    size: file.size,
    arrayBuffer: () => file.arrayBuffer(),
  };
}

function statusLabel(status) {
  return String(status || 'new')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendStatusChangeEmail(order, previousStatus, nextStatus) {
  const to = order.email || order.user?.email;
  if (!to) return;

  const settings = await getSmtpSettings();
  const brandName = settings?.websiteName || settings?.smtpFromName || 'Strat Meridian';
  const logoUrl = settings?.metaLogo || '';
  const supportEmail = settings?.emailId || settings?.smtpFromEmail || settings?.smtpUser || '';
  const supportPhone = settings?.phoneNumber || '';
  const serviceTitle = order.service?.title || 'your service order';
  const orderNumber = order._id.toString().slice(-8).toUpperCase();
  const customerName = order.fullName || order.user?.name || '';
  const currentStatus = statusLabel(nextStatus);
  const previousStatusLabel = statusLabel(previousStatus);
  const comment = order.adminComment
    ? `
      <tr>
        <td style="padding:16px 18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:14px">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:#9a3412">Admin note</p>
          <p style="margin:0;font-size:15px;color:#431407">${escapeHtml(order.adminComment)}</p>
        </td>
      </tr>
    `
    : '';
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brandName)}" style="max-height:48px;max-width:150px;display:block" />`
    : `<div style="font-size:24px;font-weight:900;letter-spacing:.04em;color:#ffffff">${escapeHtml(brandName)}</div>`;
  const support = [supportEmail, supportPhone].filter(Boolean).join(' / ');

  await sendSmtpMail({
    to,
    subject: `Order #${orderNumber} status updated`,
    text: [
      `Hello ${customerName},`,
      '',
      `Your order for ${serviceTitle} has been updated from ${statusLabel(previousStatus)} to ${statusLabel(nextStatus)}.`,
      order.adminComment ? `Admin note: ${order.adminComment}` : '',
      '',
      `Order ID: #${orderNumber}`,
    ].filter(Boolean).join('\n'),
    html: `
      <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f4f7fb">
          <tr>
            <td align="center" style="padding:32px 14px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse">
                <tr>
                  <td style="padding:24px 28px;background:#020617;border-radius:24px 24px 0 0">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                      <tr>
                        <td>${logo}</td>
                        <td align="right" style="font-size:12px;color:#93c5fd;font-weight:800;text-transform:uppercase;letter-spacing:.1em">Order Update</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#ffffff;padding:30px 28px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
                    <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#0f172a">Your order status changed</h1>
                    <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#475569">Hello ${escapeHtml(customerName)}, your order for <strong>${escapeHtml(serviceTitle)}</strong> has a new progress update.</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 14px">
                      <tr>
                        <td style="padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                            <tr>
                              <td style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#64748b">Order ID</td>
                              <td align="right" style="font-size:14px;font-weight:900;color:#0f172a">#${orderNumber}</td>
                            </tr>
                            <tr>
                              <td style="padding-top:14px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#64748b">Previous</td>
                              <td align="right" style="padding-top:14px;font-size:14px;font-weight:800;color:#64748b">${escapeHtml(previousStatusLabel)}</td>
                            </tr>
                            <tr>
                              <td style="padding-top:14px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#64748b">Current</td>
                              <td align="right" style="padding-top:14px">
                                <span style="display:inline-block;border-radius:999px;background:#dcfce7;color:#166534;padding:8px 14px;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(currentStatus)}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${comment}
                    </table>
                    <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#64748b">We will keep you updated as your order moves forward. Please reply to this email if you need to share anything with our team.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:0 0 24px 24px">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b"><strong style="color:#334155">${escapeHtml(brandName)}</strong>${support ? ` / ${escapeHtml(support)}` : ''}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}

export async function GET(req, { params }) {
  const permission = await requireModulePermission('orders', 'view');
  if (!permission.ok) return permission.response;

  try {
    await connectToDatabase();
    const { id } = await params;
    const order = await Order.findById(id).populate('user', 'name email').populate('service', 'title slug price');
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const permission = await requireModulePermission('orders', 'edit');
  if (!permission.ok) return permission.response;

  try {
    await connectToDatabase();
    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    const previousStatus = order.status;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const status = String(formData.get('status') || '');
      const adminComment = String(formData.get('adminComment') || '');
      const documentNames = formData.getAll('documentNames').map((name) => cleanDocumentName(name));
      const documents = formData.getAll('documents').filter(isFile);

      if (editableStatuses.includes(status)) order.status = status;
      order.adminComment = adminComment;

      if (documents.length) {
        const folder = `orders/${order._id}/admin-documents`;
        const uploadedDocs = await Promise.all(documents.map(async (file, index) => {
          const displayName = documentNames[index] || cleanDocumentName(file.name);
          const renamedFile = fileWithDisplayName(file, displayName);
          const uploaded = await uploadFile(renamedFile, folder);
          return {
            ...uploaded,
            displayName,
            source: 'admin',
            uploadedAt: new Date(),
          };
        }));
        order.documents.push(...uploadedDocs);
      }

      await order.save();
    } else {
      const body = await req.json();
      if (editableStatuses.includes(body.status)) order.status = body.status;
      if (typeof body.adminComment === 'string') order.adminComment = body.adminComment;
      await order.save();
    }

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('service', 'title slug price');

    if (previousStatus !== updatedOrder.status) {
      try {
        await sendStatusChangeEmail(updatedOrder, previousStatus, updatedOrder.status);
      } catch (emailError) {
        console.error('Order status email error:', emailError);
      }
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

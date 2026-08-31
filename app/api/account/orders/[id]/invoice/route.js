import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from '@/lib/authOptions';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import '@/models/Service';

const GST_RATE = 0.18;

function money(amount, currency = 'usd') {
  return `${String(currency || 'usd').toUpperCase()} ${Number(amount || 0).toFixed(2)}`;
}

function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

function isSameState(settings, order) {
  return Boolean(settings?.state && order?.state && normalize(settings.state) === normalize(order.state));
}

function gstBreakdown(totalAmount, settings, order) {
  const total = Number(totalAmount || 0);
  const taxable = total / (1 + GST_RATE);
  const tax = total - taxable;
  if (isSameState(settings, order)) {
    return { taxable, cgst: tax / 2, sgst: tax / 2, igst: 0, total, label: 'CGST + SGST' };
  }
  return { taxable, cgst: 0, sgst: 0, igst: tax, total, label: 'IGST' };
}

function pdfEscape(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '');
}

function textLine(text, x, y, size = 11, color = '0.08 0.1 0.14') {
  return `BT ${color} rg /F1 ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}

function boldText(text, x, y, size = 11, color = '0.08 0.1 0.14') {
  return `BT ${color} rg /F2 ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}

function fillRect(x, y, w, h, color = '1 1 1') {
  return `q ${color} rg ${x} ${y} ${w} ${h} re f Q`;
}

function strokeRect(x, y, w, h, color = '0.9 0.9 0.9', width = 0.5) {
  return `q ${color} RG ${width} w ${x} ${y} ${w} ${h} re S Q`;
}

function hLine(x1, y, x2, color = '0.85 0.87 0.92', lw = 0.5) {
  return `q ${color} RG ${lw} w ${x1} ${y} m ${x2} ${y} l S Q`;
}

function vLine(x, y1, y2, color = '0.85 0.87 0.92', lw = 0.5) {
  return `q ${color} RG ${lw} w ${x} ${y1} m ${x} ${y2} l S Q`;
}

function drawImage(name, x, y, width, height) {
  return `q ${width} 0 0 ${height} ${x} ${y} cm /${name} Do Q`;
}

function parallelogram(x, y, w, h, skew, color) {
  // Draws a skewed rectangle (parallelogram) for accent stripe
  const x1 = x, y1 = y;
  const x2 = x + w, y2 = y;
  const x3 = x + w + skew, y3 = y + h;
  const x4 = x + skew, y4 = y + h;
  return `q ${color} rg ${x1} ${y1} m ${x2} ${y2} l ${x3} ${y3} l ${x4} ${y4} l f Q`;
}

function wrapText(value = '', maxChars = 44) {
  const words = String(value || '-').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) { lines.push(current); current = word; }
    else { current = next; }
  });
  if (current) lines.push(current);
  return lines.length ? lines : ['-'];
}

function wrappedText(value, x, y, maxChars = 42, maxLines = 3, size = 9, color = '0.08 0.1 0.14', lineGap = 14) {
  return wrapText(value, maxChars)
    .slice(0, maxLines)
    .map((line, i) => textLine(line, x, y - (i * lineGap), size, color));
}

function getJpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return null;
}

function cloudinaryJpegUrl(url) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/f_jpg,w_320/');
}

async function fetchLogoImage(logoUrl, req) {
  if (!logoUrl) return null;
  try {
    const absoluteUrl = logoUrl.startsWith('/') ? new URL(logoUrl, req.url).toString() : cloudinaryJpegUrl(logoUrl);
    const res = await fetch(absoluteUrl);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    const data = Buffer.from(await res.arrayBuffer());
    if (!contentType.includes('jpeg') && !contentType.includes('jpg') && data[0] !== 0xff) return null;
    const size = getJpegSize(data);
    if (!size) return null;
    return { data, ...size };
  } catch { return null; }
}

function buildPdf(lines, logoImage = null) {
  const content = lines.join('\n');
  const contentObjectNumber = logoImage ? 7 : 6;
  const xObject = logoImage ? ' /XObject << /Logo 6 0 R >>' : '';
  const objects = [
    Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'),
    Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>${xObject} >> /Contents ${contentObjectNumber} 0 R >>`),
    Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
    Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'),
  ];

  if (logoImage) {
    objects.push(Buffer.concat([
      Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.data.length} >>\nstream\n`),
      logoImage.data,
      Buffer.from('\nendstream'),
    ]));
  }

  objects.push(Buffer.from(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`));

  const chunks = [Buffer.from('%PDF-1.4\n')];
  const offsets = [];
  let length = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(length);
    const chunk = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`),
      object,
      Buffer.from('\nendobj\n'),
    ]);
    chunks.push(chunk);
    length += chunk.length;
  });
  const xrefOffset = length;
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => { trailer += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  trailer += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(Buffer.from(trailer));
  return Buffer.concat(chunks);
}

// ─── Color palette ────────────────────────────────────────────────────────────
// Navy deep:      0.04 0.06 0.12  (#0A0F1E)
// Indigo accent:  0.39 0.40 0.95  (#6366F1)
// Indigo mid:     0.24 0.27 0.80  (#3D45CC)
// Silver light:   0.91 0.92 0.96  (#E8EAF5)
// Off-white bg:   0.97 0.98 0.99  (#F8F9FC)
// Slate text:     0.24 0.29 0.38  (#3D4A61)
// Muted text:     0.50 0.55 0.63  (#8090A1)
// Emerald:        0.06 0.72 0.51  (#0FB883)
// Amber:          0.93 0.58 0.15  (#ED9426)

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const order = await Order.findOne({ _id: id, user: session.user.id }).populate('service', 'title slug price');
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    const settings = await Settings.findOne({ type: 'theme' }).lean();
    const invoiceNo = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
    const currency = order.currency || settings?.stripeCurrency || 'usd';
    const tax = gstBreakdown(order.amount, settings, order);
    const businessAddress = [settings?.address, settings?.city, settings?.state, settings?.country].filter(Boolean).join(', ');
    const businessContact = [settings?.emailId, settings?.phoneNumber].filter(Boolean).join(' | ');
    const customerAddress = [order.address, order.city, order.state, order.country].filter(Boolean).join(', ');
    const brandName = settings?.websiteName || 'Strat Meridian';
    const orderNo = `#${order._id.toString().slice(-8).toUpperCase()}`;
    const paid = order.paymentStatus === 'paid';
    const logoImage = await fetchLogoImage(settings?.metaLogo, req);
    const logoScale = logoImage ? Math.min(120 / logoImage.width, 38 / logoImage.height) : 1;
    const logoWidth = logoImage ? Math.max(38, Math.round(logoImage.width * logoScale)) : 0;
    const logoHeight = logoImage ? Math.max(14, Math.round(logoImage.height * logoScale)) : 0;

    const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const dueDateStr = new Date(new Date(order.createdAt).getTime() + 30 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const lines = [
      // ── Page background ────────────────────────────────────────────────────
      fillRect(0, 0, 612, 792, '0.97 0.98 0.99'),

      // ── Left accent sidebar ────────────────────────────────────────────────
      fillRect(0, 0, 6, 792, '0.39 0.40 0.95'),

      // ── Header band (deep navy) ────────────────────────────────────────────
      fillRect(0, 700, 612, 92, '0.04 0.06 0.12'),

      // ── Diagonal slash accents inside header (layered for depth) ──────────
      parallelogram(320, 700, 180, 92, 40, '0.07 0.09 0.18'),
      parallelogram(460, 700, 100, 92, 40, '0.09 0.12 0.22'),
      parallelogram(530, 700, 60, 92, 40, '0.24 0.27 0.80'),

      // ── Indigo bottom edge of header ──────────────────────────────────────
      fillRect(0, 698, 612, 3, '0.39 0.40 0.95'),

      // ── Logo or brand name ────────────────────────────────────────────────
      ...(logoImage
        ? [drawImage('Logo', 30, 728, logoWidth, logoHeight)]
        : [boldText(brandName, 30, 752, 26, '1 1 1')]),

      // ── "TAX INVOICE" label ───────────────────────────────────────────────
      textLine('TAX INVOICE', 30, 720, 8, '0.60 0.62 0.95'),

      // ── Invoice number & date (header right) ──────────────────────────────
      textLine('INVOICE NUMBER', 400, 760, 7.5, '0.60 0.62 0.95'),
      boldText(invoiceNo, 400, 745, 13, '1 1 1'),
      textLine('DATE ISSUED', 400, 730, 7.5, '0.60 0.62 0.95'),
      textLine(dateStr, 400, 717, 9.5, '0.82 0.84 0.98'),

      // ── Status pill (paid / due) ───────────────────────────────────────────
      ...(paid
        ? [fillRect(510, 745, 70, 22, '0.06 0.72 0.51'), boldText('PAID', 530, 752, 9, '1 1 1')]
        : [fillRect(510, 745, 70, 22, '0.93 0.58 0.15'), boldText('DUE', 534, 752, 9, '1 1 1')]
      ),

      // ── White content card shadow (simulate with light gray) ──────────────
      fillRect(28, 82, 556, 608, '0.88 0.89 0.93'),
      // ── White content card ────────────────────────────────────────────────
      fillRect(26, 84, 556, 608, '1 1 1'),

      // ── META ROW: Order, GST type, Due date ───────────────────────────────
      fillRect(26, 648, 556, 44, '0.97 0.97 0.99'),
      hLine(26, 648, 582, '0.88 0.89 0.94', 0.5),
      hLine(26, 692, 582, '0.88 0.89 0.94', 0.5),
      vLine(210, 648, 692, '0.88 0.89 0.94'),
      vLine(396, 648, 692, '0.88 0.89 0.94'),

      textLine('ORDER', 46, 679, 7.5, '0.50 0.55 0.63'),
      boldText(orderNo, 46, 664, 11, '0.04 0.06 0.12'),

      textLine('GST TREATMENT', 230, 679, 7.5, '0.50 0.55 0.63'),
      boldText(tax.label, 230, 664, 11, '0.04 0.06 0.12'),

      textLine('DUE DATE', 416, 679, 7.5, '0.50 0.55 0.63'),
      boldText(paid ? 'Settled' : dueDateStr, 416, 664, 11, '0.04 0.06 0.12'),

      // ── BILL FROM / BILL TO columns ────────────────────────────────────────
      hLine(26, 584, 582, '0.91 0.92 0.96'),
      vLine(304, 584, 644, '0.91 0.92 0.96'),

      // Bill From
      textLine('BILL FROM', 46, 634, 7.5, '0.39 0.40 0.95'),
      boldText(brandName, 46, 618, 11, '0.04 0.06 0.12'),
      ...wrappedText(businessAddress || '-', 46, 602, 35, 3, 8.5, '0.35 0.40 0.50'),
      ...wrappedText(businessContact || '-', 46, 570, 35, 2, 8, '0.50 0.55 0.63'),

      // Bill To
      textLine('BILL TO', 324, 634, 7.5, '0.39 0.40 0.95'),
      boldText(order.fullName || order.user?.name || '-', 324, 618, 11, '0.04 0.06 0.12'),
      textLine(order.email || '-', 324, 602, 8.5, '0.35 0.40 0.50'),
      ...wrappedText(customerAddress || '-', 324, 588, 35, 3, 8.5, '0.35 0.40 0.50'),

      hLine(26, 584, 582, '0.91 0.92 0.96'),

      // ── SERVICE TABLE HEADER ───────────────────────────────────────────────
      fillRect(26, 542, 556, 30, '0.04 0.06 0.12'),
      textLine('DESCRIPTION', 46, 553, 8, '0.60 0.62 0.95'),
      textLine('TAXABLE AMOUNT', 360, 553, 8, '0.60 0.62 0.95'),
      textLine('TOTAL', 502, 553, 8, '0.60 0.62 0.95'),

      // ── SERVICE ROW ───────────────────────────────────────────────────────
      hLine(26, 542, 582, '0.91 0.92 0.96'),
      hLine(26, 484, 582, '0.91 0.92 0.96'),
      vLine(346, 484, 542, '0.91 0.92 0.96'),
      vLine(490, 484, 542, '0.91 0.92 0.96'),

      ...wrappedText(order.service?.title || 'Professional Service', 46, 526, 42, 2, 10, '0.04 0.06 0.12'),
      textLine('GST-inclusive professional tax filing service', 46, 502, 8, '0.50 0.55 0.63'),

      textLine(money(tax.taxable, currency), 360, 516, 10, '0.24 0.29 0.38'),
      boldText(money(tax.total, currency), 502, 516, 10, '0.04 0.06 0.12'),

      // ── BOTTOM SECTION: Total card + Tax breakdown ─────────────────────────
      hLine(26, 484, 582, '0.91 0.92 0.96'),

      // Total card (indigo gradient using layered rects)
      fillRect(26, 300, 250, 178, '0.04 0.06 0.12'),
      fillRect(26, 300, 6, 178, '0.39 0.40 0.95'),
      parallelogram(160, 300, 116, 178, 60, '0.06 0.09 0.16'),
      parallelogram(216, 300, 90, 178, 60, '0.09 0.12 0.20'),

      boldText('INVOICE TOTAL', 50, 458, 9, '0.60 0.62 0.95'),
      boldText(money(tax.total, currency), 50, 422, 22, '1 1 1'),
      hLine(50, 412, 256, '0.20 0.24 0.40', 0.5),
      textLine(`Currency: ${String(currency).toUpperCase()}`, 50, 395, 8.5, '0.60 0.62 0.95'),
      textLine(`Payment: ${order.paymentStatus || 'pending'}`, 50, 378, 8.5, '0.60 0.62 0.95'),
      textLine('GST included in total.', 50, 355, 8, '0.40 0.44 0.60'),
      textLine('18% applied to service amount.', 50, 340, 8, '0.40 0.44 0.60'),
      ...(paid
        ? [fillRect(50, 314, 80, 18, '0.06 0.72 0.51'), boldText('PAID', 72, 321, 8, '1 1 1')]
        : [fillRect(50, 314, 80, 18, '0.93 0.58 0.15'), boldText('PENDING', 60, 321, 8, '1 1 1')]
      ),

      // Tax breakdown card
      fillRect(284, 300, 298, 178, '1 1 1'),
      strokeRect(284, 300, 298, 178, '0.91 0.92 0.96', 0.5),
      fillRect(284, 448, 298, 30, '0.97 0.97 0.99'),
      hLine(284, 448, 582, '0.91 0.92 0.96', 0.5),

      boldText('TAX BREAKDOWN', 304, 462, 8.5, '0.24 0.29 0.38'),
      textLine('Rate: 18% GST', 450, 462, 8, '0.50 0.55 0.63'),

      textLine('Taxable Amount', 304, 432, 9, '0.35 0.40 0.50'),
      boldText(money(tax.taxable, currency), 462, 432, 9, '0.04 0.06 0.12'),
      hLine(304, 422, 562, '0.91 0.92 0.96', 0.5),

      textLine('CGST (9%)', 304, 406, 9, '0.35 0.40 0.50'),
      textLine(money(tax.cgst, currency), 462, 406, 9, '0.35 0.40 0.50'),

      textLine('SGST (9%)', 304, 386, 9, '0.35 0.40 0.50'),
      textLine(money(tax.sgst, currency), 462, 386, 9, '0.35 0.40 0.50'),

      textLine('IGST (18%)', 304, 366, 9, '0.35 0.40 0.50'),
      textLine(money(tax.igst, currency), 462, 366, 9, '0.35 0.40 0.50'),

      hLine(304, 354, 562, '0.39 0.40 0.95', 1),
      boldText('Total Tax', 304, 338, 9.5, '0.04 0.06 0.12'),
      boldText(money(tax.total - tax.taxable, currency), 462, 338, 9.5, '0.39 0.40 0.95'),

      fillRect(284, 300, 298, 24, '0.97 0.97 0.99'),
      hLine(284, 324, 582, '0.91 0.92 0.96', 0.5),
      textLine('All amounts are in ' + String(currency).toUpperCase(), 304, 310, 7.5, '0.50 0.55 0.63'),

      // ── FOOTER ─────────────────────────────────────────────────────────────
      hLine(26, 290, 582, '0.91 0.92 0.96'),
      fillRect(26, 84, 556, 200, '1 1 1'),

      // Footer left: thank you note
      boldText('Thank you for your business.', 46, 264, 11, '0.04 0.06 0.12'),
      textLine('For billing questions, please reach out to our support team.', 46, 246, 8.5, '0.50 0.55 0.63'),
      ...wrappedText(businessContact || '-', 46, 228, 55, 1, 8, '0.39 0.40 0.95'),

      // Footer divider
      hLine(26, 216, 582, '0.91 0.92 0.96', 0.5),

      // Footer bottom row
      textLine(`Invoice No: ${invoiceNo}`, 46, 200, 7.5, '0.50 0.55 0.63'),
      textLine(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 46, 186, 7.5, '0.65 0.68 0.72'),
      textLine(`${brandName} | Tax Invoice | GST 18%`, 46, 172, 7.5, '0.65 0.68 0.72'),

      // Footer right: indigo accent dot cluster
      fillRect(490, 190, 8, 8, '0.39 0.40 0.95'),
      fillRect(504, 190, 8, 8, '0.60 0.62 0.95'),
      fillRect(518, 190, 8, 8, '0.80 0.81 0.97'),

      // Page border accent lines (left sidebar extension)
      fillRect(0, 84, 6, 614, '0.91 0.92 0.96'),
      fillRect(0, 300, 6, 184, '0.39 0.40 0.95'),
    ].flat();

    const pdf = buildPdf(lines, logoImage);
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNo}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
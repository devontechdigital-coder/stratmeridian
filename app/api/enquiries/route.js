import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import Service from '@/models/Service';
import { getSmtpSettings, sendSmtpMail } from '@/lib/emailSmtp';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const comment = body.comment?.trim();
    const source = body.source?.trim() || 'home';
    const serviceId = body.serviceId?.trim();
    let serviceTitle = body.serviceTitle?.trim() || '';

    if (!fullName || !email || !phone || !comment) {
      return NextResponse.json({ success: false, message: 'Name, email, phone and comment are required' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address' }, { status: 400 });
    }

    let service = null;
    if (serviceId) {
      service = await Service.findById(serviceId).select('title');
      serviceTitle = service?.title || serviceTitle;
    }

    const enquiry = await Enquiry.create({
      fullName,
      email,
      phone,
      comment,
      source,
      service: service?._id || null,
      serviceTitle,
    });

    try {
      const settings = await getSmtpSettings();
      const to = settings?.emailId || settings?.smtpFromEmail || settings?.smtpUser;
      if (to) {
        const rows = [
          ['Name', fullName],
          ['Email', email],
          ['Phone', phone],
          ['Source', source],
          ['Service', serviceTitle || '-'],
          ['Comment', comment],
        ];
        await sendSmtpMail({
          to,
          subject: `New enquiry from ${fullName}`,
          text: rows.map(([label, value]) => `${label}: ${value}`).join('\n'),
          html: `
            <h2>New Enquiry</h2>
            <table cellpadding="8" cellspacing="0" border="0">
              ${rows.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('')}
            </table>
          `,
        });
      }
    } catch (error) {
      console.error('Enquiry email error:', error);
    }

    return NextResponse.json({ success: true, data: enquiry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit enquiry' }, { status: 500 });
  }
}

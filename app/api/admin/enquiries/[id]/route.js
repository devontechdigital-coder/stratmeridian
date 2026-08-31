import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import '@/models/Service';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function PUT(req, { params }) {
  const permission = await requireModulePermission('enquiries', 'edit');
  if (!permission.ok) return permission.response;

  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const update = {};

    if (['new', 'contacted', 'in_progress', 'closed'].includes(body.status)) update.status = body.status;
    if (typeof body.notes === 'string') update.notes = body.notes.trim();

    const enquiry = await Enquiry.findByIdAndUpdate(id, update, { new: true }).populate('service', 'title slug');
    if (!enquiry) return NextResponse.json({ success: false, message: 'Enquiry not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

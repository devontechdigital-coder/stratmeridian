import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import '@/models/Service';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function GET(req) {
  const permission = await requireModulePermission('enquiries', 'view');
  if (!permission.ok) return permission.response;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 10), 1), 100);
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const search = searchParams.get('search')?.trim() || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const query = {};
    if (['new', 'contacted', 'in_progress', 'closed'].includes(status)) query.status = status;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
        { serviceTitle: { $regex: search, $options: 'i' } },
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) query.createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    const [items, total] = await Promise.all([
      Enquiry.find(query)
        .populate('service', 'title slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Enquiry.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

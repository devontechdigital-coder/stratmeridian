import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import '@/models/User';
import '@/models/Service';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function GET() {
  const permission = await requireModulePermission('orders', 'view');
  if (!permission.ok) return permission.response;

  try {
    await connectToDatabase();
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('service', 'title slug price')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

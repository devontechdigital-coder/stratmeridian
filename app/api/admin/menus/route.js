import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Menu from '@/models/Menu';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function GET(req) {
  const permission = await requireModulePermission('settings', 'view');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ success: false, message: 'Type is required' }, { status: 400 });
    }

    let menu = await Menu.findOne({ type });
    if (!menu) {
      // Create a default empty menu if not found
      menu = await Menu.create({ type, items: [] });
    }

    return NextResponse.json({ success: true, data: menu });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const permission = await requireModulePermission('settings', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const body = await req.json();
    const { type, items } = body;

    if (!type) {
      return NextResponse.json({ success: false, message: 'Type is required' }, { status: 400 });
    }

    const menu = await Menu.findOneAndUpdate(
      { type },
      { items },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: menu });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getMenuItems } from '@/lib/getMenus';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ success: false, message: 'Type is required' }, { status: 400 });
    }

    const items = await getMenuItems(type);
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

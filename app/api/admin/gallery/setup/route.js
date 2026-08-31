import { NextResponse } from 'next/server';
import { setupCors } from '@/lib/gcs';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function POST() {
  try {
    const permission = await requireModulePermission('gallery', 'edit');
    if (!permission.ok) return permission.response;

    await setupCors();
    return NextResponse.json({ success: true, message: 'CORS configuration applied successfully' });
  } catch (error) {
    console.error('Gallery setup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

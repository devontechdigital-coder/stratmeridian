import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/gcs';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function POST(req) {
  try {
    const permission = await requireModulePermission('gallery', 'edit');
    if (!permission.ok) return permission.response;

    const formData = await req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || '';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    const asset = await uploadFile(file, folder);
    return NextResponse.json({ success: true, file: asset });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

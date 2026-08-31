import { NextResponse } from 'next/server';
import { createFolder } from '@/lib/gcs';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function POST(req) {
  try {
    const permission = await requireModulePermission('gallery', 'edit');
    if (!permission.ok) return permission.response;

    const { folderPath } = await req.json();

    if (!folderPath) {
      return NextResponse.json({ success: false, error: 'FolderPath is required' }, { status: 400 });
    }

    await createFolder(folderPath);
    return NextResponse.json({ success: true, message: 'Folder created successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

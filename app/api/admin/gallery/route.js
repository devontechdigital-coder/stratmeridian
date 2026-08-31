import { NextResponse } from 'next/server';
import { listFiles, deleteFile } from '@/lib/gcs';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function GET(req) {
  try {
    const permission = await requireModulePermission('gallery', 'view');
    if (!permission.ok) return permission.response;

    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get('prefix') || '';

    const { files, folders } = await listFiles(prefix);
    return NextResponse.json({ success: true, files, folders });
  } catch (error) {
    console.error('Gallery list error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const permission = await requireModulePermission('gallery', 'edit');
    if (!permission.ok) return permission.response;

    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ success: false, error: 'File/Folder name is required' }, { status: 400 });
    }

    await deleteFile(name);
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('Gallery delete error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Page from '@/models/Page';
import slugify from 'slugify';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function GET() {
  const permission = await requireModulePermission('pages', 'view');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const pages = await Page.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const permission = await requireModulePermission('pages', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (body.slug) {
      body.slug = slugify(body.slug, { lower: true, strict: true });
    } else {
      body.slug = slugify(body.title, { lower: true, strict: true });
    }

    const page = await Page.create(body);
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

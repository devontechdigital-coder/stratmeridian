import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Page from '@/models/Page';
import slugify from 'slugify';
import { requireModulePermission } from '@/lib/adminPermissions';

export async function GET(req, { params }) {
  const permission = await requireModulePermission('pages', 'view');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const page = await Page.findById(id);
    if (!page) {
      return NextResponse.json({ success: false, message: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const permission = await requireModulePermission('pages', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    if (body.slug) {
      body.slug = slugify(body.slug, { lower: true, strict: true });
    }

    const page = await Page.findByIdAndUpdate(id, body, { new: true });
    if (!page) {
      return NextResponse.json({ success: false, message: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const permission = await requireModulePermission('pages', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const page = await Page.findByIdAndDelete(id);
    if (!page) {
      return NextResponse.json({ success: false, message: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

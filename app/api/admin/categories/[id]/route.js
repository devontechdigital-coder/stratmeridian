import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Category from '@/models/Category';
import Service from '@/models/Service';
import slugify from 'slugify';
import { requireModulePermission } from '@/lib/adminPermissions';

function normalizeCategoryBody(body, id) {
  const payload = { ...body };
  if (payload.slug) {
    payload.slug = slugify(payload.slug, { lower: true, strict: true });
  }
  payload.parent = payload.parent || null;
  if (payload.parent === id) {
    payload.parent = null;
  }
  return payload;
}

export async function GET(req, { params }) {
  const permission = await requireModulePermission('categories', 'view');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const category = await Category.findById(id).populate('parent', 'title slug');
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const permission = await requireModulePermission('categories', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = normalizeCategoryBody(await req.json(), id);
    const category = await Category.findByIdAndUpdate(id, body, { new: true });
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const permission = await requireModulePermission('categories', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const serviceCount = await Service.countDocuments({ category: id });
    if (serviceCount > 0) {
      return NextResponse.json({ success: false, message: 'Move services out of this category before deleting it' }, { status: 400 });
    }
    await Category.updateMany({ parent: id }, { $set: { parent: null } });
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

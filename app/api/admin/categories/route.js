import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Category from '@/models/Category';
import slugify from 'slugify';
import { requireModulePermission } from '@/lib/adminPermissions';

function normalizeCategoryBody(body) {
  const payload = { ...body };
  payload.slug = slugify(payload.slug || payload.title || '', { lower: true, strict: true });
  payload.parent = payload.parent || null;
  return payload;
}

export async function GET() {
  const permission = await requireModulePermission('categories', 'view');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const categories = await Category.find({}).populate('parent', 'title slug').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const permission = await requireModulePermission('categories', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const body = normalizeCategoryBody(await req.json());
    const category = await Category.create(body);
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

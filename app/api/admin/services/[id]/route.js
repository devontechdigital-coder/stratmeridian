import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Service from '@/models/Service';
import '@/models/Category';
import slugify from 'slugify';
import { requireModulePermission } from '@/lib/adminPermissions';

function normalizeServiceBody(body) {
  const payload = { ...body };
  if (payload.slug) {
    payload.slug = slugify(payload.slug, { lower: true, strict: true });
  }
  payload.category = payload.category || null;
  payload.price = payload.price === '' || payload.price === null || payload.price === undefined ? 0 : Number(payload.price);
  payload.buttonLabel = typeof payload.buttonLabel === 'string' ? payload.buttonLabel.trim() : payload.buttonLabel;
  payload.shortParagraph = typeof payload.shortParagraph === 'string' ? payload.shortParagraph.trim() : payload.shortParagraph;
  payload.heroFeatures = Array.isArray(payload.heroFeatures)
    ? payload.heroFeatures
      .map((feature) => ({
        icon: typeof feature.icon === 'string' ? feature.icon.trim() : 'bi-shield-check',
        title: typeof feature.title === 'string' ? feature.title.trim() : '',
        description: typeof feature.description === 'string' ? feature.description.trim() : '',
      }))
      .filter((feature) => feature.title || feature.description)
    : [];
  return payload;
}

export async function GET(req, { params }) {
  const permission = await requireModulePermission('services', 'view');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const service = await Service.findById(id).populate('category', 'title slug');
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const permission = await requireModulePermission('services', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = normalizeServiceBody(await req.json());
    const service = await Service.findByIdAndUpdate(id, body, { new: true });
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }
    await Service.collection.updateOne(
      { _id: service._id },
      { $set: { heroFeatures: body.heroFeatures || [] } }
    );
    service.heroFeatures = body.heroFeatures || [];
    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const permission = await requireModulePermission('services', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

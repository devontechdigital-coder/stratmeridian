import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Service from '@/models/Service';
import '@/models/Category';
import slugify from 'slugify';
import { requireModulePermission } from '@/lib/adminPermissions';

function normalizeServiceBody(body) {
  const payload = { ...body };
  payload.slug = slugify(payload.slug || payload.title || '', { lower: true, strict: true });
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

export async function GET() {
  const permission = await requireModulePermission('services', 'view');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const services = await Service.find({}).populate('category', 'title slug').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const permission = await requireModulePermission('services', 'edit');
  if (!permission.ok) {
    return permission.response;
  }
  try {
    await connectToDatabase();
    const body = normalizeServiceBody(await req.json());
    const service = await Service.create(body);
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

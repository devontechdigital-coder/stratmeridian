import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from '@/lib/authOptions';
import Order from '@/models/Order';
import '@/models/Service';
import { uploadFile } from '@/lib/gcs';

const userEditableStatuses = ['submitted', 'pending', 'processing'];

function cleanDocumentName(name = '') {
  return String(name)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}

function isFile(value) {
  return value && typeof value === 'object' && typeof value.arrayBuffer === 'function' && value.size > 0;
}

function getExtension(filename = '') {
  const parts = String(filename).split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

function fileWithDisplayName(file, displayName) {
  const safeName = cleanDocumentName(displayName);
  const hasExtension = /\.[a-z0-9]{1,10}$/i.test(safeName);
  const fileName = hasExtension ? safeName : `${safeName}${getExtension(file.name)}`;
  return {
    name: fileName,
    type: file.type || 'application/octet-stream',
    size: file.size,
    arrayBuffer: () => file.arrayBuffer(),
  };
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const order = await Order.findOne({ _id: id, user: session.user.id }).populate('service', 'title slug price');
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const order = await Order.findOne({ _id: id, user: session.user.id });
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    if (!userEditableStatuses.includes(order.status)) {
      return NextResponse.json({ success: false, message: 'Documents can only be updated on active orders' }, { status: 400 });
    }

    const formData = await req.formData();
    const documentNames = formData.getAll('documentNames').map((name) => cleanDocumentName(name));
    const documents = formData.getAll('documents').filter(isFile);

    if (!documents.length) {
      return NextResponse.json({ success: false, message: 'Please upload at least one document' }, { status: 400 });
    }

    if (documents.some((_, index) => !documentNames[index])) {
      return NextResponse.json({ success: false, message: 'Document name is required for every upload' }, { status: 400 });
    }

    const folder = `users/${session.user.id}/orders/${order._id}`;
    const uploadedDocs = await Promise.all(documents.map(async (file, index) => {
      const displayName = documentNames[index];
      const renamedFile = fileWithDisplayName(file, displayName);
      const uploaded = await uploadFile(renamedFile, folder);
      return {
        ...uploaded,
        displayName,
        source: 'user',
        uploadedAt: new Date(),
      };
    }));

    order.documents.push(...uploadedDocs);
    await order.save();

    const updatedOrder = await Order.findOne({ _id: id, user: session.user.id }).populate('service', 'title slug price');
    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

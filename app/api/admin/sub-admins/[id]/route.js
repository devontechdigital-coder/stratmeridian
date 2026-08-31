import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import bcrypt from 'bcryptjs';

// UPDATE sub-admin
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, password, permissions, isBlocked } = body;
    const email = body.email?.trim().toLowerCase();

    await connectToDatabase();

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address' }, { status: 400 });
    }

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'User already exists with this email' }, { status: 409 });
      }
    }

    const updateData = { name, email, permissions, isBlocked };
    
    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const subAdmin = await User.findOneAndUpdate(
      { _id: id, role: 'sub-admin' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!subAdmin) {
      return NextResponse.json({ success: false, error: 'Sub-admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: subAdmin });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, error: 'User already exists with this email' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE sub-admin
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const subAdmin = await User.findOneAndDelete({ _id: id, role: 'sub-admin' });

    if (!subAdmin) {
      return NextResponse.json({ success: false, error: 'Sub-admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Sub-admin deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

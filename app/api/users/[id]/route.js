import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { requireModulePermission } from '@/lib/adminPermissions';

// GET Single User
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const permission = await requireModulePermission('users', 'view');
    if (!permission.ok) {
      return permission.response;
    }

    await connectToDatabase();
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("GET User Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// UPDATE User
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const permission = await requireModulePermission('users', 'edit');
    if (!permission.ok) {
      return permission.response;
    }
    const session = permission.session;

    const body = await request.json();
    await connectToDatabase();
    if (body.email) {
      body.email = body.email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(body.email)) {
        return NextResponse.json({ success: false, error: 'Please provide a valid email address' }, { status: 400 });
      }

      const existingUser = await User.findOne({ email: body.email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'User already exists with this email' }, { status: 409 });
      }
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from blocking themselves
    if (id === session.user.id && body.isBlocked === true) {
        return NextResponse.json({ success: false, error: 'You cannot block yourself' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).select('-password');

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, error: 'User already exists with this email' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE User
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const permission = await requireModulePermission('users', 'edit');
    if (!permission.ok) {
      return permission.response;
    }
    const session = permission.session;

    await connectToDatabase();
    
    if (id === session.user.id) {
        return NextResponse.json({ success: false, error: 'You cannot delete yourself' }, { status: 400 });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

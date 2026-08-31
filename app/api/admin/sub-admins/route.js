import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import bcrypt from 'bcryptjs';

// GET all sub-admins
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const subAdmins = await User.find({ role: 'sub-admin' }).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: subAdmins });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// CREATE sub-admin
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, password, permissions } = body;
    const email = body.email?.trim().toLowerCase();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email and password are required' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address' }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User already exists with this email' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const subAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'sub-admin',
      permissions: permissions || {
        users: { view: false, edit: false },
        pages: { view: true, edit: false },
        categories: { view: true, edit: false },
        services: { view: true, edit: false },
        orders: { view: true, edit: false },
        gallery: { view: false, edit: false },
        settings: { view: false, edit: false },
        dashboard: { view: false, edit: false },
      }
    });

    const subAdminObj = subAdmin.toObject();
    delete subAdminObj.password;

    return NextResponse.json({ success: true, data: subAdminObj });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, error: 'User already exists with this email' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { requireModulePermission } from "@/lib/adminPermissions";
import { withHomePageDefaults } from "@/lib/homePageDefaults";

export async function GET() {
  const permission = await requireModulePermission("settings", "view");
  if (!permission.ok) return permission.response;

  try {
    await connectToDatabase();
    const settings = await Settings.findOne({ type: "homepage" }).lean();
    return NextResponse.json({ success: true, data: withHomePageDefaults(settings?.content || {}) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const permission = await requireModulePermission("settings", "edit");
  if (!permission.ok) return permission.response;

  try {
    const body = await request.json();
    const content = withHomePageDefaults(body?.content || {});
    await connectToDatabase();
    await Settings.findOneAndUpdate(
      { type: "homepage" },
      { $set: { type: "homepage", content } },
      { new: true, upsert: true, runValidators: true }
    );
    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

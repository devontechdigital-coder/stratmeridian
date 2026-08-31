import connectToDatabase from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { withHomePageDefaults } from "@/lib/homePageDefaults";

export async function getHomePageSettings() {
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({ type: "homepage" }).lean();
    return withHomePageDefaults(settings?.content || {});
  } catch (error) {
    console.error("Unable to load homepage settings:", error);
    return withHomePageDefaults();
  }
}

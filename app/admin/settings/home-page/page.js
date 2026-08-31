import HomePageSettingsForm from "@/components/admin/HomePageSettingsForm";

export const metadata = {
  title: "Home Page Settings | Admin",
  description: "Manage every section of the public home page.",
};

export default function HomePageSettingsPage() {
  return <div className="p-4 md:p-8"><HomePageSettingsForm /></div>;
}

import ThemeSettingsForm from "@/components/admin/ThemeSettingsForm";

export const metadata = {
  title: "Theme Settings | Admin",
  description: "Configure website appearance, SEO, and contact information.",
};

export default function ThemeSettingsPage() {
  return (
    <div className="p-4 md:p-8">
      <ThemeSettingsForm />
    </div>
  );
}

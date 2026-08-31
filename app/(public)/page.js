import HomePageContent from "@/components/public/HomePageContent";
import { getHomePageSettings } from "@/lib/getHomePageSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getHomePageSettings();
  return {
    title: settings.seo.title,
    description: settings.seo.description,
    keywords: settings.seo.keywords,
  };
}

export default async function HomePage() {
  const settings = await getHomePageSettings();
  return <HomePageContent settings={settings} />;
}

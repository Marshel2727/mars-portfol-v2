import HomeContent from "@/components/public/HomeContent";
import PublicDataProvider from "@/components/public/PublicDataProvider";
import { getPublicFallback } from "@/lib/serverPublicData";

export default async function Page() {
  const fallback = await getPublicFallback(['/projects/', '/about/', '/site-content/']);
  return <PublicDataProvider fallback={fallback}><HomeContent /></PublicDataProvider>;
}

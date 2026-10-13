import EditorialSkills from "@/components/public/EditorialSkills";
import PublicDataProvider from "@/components/public/PublicDataProvider";
import { getPublicFallback } from "@/lib/serverPublicData";

export default async function Page() {
  const fallback = await getPublicFallback(['/skills/', '/about/', '/site-content/']);
  return <PublicDataProvider fallback={fallback}><EditorialSkills /></PublicDataProvider>;
}

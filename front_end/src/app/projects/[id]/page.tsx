import EditorialProjectDetail from "@/components/publick/EditorialProjectDetail";
import { EditorialPage } from "@/components/publick/EditorialUI";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <EditorialPage>
      <EditorialProjectDetail projectId={Number(id)} />
    </EditorialPage>
  );
}

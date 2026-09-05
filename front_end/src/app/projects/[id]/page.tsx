import EditorialProjectDetail from "@/components/publick/EditorialProjectDetail";
import { EditorialPage } from "@/components/publick/EditorialUI";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerProject } from "@/lib/serverProjects";
import { publicImageUrl, siteUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getServerProject(Number(id));
  if (!project) return { title: "Detail proyek | Marshel", robots: { index: false, follow: true } };
  const title = `${project.title} | Marshel`;
  const description = (project.sub_title || project.description).replace(/\s+/g, " ").slice(0, 160);
  const url = `${siteUrl}/projects/${project.id}`;
  const images = [publicImageUrl(project.image_url)];
  return { title, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", images },
    twitter: { card: "summary_large_image", title, description, images } };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getServerProject(Number(id));
  if (project === null) notFound();
  return (
    <EditorialPage>
      <EditorialProjectDetail projectId={Number(id)} initialProject={project} />
    </EditorialPage>
  );
}

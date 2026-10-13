"use client";

import useSWR from "swr";

import EditorialHome from "@/components/public/EditorialHome";
import { EditorialPage } from "@/components/public/EditorialUI";
import { getAboutProfile } from "@/services/about";
import { getAllProjects } from "@/services/project";

export default function HomeContent() {
  const projectsRequest = useSWR("/projects/", getAllProjects);
  const aboutRequest = useSWR("/about/", getAboutProfile);

  return (
    <EditorialPage>
      <EditorialHome
        profile={aboutRequest.data}
        projects={Array.isArray(projectsRequest.data) ? projectsRequest.data : []}
        projectsLoading={projectsRequest.isLoading && !projectsRequest.data}
        projectsError={Boolean(projectsRequest.error) && !projectsRequest.data}
      />
    </EditorialPage>
  );
}

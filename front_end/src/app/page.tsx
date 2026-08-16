"use client";

import useSWR from "swr";

import EditorialHome from "@/components/publick/EditorialHome";
import { EditorialPage } from "@/components/publick/EditorialUI";
import { getAboutProfile } from "@/services/about";
import { getAllProjects } from "@/services/project";

export default function Home() {
  const projectsRequest = useSWR("/projects/", getAllProjects);
  const aboutRequest = useSWR("/about/", getAboutProfile);

  return (
    <EditorialPage>
      <EditorialHome
        profile={aboutRequest.data}
        projects={Array.isArray(projectsRequest.data) ? projectsRequest.data : []}
        projectsLoading={projectsRequest.isLoading}
        projectsError={Boolean(projectsRequest.error)}
      />
    </EditorialPage>
  );
}

"use client";

import useSWR from "swr";

import EditorialProjects from "@/components/publick/EditorialProjects";
import { EditorialPage } from "@/components/publick/EditorialUI";
import { getAllProjects } from "@/services/project";

export default function ProjectsPage() {
  const projectsRequest = useSWR("/projects/", getAllProjects);

  return (
    <EditorialPage>
      <EditorialProjects
        projects={Array.isArray(projectsRequest.data) ? projectsRequest.data : []}
        projectsLoading={projectsRequest.isLoading}
        projectsError={Boolean(projectsRequest.error)}
      />
    </EditorialPage>
  );
}

"use client";

import useSWR from "swr";

import EditorialProjects from "@/components/public/EditorialProjects";
import { EditorialPage } from "@/components/public/EditorialUI";
import { getAllProjects } from "@/services/project";

export default function ProjectsContent() {
  const projectsRequest = useSWR("/projects/", getAllProjects);

  return (
    <EditorialPage>
      <EditorialProjects
        projects={Array.isArray(projectsRequest.data) ? projectsRequest.data : []}
        projectsLoading={projectsRequest.isLoading && !projectsRequest.data}
        projectsError={Boolean(projectsRequest.error) && !projectsRequest.data}
      />
    </EditorialPage>
  );
}

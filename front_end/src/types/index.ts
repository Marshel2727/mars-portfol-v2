export interface Skill {
    id: number;
    name: string;
    level: string;
    icon_url: string;
    category: string;
    detail?: string;
    proficiency?: number;
    years_experience?: string;
    display_order?: number;
    projects?: ProjectReference[];
    created_at?: string;
    updated_at?: string;
}

export interface SkillReference {
  id: number;
  name: string;
  level: string;
  category: string;
  icon_url: string;
}

export interface ProjectReference {
  id: number;
  title: string;
  category: string;
  tech_tags: string[];
  image_url: string;
}

export interface ProjectImage {
  id: number;
  project_id: number;
  image_url: string;
  caption?: string;
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  sub_title?: string;
  description: string;
  image_url: string;
  demo_url?: string;
  github_url?: string;
  category: string;
  tech_tags: string[];
  architecture_steps?: ArchitectureStep[];
  skills?: SkillReference[];
  created_at?: string;
  // Tambahkan baris ini untuk menampung data galeri dari backend
  gallery?: ProjectImage[]; 
}

export interface Message {
    id:  number;
    name: string;
    email: string;
    content: string;
    is_read: boolean;
    created_at?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at?: string;
    updated_at?: string;
}

export interface ArchitectureStep {
  label: string;
  title: string;
  description: string;
}

export interface AboutProfile {
  id: number;
  full_name: string;
  headline: string;
  bio: string;
  education?: string;
  location?: string;
  current_focus?: string;
  cv_url?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

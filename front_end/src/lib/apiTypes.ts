// [BARU] ✅ DRY: Generic API response interface untuk menggantikan
// interface duplikat di setiap file service (SkillResponseSingle,
// SkillResponseArray, ProjectResponseSingle, dst.)

export interface ApiResponseSingle<T> {
  status: string;
  data: T;
  message?: string;
}

export interface ApiResponseArray<T> {
  status: string;
  data: T[];
  message?: string;
}

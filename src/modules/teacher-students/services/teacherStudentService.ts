import api from "@/lib/api";
import type {
  TeacherStudentInvitationResponse,
  TeacherStudentListResponse,
  TeacherStudentMutationResponse,
  TeacherStudentSearchResponse,
  TeacherStudentRelationship,
  TeacherStudentStatus,
  TeacherStudentUser,
} from "../types/teacherStudent.types";

export async function searchStudentByEmail(email: string): Promise<TeacherStudentUser> {
  const response = await api.get<TeacherStudentSearchResponse>("/teacher-students/students/search", {
    params: { email },
  });
  return response.data.data;
}

export async function inviteStudent(email: string): Promise<TeacherStudentInvitationResponse["data"]> {
  const response = await api.post<TeacherStudentInvitationResponse>("/teacher-students/invitations", { email });
  return response.data.data;
}

export async function listTeacherRelationships(status?: TeacherStudentStatus): Promise<TeacherStudentRelationship[]> {
  const response = await api.get<TeacherStudentListResponse>("/teacher-students/teacher/relationships", {
    params: status ? { status } : undefined,
  });
  return response.data.data;
}

export async function listStudentRelationships(): Promise<TeacherStudentRelationship[]> {
  const response = await api.get<TeacherStudentListResponse>("/teacher-students/student/relationships");
  return response.data.data;
}

export async function respondToInvitation(relationshipId: string, accept: boolean): Promise<void> {
  await api.patch<TeacherStudentMutationResponse>(
    `/teacher-students/student/relationships/${relationshipId}/respond`,
    { accept },
  );
}

export async function cancelInvitation(relationshipId: string, actor: "teacher" | "student"): Promise<void> {
  const path = actor === "teacher"
    ? `/teacher-students/teacher/invitations/${relationshipId}/cancel`
    : `/teacher-students/student/invitations/${relationshipId}/cancel`;
  await api.patch<TeacherStudentMutationResponse>(path);
}

export async function endTeacherStudentRelationship(relationshipId: string): Promise<void> {
  await api.patch<TeacherStudentMutationResponse>(
    `/teacher-students/teacher/relationships/${relationshipId}/end`,
  );
}

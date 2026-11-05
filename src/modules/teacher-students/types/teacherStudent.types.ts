export type TeacherStudentStatus = "PENDING" | "ACTIVE" | "REJECTED" | "CANCELLED";

export interface TeacherStudentUser {
  id: string;
  name: string;
  email: string;
}

export interface TeacherStudentRelationship {
  id: string;
  status: TeacherStudentStatus;
  invitedAt: string;
  respondedAt: string | null;
  endedAt: string | null;
  teacher: TeacherStudentUser;
  student: TeacherStudentUser;
}

export interface TeacherStudentInvitationResponse {
  success: true;
  data: {
    id: string;
    status: TeacherStudentStatus;
    invitedAt: string;
    student: TeacherStudentUser;
  };
}

export interface TeacherStudentListResponse {
  success: true;
  data: TeacherStudentRelationship[];
}

export interface TeacherStudentSearchResponse {
  success: true;
  data: TeacherStudentUser;
}

export interface TeacherStudentMutationResponse {
  success: true;
  data: {
    id: string;
    status: TeacherStudentStatus;
  };
}

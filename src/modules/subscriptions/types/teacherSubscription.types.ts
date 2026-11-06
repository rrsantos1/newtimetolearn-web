export type TeacherSubscriptionStatus =
  | "FREE"
  | "PENDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED";

export interface TeacherEntitlements {
  planCode: string;
  planName: string;
  storageLimitBytes: number;
  studentLimit: number | null;
  removesAds: boolean;
  subscriptionStatus: TeacherSubscriptionStatus;
  paymentIntegrationEnabled: boolean;
  reservedStudents: number;
  studentsRemaining: number | null;
}

export interface TeacherEntitlementsResponse {
  success: true;
  data: TeacherEntitlements;
  requestId: string;
}

export interface TeacherSubscriptionCheckoutResponse {
  success: true;
  data: {
    checkoutUrl: string;
    subscriptionId: string;
  };
  requestId: string;
}

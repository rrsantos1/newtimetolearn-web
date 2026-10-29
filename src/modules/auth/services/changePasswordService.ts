import api from "@/lib/api";

interface ChangePasswordResponse {
  success: true;
  data: {
    message: string;
  };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const changePasswordService = {
  async execute(input: ChangePasswordInput): Promise<string> {
    const response = await api.post<ChangePasswordResponse>(
      "/auth/change-password",
      {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      },
    );

    return response.data.data.message;
  },
};
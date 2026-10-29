import api from "@/lib/api";

interface ApiMessageResponse {
  success: true;
  data: {
    message: string;
  };
}

interface RequestEmailChangeInput {
  newEmail: string;
  currentPassword: string;
}

interface ConfirmEmailChangeInput {
  token: string;
}

export const emailChangeService = {
  async requestEmailChange(
    input: RequestEmailChangeInput,
  ): Promise<string> {
    const response = await api.post<ApiMessageResponse>(
      "/auth/request-email-change",
      {
        newEmail: input.newEmail.trim().toLowerCase(),
        currentPassword: input.currentPassword,
      },
    );

    return response.data.data.message;
  },

  async confirmEmailChange(
    input: ConfirmEmailChangeInput,
  ): Promise<string> {
    const response = await api.post<ApiMessageResponse>(
      "/auth/confirm-email-change",
      {
        token: input.token,
      },
    );

    return response.data.data.message;
  },
};
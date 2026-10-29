import api from "@/lib/api";
import type {
  UpdateUserProfileResponse,
  UserProfileResponse,
} from "@/modules/auth/types/auth.types";
import type { UpdateUserProfileFormValues } from "@/modules/users/schemas/updateUserProfileSchema";

export const userProfileService = {
  async getProfile(): Promise<UserProfileResponse["data"]> {
    const response = await api.get<UserProfileResponse>("/users/me");

    return response.data.data;
  },

  async updateProfile(
    values: UpdateUserProfileFormValues,
  ): Promise<UpdateUserProfileResponse["data"]> {
    const response = await api.patch<UpdateUserProfileResponse>(
      "/users/me",
      {
        name: values.name.trim(),
      },
    );

    return response.data.data;
  },
};
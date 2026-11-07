import { describe, expect, it } from "vitest";
import { updateUserProfileSchema } from "@/modules/users/schemas/updateUserProfileSchema";

describe("updateUserProfileSchema", () => {
  it("accepts a valid name and trims surrounding spaces", async () => {
    await expect(
      updateUserProfileSchema.validate({ name: "  Ana Silva  " }),
    ).resolves.toEqual({ name: "Ana Silva" });
  });

  it("requires a name", async () => {
    await expect(
      updateUserProfileSchema.validate({ name: " " }),
    ).rejects.toThrow("Informe seu nome.");
  });

  it("rejects names shorter than two characters", async () => {
    await expect(
      updateUserProfileSchema.validate({ name: "A" }),
    ).rejects.toThrow("pelo menos 2 caracteres.");
  });

  it("rejects names longer than 120 characters", async () => {
    await expect(
      updateUserProfileSchema.validate({ name: "A".repeat(121) }),
    ).rejects.toThrow("no máximo 120 caracteres.");
  });
});

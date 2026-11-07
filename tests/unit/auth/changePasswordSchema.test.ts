import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "@/modules/auth/schemas/changePasswordSchema";

const validValues = {
  currentPassword: "senha-atual-123",
  newPassword: "senha-nova-456",
  confirmPassword: "senha-nova-456",
};

describe("changePasswordSchema", () => {
  it("accepts a valid password change", async () => {
    await expect(changePasswordSchema.validate(validValues)).resolves.toMatchObject(validValues);
  });

  it("requires the current password", async () => {
    await expect(
      changePasswordSchema.validate({ ...validValues, currentPassword: "" }),
    ).rejects.toThrow("Informe sua senha atual.");
  });

  it("rejects a new password shorter than eight characters", async () => {
    await expect(
      changePasswordSchema.validate({
        ...validValues,
        newPassword: "1234567",
        confirmPassword: "1234567",
      }),
    ).rejects.toThrow("pelo menos 8 caracteres.");
  });

  it("rejects reusing the current password", async () => {
    await expect(
      changePasswordSchema.validate({
        ...validValues,
        newPassword: validValues.currentPassword,
        confirmPassword: validValues.currentPassword,
      }),
    ).rejects.toThrow("diferente da senha atual.");
  });

  it("rejects a confirmation that does not match", async () => {
    await expect(
      changePasswordSchema.validate({
        ...validValues,
        confirmPassword: "outra-senha-789",
      }),
    ).rejects.toThrow("As senhas não coincidem.");
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../../../src/modules/auth/schemas/registerSchema.ts";

test("accepts a valid student registration", async () => {
  const values = await registerSchema.validate({
    name: "  Ana Silva  ",
    email: "ana@example.com",
    password: "senha-segura-123",
    role: "STUDENT",
  });

  assert.equal(values.name, "Ana Silva");
});

test("accepts a valid teacher registration", async () => {
  await assert.doesNotReject(
    registerSchema.validate({
      name: "Professor",
      email: "professor@example.com",
      password: "senha-segura-123",
      role: "TEACHER",
    }),
  );
});

test("rejects an invalid email", async () => {
  await assert.rejects(
    registerSchema.validate({
      name: "Ana Silva",
      email: "email-invalido",
      password: "senha-segura-123",
      role: "STUDENT",
    }),
    /Informe um e-mail válido/,
  );
});

test("rejects passwords shorter than eight characters", async () => {
  await assert.rejects(
    registerSchema.validate({
      name: "Ana Silva",
      email: "ana@example.com",
      password: "1234567",
      role: "STUDENT",
    }),
    /pelo menos 8 caracteres/,
  );
});

test("rejects unsupported registration roles", async () => {
  await assert.rejects(
    registerSchema.validate({
      name: "Ana Silva",
      email: "ana@example.com",
      password: "senha-segura-123",
      role: "ADMIN",
    }),
    /Selecione um perfil/,
  );
});

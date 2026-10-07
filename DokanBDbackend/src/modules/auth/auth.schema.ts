import { z } from "zod";

const bangladeshPhoneSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Use an 11-digit Bangladesh mobile number.");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: bangladeshPhoneSchema,
  email: z.string().trim().email().toLowerCase().optional(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1).max(72),
});

export const verifyEmailSchema = z.object({
  token: z.string().length(64),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const forgotPasswordSchema = resendVerificationSchema;

export const resetPasswordSchema = z.object({
  token: z.string().length(64),
  password: z.string().min(8).max(72),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().length(64).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;


/*Rules:

Phone format: 01XXXXXXXXX.
Email is optional during registration; omit it when not provided.
Password must contain 8–72 characters.
identifier accepts either phone or email during login.*/

import { z } from "zod";

const bangladeshPhoneSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Use an 11-digit Bangladesh mobile number.");

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: bangladeshPhoneSchema.optional(),
  })
  .refine((input) => input.name !== undefined || input.phone !== undefined, {
    message: "Provide at least one field to update.",
  });

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.enum(["CUSTOMER", "ADMIN", "OWNER"]).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export const adminUpdateUserSchema = z
  .object({
    roleCode: z.enum(["CUSTOMER", "ADMIN", "OWNER"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (input) => input.roleCode !== undefined || input.isActive !== undefined,
    { message: "Provide a role or active status." },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

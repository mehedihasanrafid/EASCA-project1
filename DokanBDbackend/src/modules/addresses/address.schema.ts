import { z } from "zod";

const bangladeshPhoneSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Use an 11-digit Bangladesh mobile number.");

const optionalText = (maximumLength: number) =>
  z.string().trim().min(1).max(maximumLength).nullable().optional();

const addressFields = {
  label: optionalText(50),
  recipientName: z.string().trim().min(2).max(100),
  phone: bangladeshPhoneSchema,
  addressLine1: z.string().trim().min(3).max(255),
  addressLine2: optionalText(255),
  area: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  division: z.string().trim().min(2).max(100),
  postalCode: optionalText(20),
  country: z.string().trim().min(2).max(100).default("Bangladesh"),
  isInsideDhaka: z.boolean(),
};

export const addressIdParamsSchema = z.object({
  addressId: z.string().regex(/^[1-9]\d*$/, "Address ID must be a positive integer."),
});

export const createAddressSchema = z.object({
  ...addressFields,
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = z
  .object(addressFields)
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one address field to update.",
  });

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

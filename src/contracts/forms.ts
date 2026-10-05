import { z } from "zod";
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const nullable = (max: number) => text(0, max).nullable().optional();
const price = z.union([
  z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((v) => /[1-9]/.test(v), "Must be positive"),
  z.number().positive(),
]);
const provider = {
  businessName: text(2, 150),
  city: text(2, 100),
  address: text(5, 500),
  bio: nullable(2000),
};
const identity = {
  name: text(2, 100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  phone: text(5, 30),
};
export const login = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});
export const register = z.discriminatedUnion("role", [
  z.object({ ...identity, role: z.literal("CUSTOMER") }),
  z.object({
    ...identity,
    ...provider,
    bio: text(0, 2000).optional(),
    role: z.literal("PROVIDER"),
  }),
]);
export const user = z
  .object({ name: identity.name, phone: identity.phone })
  .strict();
export const providerProfile = z
  .object({ ...provider, phone: identity.phone })
  .strict();
export const service = z
  .object({
    categoryId: z.string().trim().min(1),
    title: text(2, 150),
    price,
    duration: z.coerce.number().int().min(1).max(1440),
    description: nullable(5000),
    imageUrl: nullable(2048),
    serviceArea: nullable(250),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .strict();
export const category = z
  .object({
    name: text(2, 100),
    slug: text(2, 160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: nullable(1000),
  })
  .strict();
export const slot = z
  .object({
    serviceId: z.string().trim().min(1),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine((v) => Date.parse(v.startTime) > Date.now(), {
    path: ["startTime"],
    message: "Choose a future time.",
  })
  .refine((v) => Date.parse(v.endTime) > Date.parse(v.startTime), {
    path: ["endTime"],
    message: "End must be after start.",
  });
export const booking = z
  .object({
    serviceId: z.string().trim().min(1),
    slotId: z.string().trim().min(1),
    notes: text(0, 2000).optional(),
  })
  .strict();
export const review = z
  .object({
    bookingId: z.string().trim().min(1),
    rating: z.number().int().min(1).max(5),
    comment: text(0, 2000).optional(),
  })
  .strict();
export const reviewEdit = z
  .object({ rating: z.number().int().min(1).max(5), comment: nullable(2000) })
  .strict();
export type Register = z.infer<typeof register>;
export type Login = z.infer<typeof login>;
export type TokenBody = { refreshToken: string };
export type PatchUser = Partial<z.infer<typeof user>>;
export type PatchProvider = Partial<z.infer<typeof providerProfile>>;
export type CreateService = z.infer<typeof service>;
export type PatchService = Partial<CreateService>;
export type CreateCategory = z.infer<typeof category>;
export type PatchCategory = Partial<CreateCategory>;
export type CreateSlot = z.infer<typeof slot>;
export type PatchSlot = Partial<CreateSlot>;
export type CreateBooking = z.infer<typeof booking>;
export type CreateReview = z.infer<typeof review>;
export type PatchReview = Partial<z.infer<typeof reviewEdit>>;
export type UserStatusBody = { status: "ACTIVE" | "SUSPENDED" | "BLOCKED" };
export type ProviderStatusBody = {
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export const servicePatch = service
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Change at least one field.",
  });

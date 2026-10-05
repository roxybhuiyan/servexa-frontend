import { z } from "zod";
const optionalText = (max?: number) => {
  const s = z.string().trim().min(1);
  return (max ? s.max(max) : s).optional();
};
const pagination = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};
const sorted = { ...pagination, sortOrder: z.enum(["asc", "desc"]).optional() };
const search = optionalText(100),
  id = optionalText();
const dates = {
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
};
const price = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .refine((v) => /[1-9]/.test(v), "Price must be positive")
  .optional();
const bookings = z.object({
  ...sorted,
  status: z
    .enum([
      "PENDING",
      "ACCEPTED",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "REJECTED",
    ])
    .optional(),
  serviceId: id,
});
const reviews = {
  ...sorted,
  rating: z.coerce.number().int().min(1).max(5).optional(),
};
const metric = {
  ...dates,
  providerId: optionalText(100),
  serviceId: optionalText(100),
};
export const querySchemas: Record<
  string,
  z.ZodType<Record<string, unknown>>
> = {
  E12: z.object({
    ...sorted,
    search,
    category: optionalText(200),
    provider: optionalText(200),
    city: optionalText(100),
    minPrice: price,
    maxPrice: price,
    sortBy: z.enum(["createdAt", "price", "title"]).optional(),
  }),
  E14: z.object({
    ...sorted,
    search,
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    sortBy: z.enum(["createdAt", "price", "title"]).optional(),
  }),
  E18: z.object({ ...pagination, ...dates }),
  E19: z.object({
    ...sorted,
    ...dates,
    serviceId: id,
    isBooked: z.enum(["true", "false"]).optional(),
  }),
  E24: bookings,
  E27: bookings,
  E37: z.object(reviews),
  E40: z.object(reviews),
  E42: z.object(reviews),
  E45: z.object(metric),
  E46: z.object({ ...metric, customerId: optionalText(100) }),
  E49: z.object({ limit: pagination.limit }),
  E50: z.object({
    ...sorted,
    ...dates,
    action: optionalText(100),
    entityType: optionalText(100),
    entityId: optionalText(100),
    userId: optionalText(100),
  }),
  E52: z.object({
    ...sorted,
    search,
    role: z.enum(["CUSTOMER", "PROVIDER", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED", "BLOCKED"]).optional(),
    sortBy: z.enum(["createdAt", "name", "email"]).optional(),
  }),
  E56: z.object({
    ...sorted,
    search,
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    sortBy: z.enum(["createdAt", "businessName", "city", "rating"]).optional(),
  }),
  E58: z.object({ ...pagination, search }),
  E62: z.object({
    ...reviews,
    search,
    customerId: id,
    providerId: id,
    serviceId: id,
  }),
};
export function parseQuery(
  endpoint: string,
  input: Record<string, unknown> = {},
) {
  const clean = Object.fromEntries(
    Object.entries(input).filter(
      ([, v]) => v !== "" && v !== undefined && v !== null,
    ),
  );
  const result = (querySchemas[endpoint] || z.object({})).safeParse(clean);
  if (!result.success)
    throw new Error(
      result.error.issues
        .map((v) => `${v.path.join(".")}: ${v.message}`)
        .join("; "),
    );
  const v = result.data;
  if (v.from && v.to && Date.parse(String(v.from)) > Date.parse(String(v.to)))
    throw new Error("From must be before or equal to To.");
  if (v.minPrice && v.maxPrice && Number(v.minPrice) > Number(v.maxPrice))
    throw new Error("Minimum price cannot exceed maximum price.");
  return v;
}

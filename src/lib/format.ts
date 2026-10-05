import type { BookingStatus, PaymentStatus } from "../api/types";
export const label = (v: string) =>
  v
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (x) => x.toUpperCase());
export const money = (
  v: string,
  currency = import.meta.env.VITE_DISPLAY_CURRENCY || "",
) =>
  `${v
    .split(".")
    .map((part, i) =>
      i === 0 ? part.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : part,
    )
    .join(".")}${currency ? " " + currency.toUpperCase() : ""}`;
export const date = (v: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
export const localDate = (v: string) => {
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export const canCancel = (status: BookingStatus, payment?: PaymentStatus) =>
  ["PENDING", "ACCEPTED", "CONFIRMED"].includes(status) && payment !== "PAID";
export const jobActions = (status: BookingStatus, payment?: PaymentStatus) =>
  status === "PENDING"
    ? payment === "PAID"
      ? ["accept"]
      : ["accept", "reject"]
    : status === "CONFIRMED"
      ? ["start"]
      : status === "IN_PROGRESS"
        ? ["complete"]
        : [];

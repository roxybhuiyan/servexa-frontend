import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, Pagination, Confirm, Json } from "../src/components/ui";
import * as schemas from "../src/contracts/forms";
import { canCancel, jobActions } from "../src/lib/format";
import { safeReturn } from "../src/app/session";
import { checkoutContext } from "../src/features/payments";
describe("forms and workflow", () => {
  it("submits review rating as a number and optional comment correctly", async () => {
    const submit = vi.fn();
    render(
      <Form
        schema={schemas.review}
        initial={{ bookingId: "b1" }}
        fields={[
          { name: "bookingId", hidden: true },
          { name: "rating", type: "number", required: true },
          { name: "comment", type: "textarea" },
        ]}
        onSubmit={submit}
      />,
    );
    await userEvent.type(screen.getByLabelText("Rating *"), "4");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({ bookingId: "b1", rating: 4 }),
    );
  });
  it("rejects fractional review ratings without mutation", async () => {
    const submit = vi.fn();
    render(
      <Form
        schema={schemas.review}
        initial={{ bookingId: "b1", rating: 2.5 }}
        fields={[
          { name: "bookingId", hidden: true },
          { name: "rating", type: "number", required: true },
        ]}
        onSubmit={submit}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByLabelText("Rating *")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(submit).not.toHaveBeenCalled();
  });
  it("preserves form input on server failure", async () => {
    render(
      <Form
        schema={schemas.user}
        initial={{ name: "Alice", phone: "123456" }}
        fields={[{ name: "name" }, { name: "phone" }]}
        onSubmit={async () => {
          throw new Error("Server unavailable");
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server unavailable",
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Alice");
  });
  it("uses authoritative pagination metadata", async () => {
    const page = vi.fn();
    render(
      <Pagination
        meta={{ page: 2, limit: 10, total: 11, totalPages: 2 }}
        onPage={page}
      />,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(page).toHaveBeenCalledWith(1);
  });
  it("requires confirmation before destructive admin action", async () => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    const action = vi.fn();
    render(
      <Confirm title="Delete user" onConfirm={action}>
        <p>Remove access.</p>
      </Confirm>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete user" }));
    expect(action).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(action).toHaveBeenCalledOnce();
  });
  it("renders audit JSON as text", () => {
    render(<Json value={{ html: "<img src=x onerror=alert(1)>" }} />);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(/onerror/)).toBeInTheDocument();
  });
  it("enforces booking transitions and paid cancellation guard", () => {
    expect(canCancel("ACCEPTED", "UNPAID")).toBe(true);
    expect(canCancel("CONFIRMED", "PAID")).toBe(false);
    expect(jobActions("PENDING")).toEqual(["accept", "reject"]);
    expect(jobActions("ACCEPTED")).toEqual([]);
    expect(jobActions("CONFIRMED")).toEqual(["start"]);
    expect(jobActions("IN_PROGRESS")).toEqual(["complete"]);
    expect(jobActions("COMPLETED")).toEqual([]);
  });
  it("does not infer payment context from a success URL", () => {
    expect(checkoutContext()).toBeNull();
    sessionStorage.setItem(
      "servexa.checkout",
      JSON.stringify({ bookingId: "b", userId: "u", attemptedAt: 1 }),
    );
    expect(checkoutContext()?.bookingId).toBe("b");
  });
  it("rejects unsafe login return targets", () => {
    expect(safeReturn("https://evil.test")).toBeNull();
    expect(safeReturn("//evil.test")).toBeNull();
    expect(safeReturn("/\\evil.test")).toBeNull();
    expect(safeReturn("/customer/bookings/b")).toBe("/customer/bookings/b");
  });
  it("uses customer/provider-only registration and strict mutation fields", () => {
    expect(schemas.register.safeParse({ role: "ADMIN" }).success).toBe(false);
    expect(schemas.booking.safeParse({ serviceId: "s" }).success).toBe(true);
    expect(
      schemas.booking.safeParse({ serviceId: "s", slotId: "old" }).success,
    ).toBe(false);
    expect(
      schemas.booking.safeParse({ serviceId: "s", slotId: "t", totalAmount: 1 })
        .success,
    ).toBe(false);
    expect(
      schemas.review.safeParse({ bookingId: "b", rating: "5" }).success,
    ).toBe(false);
  });
});

import { parseQuery } from "../src/contracts/queries";
it("validates pagination, strips unsupported filters, and rejects reversed ranges", () => {
  expect(
    parseQuery("E45", {
      page: 1,
      customerId: "not-supported",
      providerId: "p",
    }),
  ).toEqual({ providerId: "p" });
  expect(() => parseQuery("E12", { limit: 101 })).toThrow();
  expect(() => parseQuery("E12", { minPrice: "20", maxPrice: "10" })).toThrow(
    "Minimum price",
  );
  expect(() => parseQuery("E19", { isBooked: "yes" })).toThrow();
  expect(() =>
    parseQuery("E18", {
      from: "2027-01-02T00:00:00Z",
      to: "2027-01-01T00:00:00Z",
    }),
  ).toThrow("From must");
});

it("service editing sends only changed fields", async () => {
  const submit = vi.fn();
  render(
    <Form
      patch
      schema={schemas.servicePatch}
      initial={{ title: "Existing service", categoryId: "retired-category" }}
      fields={[
        { name: "title", required: true },
        { name: "categoryId", options: [] },
      ]}
      onSubmit={submit}
    />,
  );
  await userEvent.clear(screen.getByLabelText("Title *"));
  await userEvent.type(screen.getByLabelText("Title *"), "Updated service");
  await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith({ title: "Updated service" }),
  );
});

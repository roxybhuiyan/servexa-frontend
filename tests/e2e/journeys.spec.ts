import { test, expect, type Page } from "@playwright/test";
// Deterministic test-only fixtures. No fixture is bundled into the application.
const now = "2026-10-05T12:00:00.000Z";
const category = {
  id: "cat1",
  name: "Home care",
  slug: "home-care",
  description: null,
  createdAt: now,
  updatedAt: now,
};
const service = {
  id: "svc1",
  title: "Home cleaning",
  slug: "home-cleaning",
  description: "Care for your living space.",
  price: "120.00",
  duration: 60,
  imageUrl: null,
  serviceArea: "Dhaka",
  createdAt: now,
  category,
  provider: {
    id: "prov1",
    businessName: "Care Studio",
    city: "Dhaka",
    rating: "0",
    totalReviews: 0,
    user: { id: "provider-user", name: "Pat" },
  },
};
const slot = {
  id: "slot1",
  serviceId: "svc1",
  startTime: "2027-10-10T10:00:00Z",
  endTime: "2027-10-10T11:00:00Z",
  createdAt: now,
  isBooked: false,
};
const profile = {
  id: "prov1",
  businessName: "Care Studio",
  bio: null,
  phone: "12345678",
  city: "Dhaka",
  address: "Central Dhaka",
  status: "APPROVED",
  rating: "0",
  totalReviews: 0,
  createdAt: now,
  updatedAt: now,
};
const baseBooking = {
  id: "book1",
  status: "PENDING",
  servicePrice: "120.00",
  platformFee: "12.00",
  totalAmount: "132.00",
  notes: null,
  createdAt: now,
  updatedAt: now,
  cancelledAt: null,
  completedAt: null,
  service,
  provider: { ...profile },
  payment: null,
  customer: { id: "u1", name: "Casey", phone: "12345678" },
};
function pageData(data: unknown[]) {
  return {
    meta: {
      page: 1,
      limit: 10,
      total: data.length,
      totalPages: data.length ? 1 : 0,
    },
    data,
  };
}
async function setup(
  page: Page,
  role = "CUSTOMER",
  options: { bookingStatus?: string; approval?: string } = {},
) {
  const calls: {
    path: string;
    method: string;
    body: Record<string, unknown> | null;
  }[] = [];
  let booking = { ...baseBooking, status: options.bookingStatus || "PENDING" };
  let approval = options.approval || "APPROVED";
  let paid = false;
  let published = false;
  const user = {
    id: "u1",
    name: "Casey",
    email: "casey@example.test",
    phone: "12345678",
    role,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    providerProfile:
      role === "PROVIDER" ? { ...profile, status: approval } : null,
  };
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname.replace("/api/v1", ""),
      method = req.method();
    const body = req.postDataJSON();
    calls.push({ path, method, body });
    let data: unknown = null;
    if (path === "/auth/login")
      data = { accessToken: "test-access", refreshToken: "test-refresh" };
    else if (path === "/auth/logout") data = null;
    else if (path === "/auth/register") data = user;
    else if (path === "/auth/me" || path === "/users/me") data = user;
    else if (path === "/categories") data = [category];
    else if (path === "/services") data = pageData([service]);
    else if (path === "/services/svc1") data = service;
    else if (path === "/services/svc1/availability") data = pageData([slot]);
    else if (path.endsWith("/rating-summary"))
      data = { averageRating: 0, reviewCount: 0 };
    else if (path === "/reviews/me" || path.endsWith("/reviews"))
      data = pageData([]);
    else if (path === "/bookings" && method === "POST") data = booking;
    else if (path === "/bookings/me" || path === "/providers/me/bookings")
      data = pageData([booking]);
    else if (
      path === "/bookings/book1" ||
      path === "/providers/me/bookings/book1"
    )
      data = booking;
    else if (path === "/providers/me/bookings/book1/accept") {
      booking = { ...booking, status: "ACCEPTED" };
      data = booking;
    } else if (path === "/providers/me/bookings/book1/reject") {
      booking = { ...booking, status: "REJECTED" };
      data = booking;
    } else if (path === "/providers/me")
      data = { ...profile, status: approval, user };
    else if (path === "/providers/me/services")
      data =
        method === "GET"
          ? pageData([
              {
                ...service,
                categoryId: "cat1",
                status: "ACTIVE",
                updatedAt: now,
              },
            ])
          : { ...service, ...body };
    else if (path === "/providers/me/availability") {
      if (method === "POST") published = true;
      data =
        method === "GET"
          ? pageData(
              published
                ? [
                    {
                      ...slot,
                      service: { id: service.id, title: service.title },
                      isBooked: false,
                    },
                  ]
                : [],
            )
          : { ...slot, ...body };
    } else if (path === "/payments/initiate/book1")
      data = {
        paymentUrl: "https://checkout.stripe.com/c/pay/test",
        sessionId: "test-session",
      };
    else if (path === "/payments/booking/book1")
      data = {
        bookingId: "book1",
        bookingStatus: paid ? "CONFIRMED" : booking.status,
        currency: "usd",
        payment: paid
          ? {
              id: "pay1",
              status: "PAID",
              amount: "132.00",
              provider: "STRIPE",
              transactionId: "test-session",
              createdAt: now,
              paidAt: now,
            }
          : { status: "UNPAID" },
      };
    else if (path === "/admin/providers")
      data = pageData([{ ...profile, status: approval, user }]);
    else if (path === "/admin/providers/prov1/status") {
      approval = String(body.status);
      data = { ...profile, status: approval, user };
    } else if (path === "/admin/users")
      data = pageData([{ ...user, id: "u2", name: "Another user" }]);
    else if (path === "/admin/users/u2/status")
      data = { ...user, id: "u2", status: body.status };
    else if (path === "/admin/dashboard/recent-activity") data = [];
    else if (path.startsWith("/admin/dashboard/")) data = { totalBookings: 0 };
    else {
      await route.fulfill({
        status: 404,
        json: {
          success: false,
          message: `Unexpected test endpoint ${method} ${path}`,
          errors: [],
        },
      });
      return;
    }
    await route.fulfill({ json: { success: true, message: "OK", data } });
  });
  return {
    calls,
    setPaid() {
      paid = true;
      booking = { ...booking, status: "CONFIRMED" };
    },
  };
}
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email *", { exact: true }).fill("casey@example.test");
  await page.getByLabel("Password *", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/(customer|provider|admin)$/);
}
test("customer registration, login, catalog and booking request", async ({
  page,
}) => {
  const { calls } = await setup(page);
  await page.goto("/register");
  await page.getByLabel("Name *", { exact: true }).fill("Casey");
  await page.getByLabel("Email *", { exact: true }).fill("casey@example.test");
  await page.getByLabel("Password *", { exact: true }).fill("test-password");
  await page.getByLabel("Phone *", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/login/);
  await login(page);
  await page.getByRole("link", { name: "Find a service" }).click();
  await page.getByRole("link", { name: "Home cleaning", exact: true }).click();
  await page.getByRole("link", { name: "Order Now" }).click();
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await expect(page).toHaveURL(/customer\/bookings\/book1/);
  expect(
    calls.find((c) => c.path === "/bookings" && c.method === "POST")?.body,
  ).toEqual({ serviceId: "svc1" });
  expect(calls.some((c) => c.path.includes("availability"))).toBe(false);
  await expect(page.getByRole("button", { name: /Pay Now/ })).toHaveCount(0);
});
test("provider publishes a service and accepts an order", async ({ page }) => {
  const { calls } = await setup(page, "PROVIDER");
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Services", exact: true }).click();
  await page.getByRole("link", { name: "Create service" }).click();
  await page.getByLabel("Category", { exact: true }).selectOption("cat1");
  await page.getByLabel("Title *", { exact: true }).fill("Home cleaning");
  await page.getByLabel("Price *", { exact: true }).fill("120.00");
  await page.getByLabel("Duration *", { exact: true }).fill("60");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Service created successfully")).toBeVisible();
  await expect(
    page.getByText(
      "Your service is published. Customers can now place orders.",
    ),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to Services", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Availability", exact: true }),
  ).toHaveCount(0);
  expect(calls.some((c) => c.path.includes("availability"))).toBe(false);
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Jobs", exact: true })
    .click();
  await page.getByRole("link", { name: "Home cleaning", exact: true }).click();
  await page.getByRole("button", { name: "Accept Order" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByText("ACCEPTED", { exact: false }).first(),
  ).toBeVisible();
  expect(calls.some((c) => c.path.endsWith("/accept"))).toBe(true);
});
test("admin approves provider and changes another user status", async ({
  page,
}) => {
  const { calls } = await setup(page, "ADMIN", { approval: "PENDING" });
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Operations overview" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Providers", exact: true }).click();
  await page.getByRole("button", { name: "Set approved" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator('[data-status="APPROVED"]')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Users", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Set suspended" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect
    .poll(() =>
      calls.some(
        (c) =>
          c.path === "/admin/users/u2/status" && c.body?.status === "SUSPENDED",
      ),
    )
    .toBe(true);
});
test("hosted Checkout remembers context and reconciles authoritative return", async ({
  page,
}) => {
  const state = await setup(page, "CUSTOMER", { bookingStatus: "ACCEPTED" });
  await page.route("https://checkout.stripe.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body>Test hosted checkout</body></html>",
    }),
  );
  await login(page);
  await page.getByRole("link", { name: "Home cleaning", exact: true }).click();
  await page.getByRole("button", { name: "Pay Now" }).click();
  await expect(page).toHaveURL(/checkout.stripe.com/);
  state.setPaid();
  await page.goto("/payments/success?session_id=untrusted-query");
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email *", { exact: true }).fill("casey@example.test");
  await page.getByLabel("Password *", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Payment received and booking confirmed."),
  ).toBeVisible();
  expect(
    state.calls.filter((c) => c.path === "/payments/initiate/book1"),
  ).toHaveLength(1);
  expect(state.calls.some((c) => c.path.includes("webhook"))).toBe(false);
});
test("wrong role and pending approval protect private API calls", async ({
  page,
}) => {
  const state = await setup(page, "PROVIDER", { approval: "PENDING" });
  await login(page);
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Jobs", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Provider approval required" }),
  ).toBeVisible();
  expect(state.calls.some((c) => c.path === "/providers/me/bookings")).toBe(
    false,
  );
  await page.evaluate(() => {
    history.pushState(null, "", "/admin");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(
    page.getByText("This space is not available to your account."),
  ).toBeVisible();
  expect(state.calls.some((c) => c.path.startsWith("/admin"))).toBe(false);
});
test("responsive public layout, empty and error states", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good service. Less searching." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.route("**/api/v1/services?**", (route) =>
    route.fulfill({
      json: { success: true, message: "OK", data: pageData([]) },
    }),
  );
  await page.goto("/services?search=missing");
  await expect(page.getByText("No services match your search.")).toBeVisible();
  await page.route("**/api/v1/services?**", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/services?search=error");
  await expect(page.getByRole("alert")).toBeVisible();
});

test("order conflict shows an error without retrying creation", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/v1/bookings", (route) =>
    route.fulfill({
      status: 404,
      json: {
        success: false,
        message: "Service is no longer active",
        errors: [],
      },
    }),
  );
  await login(page);
  await page.getByRole("link", { name: "Find a service" }).click();
  await page.getByRole("link", { name: "Home cleaning", exact: true }).click();
  await page.getByRole("link", { name: "Order Now" }).click();
  await page.getByRole("button", { name: "Place Order", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Service is no longer active",
  );
  await expect(
    page.getByRole("button", { name: "Place Order", exact: true }),
  ).toBeEnabled();
});
test("cancel return does not claim payment or booking cancellation", async ({
  page,
}) => {
  await setup(page, "CUSTOMER", { bookingStatus: "ACCEPTED" });
  await login(page);
  await page.evaluate(() => {
    sessionStorage.setItem(
      "servexa.checkout",
      JSON.stringify({
        bookingId: "book1",
        userId: "u1",
        attemptedAt: Date.now(),
      }),
    );
    history.pushState(null, "", "/payments/cancel");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(
    page.getByText(/does not cancel your payment or booking/),
  ).toBeVisible();
  await expect(page.getByText("Current payment state: UNPAID.")).toBeVisible();
  await expect(
    page.getByText("Payment received and booking confirmed."),
  ).toHaveCount(0);
});
test("in-memory logout clears private access and opt-in reload restores identity", async ({
  page,
}) => {
  const { calls } = await setup(page);
  await page.goto("/login");
  await page.getByLabel("Email *", { exact: true }).fill("casey@example.test");
  await page.getByLabel("Password *", { exact: true }).fill("test-password");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/customer$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your day, at a glance" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("servexa.session")),
  ).toBeNull();
  expect(calls.some((c) => c.path === "/auth/logout")).toBe(true);
});

test("completed booking maps existing review by booking ID before offering creation", async ({
  page,
}) => {
  await setup(page, "CUSTOMER", { bookingStatus: "COMPLETED" });
  await page.route("**/api/v1/reviews/me?**", (route) =>
    route.fulfill({
      json: {
        success: true,
        message: "OK",
        data: pageData([
          {
            id: "review1",
            bookingId: "book1",
            rating: 4,
            comment: "Good work",
            createdAt: now,
            updatedAt: now,
            customer: { id: "u1", name: "Casey" },
            service: { id: "svc1", title: "Home cleaning" },
          },
        ]),
      },
    }),
  );
  await login(page);
  await page.getByRole("link", { name: "Home cleaning", exact: true }).click();
  await expect(page.getByText("You reviewed this booking: 4/5.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publish review" }),
  ).toHaveCount(0);
});

test("customer orders without availability and validates notes", async ({
  page,
}) => {
  const { calls } = await setup(page);
  await login(page);
  await page.getByRole("link", { name: "Find a service" }).click();
  await page.getByRole("link", { name: "Home cleaning", exact: true }).click();
  await page.getByRole("link", { name: "Order Now", exact: true }).click();
  const order = page.getByRole("button", { name: "Place Order", exact: true });
  await expect(order).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply filters" })).toHaveCount(
    0,
  );
  await expect(order).toBeEnabled();
  await page.getByLabel("Notes", { exact: true }).fill("x".repeat(2001));
  await order.click();
  expect(
    calls.filter((c) => c.path === "/bookings" && c.method === "POST"),
  ).toHaveLength(0);
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Please ring the doorbell.");
  await order.click();
  await expect(page.getByText("Order placed successfully.")).toBeVisible();
  await expect(page.getByText("Waiting for provider approval.")).toBeVisible();
});

for (const status of ["REJECTED", "CANCELLED"])
  test(`${status} order never offers payment`, async ({ page }) => {
    await setup(page, "CUSTOMER", { bookingStatus: status });
    await login(page);
    await page
      .getByRole("link", { name: "Home cleaning", exact: true })
      .click();
    await expect(page.getByText(status, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Pay Now/ })).toHaveCount(0);
  });

test("provider rejects a pending order and refreshes server status", async ({
  page,
}) => {
  const { calls } = await setup(page, "PROVIDER");
  await login(page);
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Jobs", exact: true })
    .click();
  await page.getByRole("link", { name: "Home cleaning", exact: true }).click();
  await page.getByRole("button", { name: "Reject Order", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("REJECTED", { exact: true })).toBeVisible();
  expect(
    calls.some((c) => c.path.endsWith("/reject") && c.method === "PATCH"),
  ).toBe(true);
});

for (const role of ["CUSTOMER", "PROVIDER", "ADMIN"])
  test(`footer respects ${role} routes`, async ({ page }) => {
    await setup(page, role);
    await login(page);
    const footer = page.getByRole("contentinfo");
    await expect(
      footer.getByRole("link", { name: "Sign In", exact: true }),
    ).toHaveCount(0);
    await expect(
      footer.getByRole("link", { name: "My Bookings", exact: true }),
    ).toHaveCount(role === "CUSTOMER" ? 1 : 0);
    await expect(
      footer.getByRole("link", { name: "Add Service", exact: true }),
    ).toHaveCount(role === "PROVIDER" ? 1 : 0);
    for (const label of [
      "Workspace",
      "My Account",
      ...(role === "CUSTOMER"
        ? ["My Bookings"]
        : role === "PROVIDER"
          ? ["Provider Workspace", "Add Service", "Manage Services", "Jobs"]
          : []),
    ]) {
      const link = footer.getByRole("link", { name: label, exact: true });
      const path = await link.getAttribute("href");
      await link.click();
      await expect(page).toHaveURL(
        new RegExp(path!.replaceAll("/", "\\/") + "$"),
      );
      await expect(
        page.getByRole("heading", {
          name: /could not find|not available to your account/,
        }),
      ).toHaveCount(0);
    }
  });

test("signed-out footer uses existing routes and preserves return-to login", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const label of [
    "Explore Services",
    "All Services",
    "Categories",
    "Sign In",
    "Sign Up",
  ]) {
    const link = footer.getByRole("link", { name: label, exact: true });
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(new RegExp(href! + "$"));
  }
  await footer.getByRole("link", { name: "Add Service", exact: true }).click();
  await expect(page).toHaveURL(/login\?returnTo=.*provider.*services.*new/);
  await expect(
    footer.getByText(
      `© ${new Date().getFullYear()} Servexa. All rights reserved.`,
    ),
  ).toBeVisible();
});

for (const role of ["CUSTOMER", "PROVIDER"])
  test(`header mobile menu preserves ${role} navigation and logout`, async ({
    page,
  }) => {
    await setup(page, role);
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const header = page.getByRole("banner");
    const menu = header.getByRole("button", { name: "Menu", exact: true });
    const navigation = header.getByRole("navigation", {
      name: "Main navigation",
    });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(navigation).toBeHidden();
    await menu.click();
    await expect(
      navigation.getByRole("link", { name: "Workspace", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(navigation).toBeHidden();
    await menu.click();
    await navigation
      .getByRole("link", { name: "Explore services", exact: true })
      .click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(navigation).toBeHidden();
    await menu.click();
    await expect(
      navigation.getByRole("link", { name: "Explore services", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await navigation
      .getByRole("link", { name: "Workspace", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}$`));
    await menu.click();
    await navigation
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await expect(navigation).toBeHidden();
    await menu.click();
    await expect(
      navigation.getByRole("link", { name: "Sign in", exact: true }),
    ).toBeVisible();
  });

test("header shows active service links and responsive signed-out actions", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/services/svc1");
  const header = page.getByRole("banner");
  await expect(
    header.getByRole("link", { name: "Explore services", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    header.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  await header.getByRole("button", { name: "Menu", exact: true }).click();
  await header.getByRole("link", { name: "Get started", exact: false }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(header.getByRole("navigation")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

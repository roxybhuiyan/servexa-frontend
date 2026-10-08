import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Title,
  Remote,
  useApi,
  Panel,
  Empty,
  Pagination,
  Filters,
  Form,
  Confirm,
  Status,
  ErrorBox,
} from "../components/ui";
import { api } from "../api/services";
import { queryClient, useSession } from "../app/session";
import { date, money, canCancel, jobActions } from "../lib/format";
import { pageFilters } from "./public";
import { PaymentPanel } from "./payments";
import { ReviewCreate } from "./reviews";
import * as schemas from "../contracts/forms";
export const bookingStatuses = [
  "PENDING",
  "ACCEPTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];
export async function refreshBooking() {
  await Promise.all(
    ["E24", "E25", "E27", "E28", "E34"].map((id) =>
      queryClient.invalidateQueries({ queryKey: [id] }),
    ),
  );
}
export function BookingList({
  provider = false,
  dashboard = false,
}: {
  provider?: boolean;
  dashboard?: boolean;
}) {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 });
  const query = useApi(provider ? "E27" : "E24", undefined, filter);
  const root = provider ? "/provider" : "/customer";
  return (
    <>
      <Title
        title={
          dashboard
            ? "Your day, at a glance"
            : provider
              ? "Your jobs"
              : "Your bookings"
        }
        eyebrow={provider ? "PROVIDER WORKSPACE" : "CUSTOMER WORKSPACE"}
      >
        <button
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching
            ? "Refreshing…"
            : provider
              ? "Refresh jobs"
              : "Refresh bookings"}
        </button>
        {!provider && (
          <Link className="button primary" to="/services">
            Find a service ↗
          </Link>
        )}
      </Title>
      <Filters
        fields={[
          { name: "status", options: bookingStatuses },
          { name: "serviceId" },
          ...pageFilters,
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Remote query={query}>
        {(v) => (
          <>
            {v.data.length ? (
              <div className="grid">
                {v.data.map((b) => (
                  <Panel key={b.id}>
                    <Status value={b.status} />
                    <h2>
                      <Link to={`${root}/bookings/${b.id}`}>
                        {b.service.title}
                      </Link>
                    </h2>
                    <p>Ordered {date(b.createdAt)}</p>
                    {provider && "customer" in b && (
                      <p>
                        Customer: {b.customer.name} · {b.customer.phone}
                      </p>
                    )}
                    <p>{b.provider.businessName}</p>
                    <p className="id">Booking {b.id}</p>
                    {b.notes && <p>{b.notes}</p>}
                    <strong>{money(b.totalAmount)}</strong>
                    <p>Payment: {b.payment?.status || "UNPAID"}</p>
                    <Link className="button" to={`${root}/bookings/${b.id}`}>
                      {provider && b.status === "PENDING"
                        ? "Review booking / Approve or reject"
                        : "View booking"}
                    </Link>
                  </Panel>
                ))}
              </div>
            ) : (
              <Empty>No bookings match these filters.</Empty>
            )}
            <Pagination
              meta={v.meta}
              onPage={(page) => setFilter({ ...filter, page })}
            />
          </>
        )}
      </Remote>
    </>
  );
}
export function NewBooking() {
  const [params] = useSearchParams();
  const serviceId = params.get("serviceId") || "";
  const q = useApi("E13", serviceId, undefined, !!serviceId);
  const navigate = useNavigate();
  return (
    <>
      <Title title="Confirm Your Order" />
      {!serviceId ? (
        <Empty>
          <Link to="/services">Choose a service first →</Link>
        </Empty>
      ) : (
        <Remote query={q}>
          {(service) => (
            <Panel>
              <h2>{service.title}</h2>
              <p>
                Service price: {money(service.price)}. The server will provide
                the final total after ordering.
              </p>
              <p>Payment is available after provider approval.</p>
              <Form
                key={serviceId}
                schema={schemas.booking}
                initial={{ serviceId }}
                fields={[
                  { name: "serviceId", hidden: true },
                  {
                    name: "notes",
                    type: "textarea",
                    help: "Optional notes, up to 2,000 characters.",
                  },
                ]}
                submit="Place Order"
                onSubmit={async (data) => {
                  const booking = await api("E23", {
                    body: schemas.booking.parse(data),
                  });
                  await refreshBooking();
                  // Tie the success notice to the booking ID returned by the server.
                  navigate(`/customer/bookings/${booking.id}`, {
                    state: { createdBookingId: booking.id },
                  });
                }}
              />
            </Panel>
          )}
        </Remote>
      )}
    </>
  );
}
export function BookingDetail({ provider = false }: { provider?: boolean }) {
  const location = useLocation();
  const { bookingId = "" } = useParams();
  const q = useApi(provider ? "E28" : "E25", bookingId);
  const { user } = useSession();
  return (
    <>
      <Title title={provider ? "Job details" : "Booking details"}>
        <button disabled={q.isFetching} onClick={() => void refreshBooking()}>
          {q.isFetching ? "Refreshing…" : "Refresh status"}
        </button>
      </Title>
      <Remote query={q}>
        {(b) => (
          <>
            {!provider && location.state?.createdBookingId === b.id && (
              <Panel>
                <p role="status">Order placed successfully.</p>
                <p>Current booking status: {b.status}.</p>
                <Link to="/customer/bookings">View all your bookings →</Link>
              </Panel>
            )}
            {!provider && b.status === "PENDING" && (
              <p>Waiting for provider approval.</p>
            )}
            {!provider && b.status === "ACCEPTED" && (
              <p>
                The provider approved your order (ACCEPTED). Payment is
                available using Pay Now below.
              </p>
            )}
            {!provider && b.status === "REJECTED" && (
              <p>The provider rejected this booking request.</p>
            )}
            {!provider && b.status === "CANCELLED" && (
              <p>This booking has been cancelled.</p>
            )}
            <div className="detail-grid">
              <Panel>
                <Status value={b.status} />
                <h2>{b.service.title}</h2>
                <p>Ordered {date(b.createdAt)}</p>
                <p>{b.notes || "No booking notes."}</p>
                <p>
                  Provider: {b.provider.businessName} · {b.provider.phone}
                </p>
                {"customer" in b && (
                  <p>
                    Customer: {b.customer.name} · {b.customer.phone}
                  </p>
                )}
                <small className="id">Booking {b.id}</small>
              </Panel>
              <Panel>
                <h2>Booking total</h2>
                <dl>
                  <dt>Service price</dt>
                  <dd>{money(b.servicePrice)}</dd>
                  <dt>Platform fee</dt>
                  <dd>{money(b.platformFee)}</dd>
                  <dt>Total</dt>
                  <dd>{money(b.totalAmount)}</dd>
                </dl>
                <Status value={b.payment?.status || "UNPAID"} />
              </Panel>
            </div>
            <div className="actions">
              {!provider && canCancel(b.status, b.payment?.status) && (
                <Confirm
                  title="Cancel booking"
                  onConfirm={async () => {
                    try {
                      await api("E26", { id: b.id });
                    } finally {
                      await refreshBooking();
                    }
                  }}
                >
                  <p>This cancels the booking. It does not issue a refund.</p>
                </Confirm>
              )}
              {provider &&
                jobActions(b.status, b.payment?.status).map((action) => (
                  <Confirm
                    key={action}
                    title={
                      action === "accept"
                        ? "Accept Order"
                        : action === "reject"
                          ? "Reject Order"
                          : `${action[0].toUpperCase() + action.slice(1)} job`
                    }
                    onConfirm={async () => {
                      const ids = {
                        accept: "E29",
                        reject: "E30",
                        start: "E31",
                        complete: "E32",
                      } as const;
                      try {
                        await api(ids[action as keyof typeof ids], {
                          id: b.id,
                        });
                      } finally {
                        await refreshBooking();
                      }
                    }}
                  >
                    <p>Update the job after confirming the work status.</p>
                  </Confirm>
                ))}
            </div>
            {!provider && user && <PaymentPanel booking={b} userId={user.id} />}{" "}
            {!provider && b.status === "COMPLETED" && (
              <ReviewCreate key={b.id} bookingId={b.id} />
            )}
          </>
        )}
      </Remote>
    </>
  );
}

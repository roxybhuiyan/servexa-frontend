import { useState } from "react";
import {
  Link,
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
import { Slots, pageFilters } from "./public";
import { PaymentPanel } from "./payments";
import { ReviewCreate } from "./reviews";
import { ApiError } from "../api/client";
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
    ["E24", "E25", "E27", "E28", "E18", "E19", "E34"].map((id) =>
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
                    <p>{date(b.slot.startTime)}</p>
                    <p>{b.provider.businessName}</p>
                    <strong>{money(b.totalAmount)}</strong>
                    <p>Payment: {b.payment?.status || "UNPAID"}</p>
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
  const [conflict, setConflict] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const serviceId = params.get("serviceId") || "",
    slotId = params.get("slotId") || "";
  const q = useApi("E13", serviceId, undefined, !!serviceId);
  const navigate = useNavigate();
  return (
    <>
      <Title title="Request your booking" />
      {conflict && <ErrorBox error={new Error(conflict)} />}
      {!serviceId ? (
        <Empty>
          <Link to="/services">Choose a service first →</Link>
        </Empty>
      ) : (
        <Remote query={q}>
          {(service) => (
            <>
              <Panel>
                <h2>{service.title}</h2>
                <p>
                  Service price: {money(service.price)}. The server will provide
                  the final total after booking.
                </p>
              </Panel>
              <Slots
                serviceId={serviceId}
                onChoose={(id) => {
                  setConflict(null);
                  setParams({ serviceId, slotId: id });
                }}
              />
              {slotId && (
                <Panel>
                  <h2>Selected time</h2>
                  <p className="id">Slot reference: {slotId}</p>
                  <Form
                    key={slotId}
                    schema={schemas.booking}
                    initial={{ serviceId, slotId }}
                    fields={[
                      { name: "serviceId", hidden: true },
                      { name: "slotId", hidden: true },
                      {
                        name: "notes",
                        type: "textarea",
                        help: "Optional notes, up to 2,000 characters.",
                      },
                    ]}
                    submit="Request booking"
                    onSubmit={async (data) => {
                      try {
                        const b = await api("E23", {
                          body: data as schemas.CreateBooking,
                        });
                        await refreshBooking();
                        navigate(`/customer/bookings/${b.id}`);
                      } catch (e) {
                        if (e instanceof ApiError && e.status === 409) {
                          await queryClient.invalidateQueries({
                            queryKey: ["E18"],
                          });
                          setParams({ serviceId });
                          setConflict(
                            "This time cannot be booked. Released slots may retain an earlier booking. Choose another time.",
                          );
                          throw new ApiError(
                            409,
                            "This time cannot be booked. Released slots may still have an earlier booking. Please choose another time.",
                          );
                        }
                        throw e;
                      }
                    }}
                  />
                </Panel>
              )}
            </>
          )}
        </Remote>
      )}
    </>
  );
}
export function BookingDetail({ provider = false }: { provider?: boolean }) {
  const { bookingId = "" } = useParams();
  const q = useApi(provider ? "E28" : "E25", bookingId);
  const { user } = useSession();
  return (
    <>
      <Title title={provider ? "Job details" : "Booking details"}>
        <button onClick={() => void refreshBooking()}>Refresh status</button>
      </Title>
      <Remote query={q}>
        {(b) => (
          <>
            <div className="detail-grid">
              <Panel>
                <Status value={b.status} />
                <h2>{b.service.title}</h2>
                <p>
                  {date(b.slot.startTime)} – {date(b.slot.endTime)}
                </p>
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
                    title={`${action[0].toUpperCase() + action.slice(1)} job`}
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

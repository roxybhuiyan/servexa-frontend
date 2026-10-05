import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Title,
  Panel,
  Remote,
  useApi,
  Status,
  Form,
  Filters,
  Pagination,
  Empty,
  Confirm,
} from "../components/ui";
import { api } from "../api/services";
import { queryClient, useSession } from "../app/session";
import * as schemas from "../contracts/forms";
import type { OwnService } from "../api/types";
import { money, date, localDate } from "../lib/format";
import { BookingList } from "./bookings";
import { Reviews, pageFilters } from "./public";
export function Approval({ children }: { children: ReactNode }) {
  const q = useApi("E08");
  return (
    <Remote query={q}>
      {(v) =>
        v.status === "APPROVED" ? (
          children
        ) : (
          <Panel>
            <Status value={v.status} />
            <h2>Provider approval required</h2>
            <p>
              You can update your profile and existing services while waiting
              for approval.
            </p>
            <button onClick={() => void q.refetch()}>
              Refresh approval status
            </button>
          </Panel>
        )
      }
    </Remote>
  );
}
export function ProviderDashboard() {
  const q = useApi("E08");
  return (
    <Remote query={q}>
      {(v) => (
        <>
          <Title
            title={`Hello, ${v.businessName}`}
            eyebrow="YOUR PROVIDER WORKSPACE"
          />
          <Panel>
            <Status value={v.status} />
            <p>Manage your services, available times, and upcoming work.</p>
            <div className="actions">
              <Link to="/provider/profile">Edit profile →</Link>
              <Link to="/provider/services">Manage services →</Link>
              <Link to="/provider/availability">Manage availability →</Link>
            </div>
          </Panel>
          {v.status === "APPROVED" ? (
            <BookingList provider dashboard />
          ) : (
            <p>
              Approval is required to create services, change availability, and
              manage jobs.
            </p>
          )}
        </>
      )}
    </Remote>
  );
}
export function ProviderProfile() {
  const q = useApi("E08");
  return (
    <>
      <Title title="Business profile" />
      <Remote query={q}>
        {(v) => (
          <Panel>
            <Status value={v.status} />
            <Form
              schema={schemas.providerProfile}
              initial={{
                businessName: v.businessName,
                phone: v.phone,
                city: v.city,
                address: v.address,
                bio: v.bio || "",
              }}
              fields={[
                { name: "businessName", required: true },
                { name: "phone", required: true },
                { name: "city", required: true },
                { name: "address", required: true },
                { name: "bio", type: "textarea", nullable: true },
              ]}
              onSubmit={async (data) => {
                await api("E09", { body: data });
                await queryClient.invalidateQueries({ queryKey: ["E08"] });
              }}
            />
            <p>Business phone and account phone are separate fields.</p>
          </Panel>
        )}
      </Remote>
    </>
  );
}
export function ProviderServices() {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 });
  const q = useApi("E14", undefined, filter),
    profile = useApi("E08");
  return (
    <>
      <Title title="Your services">
        {profile.data?.status === "APPROVED" && (
          <Link className="button primary" to="/provider/services/new">
            Create service +
          </Link>
        )}
      </Title>
      <Filters
        fields={[
          { name: "search" },
          { name: "status", options: ["ACTIVE", "INACTIVE"] },
          { name: "sortBy", options: ["createdAt", "price", "title"] },
          ...pageFilters,
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Remote query={q}>
        {(v) => (
          <>
            {v.data.length ? (
              <div className="grid">
                {v.data.map((s) => (
                  <Panel key={s.id}>
                    <Status value={s.status} />
                    <h2>{s.title}</h2>
                    <p>
                      {money(s.price)} · Duration {s.duration}
                    </p>
                    <Link
                      className="button"
                      to={`/provider/services/${s.id}/edit`}
                      state={{ service: s }}
                    >
                      Edit service
                    </Link>
                    <Confirm
                      title="Delete service"
                      onConfirm={async () => {
                        await api("E17", { id: s.id });
                        await queryClient.invalidateQueries({
                          queryKey: ["E14"],
                        });
                      }}
                    >
                      <p>
                        This hides the service. Existing bookings are not
                        automatically cancelled.
                      </p>
                    </Confirm>
                  </Panel>
                ))}
              </div>
            ) : (
              <Empty>No services match these filters.</Empty>
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
export function ServiceEditor() {
  const { serviceId } = useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const categories = useApi("E11");
  const [scanPage, setScanPage] = useState(1),
    [found, setFound] = useState<OwnService | undefined>();
  const q = useQuery({
    queryKey: ["E14", user?.id, "resolve", serviceId, scanPage],
    queryFn: async ({ signal }) =>
      api("E14", { query: { page: scanPage, limit: 100 }, signal }),
    enabled: !!serviceId && !found,
  });
  useEffect(() => {
    setScanPage(1);
    setFound(undefined);
  }, [serviceId]);
  const service = found || q.data?.data.find((v) => v.id === serviceId);
  const form = (s?: OwnService) => (
    <Remote query={categories}>
      {(cats) => (
        <Panel>
          <Form
            key={s?.id || "new"}
            schema={serviceId ? schemas.servicePatch : schemas.service}
            patch={!!serviceId}
            initial={
              s
                ? {
                    categoryId: s.categoryId,
                    title: s.title,
                    price: s.price,
                    duration: s.duration,
                    description: s.description || "",
                    imageUrl: s.imageUrl || "",
                    serviceArea: s.serviceArea || "",
                    status: s.status,
                  }
                : { status: "ACTIVE" }
            }
            fields={[
              {
                name: "categoryId",
                label: "Category",
                required: true,
                options: cats.map((c) => ({ value: c.id, label: c.name })),
              },
              { name: "title", required: true },
              { name: "price", required: true },
              {
                name: "duration",
                type: "number",
                required: true,
                help: "Backend accepts 1–1440; confirm the intended duration unit with your administrator.",
              },
              { name: "description", type: "textarea", nullable: true },
              {
                name: "imageUrl",
                label: "Image URL",
                nullable: true,
                help: "An existing image address. No upload is performed.",
              },
              { name: "serviceArea", nullable: true },
              {
                name: "status",
                required: true,
                options: ["ACTIVE", "INACTIVE"].map((value) => ({
                  value,
                  label: value,
                })),
              },
            ]}
            onSubmit={async (data) => {
              if (serviceId)
                await api("E16", {
                  id: serviceId,
                  body: data as schemas.PatchService,
                });
              else await api("E15", { body: data as schemas.CreateService });
              await queryClient.invalidateQueries({ queryKey: ["E14"] });
              navigate("/provider/services");
            }}
          />
        </Panel>
      )}
    </Remote>
  );
  return (
    <>
      <Title title={serviceId ? "Edit service" : "Create service"} />
      {!serviceId ? (
        <Approval>{form()}</Approval>
      ) : service ? (
        form(service)
      ) : (
        <Remote query={q}>
          {(data) => (
            <Panel>
              <p>
                {scanPage < data.meta.totalPages
                  ? "Service was not on this page. Continue searching your owned services."
                  : "Service not found among the inspected pages."}
              </p>
              {scanPage < data.meta.totalPages && (
                <button
                  onClick={() => {
                    const hit = data.data.find((v) => v.id === serviceId);
                    if (hit) setFound(hit);
                    else setScanPage((v) => v + 1);
                  }}
                >
                  Search next 100 services
                </button>
              )}
            </Panel>
          )}
        </Remote>
      )}
    </>
  );
}
export function Availability() {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 }),
    [editing, setEditing] = useState<string | null>(null);
  const [servicePage, setServicePage] = useState(1);
  const profile = useApi("E08"),
    q = useApi("E19", undefined, filter),
    services = useApi("E14", undefined, {
      page: servicePage,
      limit: 100,
      status: "ACTIVE",
    });
  const approved = profile.data?.status === "APPROVED";
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["E19"] });
  const serviceOptions =
    services.data?.data.map((v) => ({ value: v.id, label: v.title })) || [];
  return (
    <>
      <Title title="Your availability" />
      <p>
        Times are entered in {Intl.DateTimeFormat().resolvedOptions().timeZone}{" "}
        and sent with a timezone offset.
      </p>
      <Remote query={profile}>{(v) => <Status value={v.status} />}</Remote>
      {approved && (
        <Panel>
          <h2>Create a time slot</h2>
          <Remote query={services}>
            {(v) => (
              <>
                {v.data.length ? (
                  <Form
                    schema={schemas.slot}
                    fields={[
                      {
                        name: "serviceId",
                        label: "Active service",
                        required: true,
                        options: serviceOptions,
                      },
                      {
                        name: "startTime",
                        type: "datetime-local",
                        required: true,
                      },
                      {
                        name: "endTime",
                        type: "datetime-local",
                        required: true,
                      },
                    ]}
                    submit="Create slot"
                    onSubmit={async (data) => {
                      try {
                        await api("E20", { body: data as schemas.CreateSlot });
                      } finally {
                        await invalidate();
                      }
                    }}
                  />
                ) : (
                  <Empty>Create an active service first.</Empty>
                )}
                <Pagination meta={v.meta} onPage={setServicePage} />
              </>
            )}
          </Remote>
        </Panel>
      )}
      <Filters
        fields={[
          { name: "serviceId" },
          { name: "from", type: "datetime-local" },
          { name: "to", type: "datetime-local" },
          { name: "isBooked", options: ["true", "false"] },
          ...pageFilters,
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Remote query={q}>
        {(v) => (
          <>
            {v.data.length ? (
              v.data.map((slot) => (
                <Panel key={slot.id}>
                  <h2>{slot.service.title}</h2>
                  <p>
                    {date(slot.startTime)} → {date(slot.endTime)}
                  </p>
                  <Status value={slot.isBooked ? "BOOKED" : "AVAILABLE"} />
                  {approved && !slot.isBooked && (
                    <div className="actions">
                      <button
                        onClick={() =>
                          setEditing(editing === slot.id ? null : slot.id)
                        }
                      >
                        Edit time
                      </button>
                      <Confirm
                        title="Delete slot"
                        onConfirm={async () => {
                          try {
                            await api("E22", { id: slot.id });
                          } finally {
                            await invalidate();
                          }
                        }}
                      >
                        <p>
                          A slot with an earlier booking may still be
                          undeletable even when shown as available.
                        </p>
                      </Confirm>
                    </div>
                  )}
                  {editing === slot.id && approved && (
                    <Form
                      schema={schemas.slot}
                      initial={{
                        serviceId: slot.serviceId,
                        startTime: localDate(slot.startTime),
                        endTime: localDate(slot.endTime),
                      }}
                      fields={[
                        {
                          name: "serviceId",
                          label: "Active service",
                          required: true,
                          options: [
                            {
                              value: slot.serviceId,
                              label: slot.service.title,
                            },
                            ...serviceOptions.filter(
                              (v) => v.value !== slot.serviceId,
                            ),
                          ],
                        },
                        {
                          name: "startTime",
                          type: "datetime-local",
                          required: true,
                        },
                        {
                          name: "endTime",
                          type: "datetime-local",
                          required: true,
                        },
                      ]}
                      onSubmit={async (data) => {
                        try {
                          await api("E21", { id: slot.id, body: data });
                          setEditing(null);
                        } finally {
                          await invalidate();
                        }
                      }}
                    />
                  )}
                </Panel>
              ))
            ) : (
              <Empty>No slots match these filters.</Empty>
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
export function ProviderReviews() {
  const q = useApi("E08");
  return (
    <>
      <Title title="Customer feedback" />
      <Remote query={q}>
        {(v) =>
          v.status === "APPROVED" ? (
            <Reviews scope="provider" id={v.id} />
          ) : (
            <Panel>
              <Status value={v.status} />
              <p>
                Public review visibility is available for approved provider
                profiles.
              </p>
            </Panel>
          )
        }
      </Remote>
    </>
  );
}

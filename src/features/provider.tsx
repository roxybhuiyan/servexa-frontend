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
  ErrorBox,
} from "../components/ui";
import { api } from "../api/services";
import { queryClient, useSession } from "../app/session";
import * as schemas from "../contracts/forms";
import type { OwnService } from "../api/types";
import { money } from "../lib/format";
import { BookingList } from "./bookings";
import { Reviews, pageFilters } from "./public";
// Render protected provider tools only after the profile API reports approval.
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
            <p>Manage your services and customer orders.</p>
            <div className="actions">
              <Link to="/provider/profile">Edit profile →</Link>
              <Link to="/provider/services">Manage services →</Link>
              <Link to="/provider/bookings">Manage orders →</Link>
            </div>
          </Panel>
          {v.status === "APPROVED" ? (
            <BookingList provider dashboard />
          ) : (
            <p>Approval is required to create services and manage jobs.</p>
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
        {!profile.error && profile.data?.status === "APPROVED" && (
          <Link className="button primary" to="/provider/services/new">
            Create service +
          </Link>
        )}
      </Title>
      {profile.isPending ? (
        <p role="status">Loading provider approval status…</p>
      ) : profile.error || profile.data?.status !== "APPROVED" ? (
        <Panel>
          {profile.error ? (
            <>
              <p>Unable to check your provider approval status.</p>
              <ErrorBox error={profile.error} />
            </>
          ) : (
            <>
              {profile.data && <Status value={profile.data.status} />}
              <p>
                {profile.data?.status === "REJECTED"
                  ? "Your provider profile was rejected. Service creation is unavailable unless your profile is approved."
                  : "Your provider profile is awaiting approval. Service creation is unavailable until your profile is approved."}
              </p>
            </>
          )}
          <button
            disabled={profile.isFetching}
            onClick={() => void profile.refetch()}
          >
            {profile.isFetching ? "Refreshing status…" : "Refresh status"}
          </button>
        </Panel>
      ) : null}
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
                    <p>Category: {s.category.name}</p>
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
  const [created, setCreated] = useState<OwnService | null>(null);
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
              else {
                const result = await api("E15", {
                  body: data as schemas.CreateService,
                });
                setCreated(result);
              }
              await queryClient.invalidateQueries({ queryKey: ["E14"] });
              if (serviceId) navigate("/provider/services");
            }}
          />
        </Panel>
      )}
    </Remote>
  );
  return (
    <>
      <Title title={serviceId ? "Edit service" : "Create service"} />
      {created ? (
        <Panel>
          <h2 role="status">Service created successfully</h2>
          <p>{created.title}</p>
          <p>
            {created.status === "ACTIVE"
              ? "Your service is published. Customers can now place orders."
              : "Your service was saved as inactive. Activate it when you are ready to receive orders."}
          </p>
          <p>
            <Link className="button" to="/provider/services">
              Back to Services
            </Link>
          </p>
        </Panel>
      ) : !serviceId ? (
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

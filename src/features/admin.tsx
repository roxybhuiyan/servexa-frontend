import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  Json,
  Metrics,
  type Filter,
} from "../components/ui";
import { api } from "../api/services";
import { queryClient, useSession } from "../app/session";
import type { AdminUser, AdminProvider } from "../api/types";
import * as schemas from "../contracts/forms";
import { date } from "../lib/format";
import { pageFilters } from "./public";
const invalidate = (...ids: string[]) =>
  Promise.all(
    ids.map((id) => queryClient.invalidateQueries({ queryKey: [id] })),
  );
export function AdminDashboard() {
  const [filter, setFilter] = useState<Record<string, unknown>>({});
  const [limit, setLimit] = useState<Record<string, unknown>>({ limit: 20 });
  const overview = useApi("E44"),
    revenue = useApi("E45", undefined, filter),
    bookings = useApi("E46", undefined, filter),
    providers = useApi("E47"),
    services = useApi("E48"),
    activity = useApi("E49", undefined, limit);
  return (
    <>
      <Title title="Operations overview" eyebrow="ADMIN WORKSPACE" />
      <Panel>
        <h2>Overview</h2>
        <Remote query={overview}>{(v) => <Metrics value={v} />}</Remote>
      </Panel>
      <h2>Booking and revenue analysis</h2>
      <p>
        Date filters apply to booking creation time, not payment time. Customer
        filter applies only to booking analytics.
      </p>
      <Filters
        fields={[
          { name: "from", type: "datetime-local" },
          { name: "to", type: "datetime-local" },
          { name: "providerId" },
          { name: "serviceId" },
          { name: "customerId" },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <div className="detail-grid">
        <Panel>
          <h2>Revenue</h2>
          <Remote query={revenue}>{(v) => <Metrics value={v} />}</Remote>
        </Panel>
        <Panel>
          <h2>Bookings</h2>
          <Remote query={bookings}>{(v) => <Metrics value={v} />}</Remote>
        </Panel>
      </div>
      <Panel>
        <h2>Provider analytics</h2>
        <Remote query={providers}>{(v) => <Metrics value={v} />}</Remote>
      </Panel>
      <Panel>
        <h2>Service analytics</h2>
        <Remote query={services}>{(v) => <Metrics value={v} />}</Remote>
      </Panel>
      <Panel>
        <h2>Recent activity</h2>
        <Filters
          fields={[{ name: "limit", options: ["10", "20", "50", "100"] }]}
          value={limit}
          onChange={(v) => setLimit({ limit: v.limit || 20 })}
        />
        <Remote query={activity}>
          {(v) =>
            v.length ? (
              <ul className="activity">
                {v.map((a) => (
                  <li key={a.id}>
                    <strong>{a.action}</strong>
                    <span>
                      {a.entityType} · {a.user?.name || "System"} ·{" "}
                      {date(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No recent activity.</Empty>
            )
          }
        </Remote>
      </Panel>
    </>
  );
}
function UserActions({
  user,
  detail = false,
}: {
  user: AdminUser;
  detail?: boolean;
}) {
  const { user: current } = useSession();
  const navigate = useNavigate();
  return (
    <div className="actions">
      {(["ACTIVE", "SUSPENDED", "BLOCKED"] as const)
        .filter((s) => s !== user.status)
        .map((status) => (
          <Confirm
            key={status}
            title={`Set ${status.toLowerCase()}`}
            disabled={current?.id === user.id && status !== "ACTIVE"}
            onConfirm={async () => {
              await api("E54", { id: user.id, body: { status } });
              await invalidate("E52", "E53", "E44");
            }}
          >
            <p>
              Change access for {user.name} to {status.toLowerCase()}.
            </p>
          </Confirm>
        ))}
      <Confirm
        title="Delete user"
        disabled={current?.id === user.id}
        onConfirm={async () => {
          await api("E55", { id: user.id });
          await invalidate("E52", "E53", "E44");
          if (detail) navigate("/admin/users");
        }}
      >
        <p>Soft delete {user.name}. This removes account access.</p>
      </Confirm>
    </div>
  );
}
export function AdminUsers() {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 });
  const q = useApi("E52", undefined, filter);
  return (
    <>
      <Title title="User management" />
      <Filters
        fields={[
          { name: "search" },
          { name: "role", options: ["CUSTOMER", "PROVIDER", "ADMIN"] },
          { name: "status", options: ["ACTIVE", "SUSPENDED", "BLOCKED"] },
          { name: "sortBy", options: ["createdAt", "name", "email"] },
          ...pageFilters,
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Remote query={q}>
        {(v) => (
          <>
            {v.data.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.data.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <Link to={`/admin/users/${u.id}`}>{u.name}</Link>
                          <small>{u.email}</small>
                        </td>
                        <td>{u.role}</td>
                        <td>
                          <Status value={u.status} />
                        </td>
                        <td>
                          <UserActions user={u} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No users match these filters.</Empty>
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
export function AdminUserDetail() {
  const { userId = "" } = useParams();
  const q = useApi("E53", userId);
  return (
    <>
      <Title title="User details" />
      <Remote query={q}>
        {(v) => (
          <Panel>
            <h2>{v.name}</h2>
            <p>
              {v.email} · {v.phone}
            </p>
            <p>{v.role}</p>
            <Status value={v.status} />
            <p>Created {date(v.createdAt)}</p>
            {v.providerProfile && <Metrics value={v.providerProfile} />}
            <UserActions user={v} detail />
          </Panel>
        )}
      </Remote>
    </>
  );
}
export function AdminProviders() {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 });
  const q = useApi("E56", undefined, filter);
  return (
    <>
      <Title title="Provider approvals" />
      <Filters
        fields={[
          { name: "search" },
          { name: "status", options: ["PENDING", "APPROVED", "REJECTED"] },
          {
            name: "sortBy",
            options: ["createdAt", "businessName", "city", "rating"],
          },
          ...pageFilters,
        ]}
        value={filter}
        onChange={setFilter}
      />
      <p>
        Rating sort uses the stored provider rating, which may differ from live
        reviews.
      </p>
      <Remote query={q}>
        {(v) => (
          <>
            {v.data.length ? (
              <div className="grid">
                {v.data.map((p) => (
                  <Panel key={p.id}>
                    <Status value={p.status} />
                    <h2>{p.businessName}</h2>
                    <p>
                      {p.city} · {p.user.name}
                    </p>
                    <p>Account: {p.user.status}</p>
                    <p>
                      Stored rating: {p.rating} ({p.totalReviews} reviews)
                    </p>
                    <div className="actions">
                      {(["PENDING", "APPROVED", "REJECTED"] as const)
                        .filter((s) => s !== p.status)
                        .map((status) => (
                          <Confirm
                            key={status}
                            title={`Set ${status.toLowerCase()}`}
                            disabled={p.user.status !== "ACTIVE"}
                            onConfirm={async () => {
                              await api("E57", { id: p.id, body: { status } });
                              await invalidate("E56", "E44", "E47");
                            }}
                          >
                            <p>
                              Change provider approval for {p.businessName}.
                            </p>
                          </Confirm>
                        ))}
                    </div>
                  </Panel>
                ))}
              </div>
            ) : (
              <Empty>No providers match these filters.</Empty>
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
const categoryFields = [
  { name: "name", required: true },
  { name: "slug", help: "Optional lowercase words separated by hyphens." },
  { name: "description", type: "textarea", nullable: true },
];
export function AdminCategories() {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 }),
    [editing, setEditing] = useState<string | null>(null),
    [creating, setCreating] = useState(false);
  const q = useApi("E58", undefined, filter);
  return (
    <>
      <Title title="Service categories">
        <button className="primary" onClick={() => setCreating((v) => !v)}>
          Create category +
        </button>
      </Title>
      {creating && (
        <Panel>
          <h2>New category</h2>
          <Form
            fields={categoryFields}
            schema={schemas.category}
            submit="Create category"
            onSubmit={async (data) => {
              await api("E59", { body: data as schemas.CreateCategory });
              setCreating(false);
              await invalidate("E58", "E11");
            }}
          />
        </Panel>
      )}
      <Filters
        fields={[
          { name: "search" },
          { name: "limit", options: ["10", "20", "50", "100"] },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Remote query={q}>
        {(v) => (
          <>
            {v.data.length ? (
              v.data.map((c) => (
                <Panel key={c.id}>
                  <h2>{c.name}</h2>
                  <p>{c.description || "No description"}</p>
                  {editing === c.id ? (
                    <Form
                      schema={schemas.category}
                      fields={categoryFields}
                      initial={{
                        name: c.name,
                        slug: c.slug,
                        description: c.description || "",
                      }}
                      onSubmit={async (data) => {
                        await api("E60", { id: c.id, body: data });
                        setEditing(null);
                        await invalidate("E58", "E11");
                      }}
                    />
                  ) : (
                    <button onClick={() => setEditing(c.id)}>
                      Edit category
                    </button>
                  )}
                  <Confirm
                    title="Delete category"
                    onConfirm={async () => {
                      await api("E61", { id: c.id });
                      await invalidate("E58", "E11");
                    }}
                  >
                    <p>
                      This soft deletes the category and can affect public
                      service visibility.
                    </p>
                  </Confirm>
                </Panel>
              ))
            ) : (
              <Empty>No categories match your search.</Empty>
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
export function AdminReviews() {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 });
  const q = useApi("E62", undefined, filter);
  return (
    <>
      <Title title="Review moderation" />
      <Filters
        fields={[
          { name: "search" },
          { name: "customerId" },
          { name: "providerId" },
          { name: "serviceId" },
          { name: "rating", options: ["1", "2", "3", "4", "5"] },
          ...pageFilters,
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Remote query={q}>
        {(v) => (
          <>
            {v.data.length ? (
              v.data.map((r) => (
                <Panel key={r.id}>
                  <Status value={r.deletedAt ? "DELETED" : "VISIBLE"} />
                  <h2>
                    {r.service.title} · {r.rating}/5
                  </h2>
                  <p>{r.customer.name}</p>
                  <p>{r.comment || "No comment"}</p>
                  {!r.deletedAt && (
                    <Confirm
                      title="Remove review"
                      onConfirm={async () => {
                        await api("E63", { id: r.id });
                        await invalidate("E62", "E40", "E41", "E42", "E43");
                      }}
                    >
                      <p>This hides the review. There is no restore action.</p>
                    </Confirm>
                  )}
                </Panel>
              ))
            ) : (
              <Empty>No reviews match these filters.</Empty>
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
export function AuditList() {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 });
  const q = useApi("E50", undefined, filter);
  return (
    <>
      <Title title="Audit trail" />
      <Filters
        fields={[
          { name: "from", type: "datetime-local" },
          { name: "to", type: "datetime-local" },
          { name: "action" },
          { name: "entityType" },
          { name: "entityId" },
          { name: "userId" },
          ...pageFilters,
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Remote query={q}>
        {(v) => (
          <>
            {v.data.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Actor</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.data.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Link to={`/admin/audit-logs/${a.id}`}>
                            {a.action}
                          </Link>
                        </td>
                        <td>
                          {a.entityType}
                          <small className="id">{a.entityId}</small>
                        </td>
                        <td>{a.user?.name || "System"}</td>
                        <td>{date(a.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No audit entries match these exact filters.</Empty>
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
export function AuditDetail() {
  const { auditLogId = "" } = useParams();
  const q = useApi("E51", auditLogId);
  return (
    <>
      <Title title="Audit entry" />
      <Remote query={q}>
        {(v) => (
          <>
            <Panel>
              <h2>{v.action}</h2>
              <p>
                {v.entityType} · {v.entityId}
              </p>
              <p>
                {v.user?.name || "System"} · {date(v.createdAt)}
              </p>
              <p>IP: {v.ipAddress || "Unavailable"}</p>
              <p>User agent: {v.userAgent || "Unavailable"}</p>
            </Panel>
            <div className="detail-grid">
              <Panel>
                <h2>Before</h2>
                <Json value={v.oldData} />
              </Panel>
              <Panel>
                <h2>After</h2>
                <Json value={v.newData} />
              </Panel>
            </div>
          </>
        )}
      </Remote>
    </>
  );
}

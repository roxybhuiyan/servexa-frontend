import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Title,
  Remote,
  useApi,
  Panel,
  Empty,
  Pagination,
  Filters,
  type Filter,
} from "../components/ui";
import type { PublicService } from "../api/types";
import { useSession } from "../app/session";
import { money, date } from "../lib/format";
export const pageFilters: Filter[] = [
  { name: "limit", options: ["10", "20", "50", "100"] },
  { name: "sortOrder", options: ["asc", "desc"] },
];
export function ServiceCard({ service }: { service: PublicService }) {
  const [broken, setBroken] = useState(false);
  return (
    <article className="service-card">
      <Link to={`/services/${service.id}`} tabIndex={-1} aria-hidden="true">
        {service.imageUrl &&
        !broken &&
        /^https?:\/\//.test(service.imageUrl) ? (
          <img src={service.imageUrl} alt="" onError={() => setBroken(true)} />
        ) : (
          <div className="service-art">
            <span>{service.category.name.slice(0, 1)}</span>
          </div>
        )}
      </Link>
      <div className="card-body">
        <small>
          {service.category.name} · {service.provider.city}
        </small>
        <h2>
          <Link to={`/services/${service.id}`}>{service.title}</Link>
        </h2>
        <p>{service.provider.businessName}</p>
        <div className="card-footer">
          <strong>{money(service.price)}</strong>
          <span>View service ↗</span>
        </div>
      </div>
    </article>
  );
}
export function Catalog({
  landing = false,
  providerId,
}: {
  landing?: boolean;
  providerId?: string;
}) {
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(params);
  const categories = useApi("E11");
  const services = useApi("E12", undefined, {
    ...filters,
    ...(providerId ? { provider: providerId } : {}),
    ...(landing ? { limit: 6 } : {}),
  });
  const change = (v: Record<string, unknown>) =>
    setParams(
      Object.fromEntries(
        Object.entries(v)
          .filter(([, v]) => v !== "" && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ),
    );
  return (
    <>
      {landing ? (
        <section className="hero">
          <div>
            <small>EVERYDAY NEEDS. CAPABLE HANDS.</small>
            <h1>
              Good service.
              <br />
              <em>Less searching.</em>
            </h1>
            <p>
              Find a service that fits your day. Choose your provider, place an
              order, and keep every booking in one place.
            </p>
            <Link className="button primary" to="/services">
              Explore services ↗
            </Link>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit">
              <span>S</span>
            </div>
            <div className="art-caption">FIND / BOOK / GET IT DONE</div>
          </div>
        </section>
      ) : (
        !providerId && (
          <Title
            title="Find your next helping hand"
            eyebrow="THE SERVICE DIRECTORY"
          />
        )
      )}
      {!providerId && (
        <Remote query={categories}>
          {(items) => (
            <nav className="categories" aria-label="Service categories">
              <Link to="/services">All services</Link>
              {items.map((c) => (
                <Link
                  key={c.id}
                  to={`/services?category=${encodeURIComponent(c.id)}`}
                >
                  {c.name} ↗
                </Link>
              ))}
            </nav>
          )}
        </Remote>
      )}
      {landing ? (
        <Title title="Explore services" eyebrow="MAKE ROOM FOR YOUR DAY">
          <Link to="/services">View all services →</Link>
        </Title>
      ) : (
        <Filters
          value={filters}
          onChange={change}
          fields={[
            { name: "search" },
            { name: "category" },
            { name: "city" },
            ...(!providerId
              ? [{ name: "provider", label: "Provider profile ID" }]
              : []),
            { name: "minPrice", label: "Minimum price" },
            { name: "maxPrice", label: "Maximum price" },
            { name: "sortBy", options: ["createdAt", "price", "title"] },
            ...pageFilters,
          ]}
        />
      )}
      <Remote query={services}>
        {(data) => (
          <>
            {data.data.length ? (
              <div className="grid">
                {data.data.map((v) => (
                  <ServiceCard key={v.id} service={v} />
                ))}
              </div>
            ) : (
              <Empty>
                No services match your search. Try another category or city.
              </Empty>
            )}
            {!landing && (
              <Pagination
                meta={data.meta}
                onPage={(page) => change({ ...filters, page })}
              />
            )}
          </>
        )}
      </Remote>
      {landing && (
        <section className="steps">
          <div>
            <small>01 / DISCOVER</small>
            <h2>A service for your day.</h2>
            <p>Browse services and find the right fit.</p>
          </div>
          <div>
            <small>02 / BOOK</small>
            <h2>Place your order.</h2>
            <p>Send your order for provider approval.</p>
          </div>
          <div>
            <small>03 / FOLLOW THROUGH</small>
            <h2>Everything in one place.</h2>
            <p>Track acceptance, payment, and completion.</p>
          </div>
        </section>
      )}
    </>
  );
}
export function Reviews({
  scope,
  id,
}: {
  scope: "service" | "provider";
  id: string;
}) {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 });
  const summary = useApi(scope === "service" ? "E41" : "E43", id);
  const reviews = useApi(scope === "service" ? "E40" : "E42", id, filter);
  return (
    <section>
      <h2>Customer reviews</h2>
      <Remote query={summary}>
        {(v) => (
          <p>
            <strong>{v.averageRating.toFixed(1)} / 5</strong> · {v.reviewCount}{" "}
            reviews · live rating
          </p>
        )}
      </Remote>
      <Filters
        fields={[
          { name: "rating", options: ["1", "2", "3", "4", "5"] },
          ...pageFilters,
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Remote query={reviews}>
        {(v) => (
          <>
            {v.data.length ? (
              v.data.map((r) => (
                <Panel key={r.id}>
                  <strong>
                    {r.customer.name} · {r.rating}/5
                  </strong>
                  <p>{r.comment || "No written comment."}</p>
                  <small>{date(r.createdAt)}</small>
                </Panel>
              ))
            ) : (
              <Empty>No reviews yet.</Empty>
            )}
            <Pagination
              meta={v.meta}
              onPage={(page) => setFilter({ ...filter, page })}
            />
          </>
        )}
      </Remote>
    </section>
  );
}
export function ServiceDetail() {
  const { user, hydrating } = useSession();
  const { serviceId = "" } = useParams();
  const query = useApi("E13", serviceId);
  return (
    <Remote query={query}>
      {(v) => (
        <>
          <Title title={v.title} eyebrow={v.category.name} />
          <div className="detail-grid">
            <Panel>
              <h2>About this service</h2>
              <p className="prose">
                {v.description || "No description provided."}
              </p>
              <p>Service area: {v.serviceArea || "Not specified"}</p>
              <p>Duration: {v.duration}</p>
              {v.imageUrl && <ServiceImage url={v.imageUrl} />}
            </Panel>
            <Panel>
              <small>SERVICE PRICE</small>
              <h2>{money(v.price)}</h2>
              <p>
                Final fees and total are provided when your booking is created.
              </p>
              <div className="actions">
                {hydrating ? (
                  <p role="status">Checking your account…</p>
                ) : !user || user.role === "CUSTOMER" ? (
                  <Link
                    className="button primary"
                    to={`/customer/bookings/new?serviceId=${encodeURIComponent(v.id)}`}
                  >
                    {user ? "Order Now" : "Sign in to order"}
                  </Link>
                ) : (
                  <p>Bookings require a customer account.</p>
                )}
              </div>
              <Link to={`/providers/${v.provider.id}`}>
                {v.provider.businessName} ↗
              </Link>
              <p>{v.provider.city}</p>
              <small>
                Stored provider rating: {v.provider.rating} ·{" "}
                {v.provider.totalReviews} reviews. May differ from current
                reviews.
              </small>
            </Panel>
          </div>
          <Reviews scope="service" id={v.id} />
        </>
      )}
    </Remote>
  );
}
function ServiceImage({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  return !broken && /^https?:\/\//.test(url) ? (
    <img
      className="detail-image"
      src={url}
      alt="Service"
      onError={() => setBroken(true)}
    />
  ) : (
    <p>Service image unavailable.</p>
  );
}
export function ProviderDetail() {
  const { providerId = "" } = useParams();
  const query = useApi("E10", providerId);
  return (
    <Remote query={query}>
      {(v) => (
        <>
          <Title title={v.businessName} eyebrow={v.city} />
          <Panel>
            <p>{v.bio || "No introduction provided."}</p>
            <p>{v.address}</p>
            <p>Contact person: {v.user.name}</p>
            <small>
              Stored rating: {v.rating} · {v.totalReviews} reviews. Current
              rating appears below.
            </small>
          </Panel>
          <Catalog providerId={v.id} />
          <Reviews scope="provider" id={v.id} />
        </>
      )}
    </Remote>
  );
}

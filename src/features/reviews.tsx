import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/services";
import { queryClient } from "../app/session";
import {
  Form,
  Title,
  Panel,
  Remote,
  useApi,
  Filters,
  Pagination,
  Empty,
  Confirm,
} from "../components/ui";
import * as schemas from "../contracts/forms";
import { pageFilters } from "./public";
const fields = [
  {
    name: "rating",
    type: "number",
    required: true,
    help: "Whole number from 1 to 5.",
  },
  { name: "comment", type: "textarea", nullable: true },
];
export async function refreshReviews() {
  await Promise.all(
    ["E37", "E40", "E41", "E42", "E43", "E62"].map((id) =>
      queryClient.invalidateQueries({ queryKey: [id] }),
    ),
  );
}
export function ReviewCreate({ bookingId }: { bookingId: string }) {
  const [created, setCreated] = useState(false);
  const [page, setPage] = useState(1);
  const ownReviews = useApi("E37", undefined, { page, limit: 100 });
  return (
    <Panel>
      <h2>Share your experience</h2>
      <p>
        One review per completed booking. A deleted review may still prevent
        another review.
      </p>
      <Remote query={ownReviews}>
        {(result) => {
          const existing = result.data.find(
            (review) => review.bookingId === bookingId,
          );
          if (existing)
            return (
              <>
                <p>You reviewed this booking: {existing.rating}/5.</p>
                <Link to="/customer/reviews">Manage your review →</Link>
              </>
            );
          if (result.meta.page < result.meta.totalPages)
            return (
              <>
                <p>Checking your existing reviews before creating another.</p>
                <button onClick={() => setPage(page + 1)}>
                  Check next 100 reviews
                </button>
              </>
            );
          return created ? (
            <p role="status">Your review was saved.</p>
          ) : (
            <Form
              schema={schemas.review}
              initial={{ bookingId, rating: 5 }}
              fields={[
                { name: "bookingId", hidden: true },
                ...fields.map((f) => ({ ...f, nullable: false })),
              ]}
              submit="Publish review"
              onSubmit={async (data) => {
                try {
                  await api("E36", { body: data as schemas.CreateReview });
                  setCreated(true);
                } finally {
                  await refreshReviews();
                }
              }}
            />
          );
        }}
      </Remote>
    </Panel>
  );
}
export function OwnReviews() {
  const [filter, setFilter] = useState<Record<string, unknown>>({ page: 1 }),
    [editing, setEditing] = useState<string | null>(null);
  const q = useApi("E37", undefined, filter);
  return (
    <>
      <Title title="Your reviews" />
      <Filters
        fields={[
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
                  <h2>{r.service.title}</h2>
                  <p>
                    {r.rating}/5 · {r.comment || "No comment"}
                  </p>
                  {editing === r.id ? (
                    <Form
                      schema={schemas.reviewEdit}
                      initial={{ rating: r.rating, comment: r.comment || "" }}
                      fields={fields}
                      onSubmit={async (data) => {
                        await api("E38", {
                          id: r.id,
                          body: data as schemas.PatchReview,
                        });
                        setEditing(null);
                        await refreshReviews();
                      }}
                    />
                  ) : (
                    <button onClick={() => setEditing(r.id)}>
                      Edit review
                    </button>
                  )}
                  <Confirm
                    title="Delete review"
                    onConfirm={async () => {
                      await api("E39", { id: r.id });
                      await refreshReviews();
                    }}
                  >
                    <p>
                      This hides your review. You may not be able to create
                      another review for this booking.
                    </p>
                  </Confirm>
                </Panel>
              ))
            ) : (
              <Empty>You have not written any visible reviews yet.</Empty>
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

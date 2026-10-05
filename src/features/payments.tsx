import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ApiError } from "../api/client";
import { api } from "../api/services";
import { useSession } from "../app/session";
import type { CustomerBooking } from "../api/types";
import {
  Title,
  Panel,
  Remote,
  useApi,
  Status,
  ErrorBox,
  Empty,
} from "../components/ui";
import { refreshBooking } from "./bookings";
const KEY = "servexa.checkout";
type Context = {
  bookingId: string;
  userId: string;
  sessionId?: string;
  attemptedAt: number;
};
export function checkoutContext(): Context | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return typeof v?.bookingId === "string" && typeof v?.userId === "string"
      ? v
      : null;
  } catch {
    return null;
  }
}
function saveContext(v: Context) {
  sessionStorage.setItem(KEY, JSON.stringify(v));
}
export function PaymentPanel({
  booking,
  userId,
}: {
  booking: CustomerBooking;
  userId: string;
}) {
  const q = useApi("E34", booking.id);
  const [pending, setPending] = useState(false),
    [error, setError] = useState<unknown>(null),
    [attempted, setAttempted] = useState(
      checkoutContext()?.bookingId === booking.id,
    );
  return (
    <Panel>
      <h2>Payment</h2>
      <Remote query={q}>
        {(state) => (
          <>
            <Status value={state.payment.status} />
            <p>
              Booking: {state.bookingStatus}. Currency:{" "}
              {state.currency.toUpperCase()}.
            </p>
            {state.payment.status === "PAID" ? (
              <p>Payment received. Booking status is shown above.</p>
            ) : (
              <p>
                Hosted Checkout returns here for confirmation. A return URL
                alone does not confirm payment.
              </p>
            )}
            {booking.status === "ACCEPTED" &&
              state.bookingStatus === "ACCEPTED" &&
              state.payment.status === "UNPAID" &&
              !attempted && (
                <button
                  className="primary"
                  disabled={pending}
                  onClick={async () => {
                    setPending(true);
                    setError(null);
                    try {
                      saveContext({
                        bookingId: booking.id,
                        userId,
                        attemptedAt: Date.now(),
                      });
                      setAttempted(true);
                      const result = await api("E33", { id: booking.id });
                      saveContext({
                        bookingId: booking.id,
                        userId,
                        sessionId: result.sessionId,
                        attemptedAt: Date.now(),
                      });
                      const url = new URL(result.paymentUrl);
                      if (url.protocol !== "https:")
                        throw new Error(
                          "Checkout returned an unsafe URL. Inspect payment status.",
                        );
                      window.location.assign(url.href);
                    } catch (e) {
                      setError(e);
                      await refreshBooking();
                      // Only definite pre-checkout failures can unlock a manual retry.
                      if (
                        e instanceof ApiError &&
                        [400, 403, 404, 409, 503].includes(e.status)
                      ) {
                        const current = await q.refetch();
                        if (
                          current.data?.payment.status === "UNPAID" &&
                          current.data.bookingStatus === "ACCEPTED"
                        ) {
                          sessionStorage.removeItem(KEY);
                          setAttempted(false);
                        }
                      }
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  {pending
                    ? "Opening Checkout…"
                    : "Continue to secure Checkout ↗"}
                </button>
              )}
            {(state.payment.status === "PENDING" ||
              (attempted && state.payment.status !== "PAID")) && (
              <p>
                Checkout may still be open or awaiting confirmation. Refresh
                status before taking further action. A new session is not
                automatically created.
              </p>
            )}
            <button
              disabled={q.isFetching}
              onClick={() => void refreshBooking()}
            >
              Check current status
            </button>
          </>
        )}
      </Remote>
      <ErrorBox error={error} />
    </Panel>
  );
}
export function PaymentReturn() {
  const { user } = useSession();
  const location = useLocation();
  const context = checkoutContext();
  const valid = !!context && context.userId === user?.id;
  const payment = useApi("E34", context?.bookingId, undefined, valid);
  const booking = useApi("E25", context?.bookingId, undefined, valid);
  const [checks, setChecks] = useState(0);
  useEffect(() => {
    if (
      !valid ||
      payment.error ||
      booking.error ||
      payment.data?.payment.status === "PAID" ||
      checks >= 3
    )
      return;
    const timer = window.setTimeout(() => {
      setChecks((v) => v + 1);
      void payment.refetch();
      void booking.refetch();
    }, [5000, 10000, 20000][checks]);
    return () => clearTimeout(timer);
  }, [
    valid,
    checks,
    payment.data?.payment.status,
    payment.error,
    booking.error,
  ]);
  return (
    <>
      <Title title="Check your payment status" eyebrow="CHECKOUT RETURN" />
      <Panel>
        <p>
          {location.pathname.endsWith("cancel")
            ? "You returned from Checkout. This does not cancel your payment or booking, and does not issue a refund."
            : "You returned from Checkout. We are checking the server for payment confirmation."}
        </p>
        {!valid ? (
          <Empty>
            Booking context is unavailable for this account. Open the booking
            from your history to check payment status.
          </Empty>
        ) : (
          <>
            <Remote query={payment}>
              {(v) => (
                <>
                  <Status value={v.payment.status} />
                  <p>
                    {v.payment.status === "PAID" &&
                    ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(
                      v.bookingStatus,
                    )
                      ? "Payment received and booking confirmed."
                      : v.payment.status === "PAID"
                        ? "Payment received; inspect the current booking state."
                        : v.payment.status === "FAILED"
                          ? "The server reports a failed payment. Do not open repeated Checkout sessions."
                          : v.payment.status === "PENDING"
                            ? "Awaiting payment confirmation. The webhook may still be processing."
                            : `Current payment state: ${v.payment.status}.`}
                  </p>
                </>
              )}
            </Remote>
            <Remote query={booking}>
              {(v) => (
                <p>
                  Booking status: <Status value={v.status} />
                </p>
              )}
            </Remote>
            <button
              onClick={() => {
                void payment.refetch();
                void booking.refetch();
              }}
            >
              Refresh status
            </button>
            <Link
              className="button"
              to={`/customer/bookings/${context?.bookingId}`}
            >
              Open booking →
            </Link>
            {checks >= 3 && (
              <p>Automatic checks have stopped. You can refresh manually.</p>
            )}
          </>
        )}
        <p>
          <Link to="/customer/bookings">View booking history →</Link>
        </p>
      </Panel>
    </>
  );
}

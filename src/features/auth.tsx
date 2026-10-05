import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Title, Form, Panel, Remote, useApi } from "../components/ui";
import { home, safeReturn, useSession, queryClient } from "../app/session";
import { api } from "../api/services";
import * as schemas from "../contracts/forms";
export function AuthPage({ registration = false }: { registration?: boolean }) {
  const session = useSession(),
    navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState("CUSTOMER"),
    [persist, setPersist] = useState(false);
  return (
    <div className="auth">
      <Title
        title={registration ? "Make room for a simpler day." : "Welcome back."}
        eyebrow={registration ? "JOIN SERVEXA" : "YOUR SERVEXA ACCOUNT"}
      />
      <Panel>
        {registration && (
          <label>
            Account type
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="CUSTOMER">Customer</option>
              <option value="PROVIDER">Service provider</option>
            </select>
          </label>
        )}
        <Form
          key={role}
          schema={registration ? schemas.register : schemas.login}
          initial={registration ? { role } : {}}
          fields={[
            ...(registration
              ? [
                  { name: "role", hidden: true },
                  { name: "name", required: true },
                ]
              : []),
            { name: "email", type: "email", required: true },
            { name: "password", type: "password", required: true },
            ...(registration
              ? [
                  { name: "phone", type: "tel", required: true },
                  ...(role === "PROVIDER"
                    ? [
                        { name: "businessName", required: true },
                        { name: "city", required: true },
                        { name: "address", required: true },
                        { name: "bio", type: "textarea" },
                      ]
                    : []),
                ]
              : []),
          ]}
          submit={registration ? "Create account" : "Sign in"}
          onSubmit={async (data) => {
            if (registration) {
              await api("E01", { body: data as schemas.Register });
              navigate("/login?registered=1");
            } else {
              const user = await session.login(
                String(data.email),
                String(data.password),
                persist,
              );
              navigate(safeReturn(params.get("returnTo")) || home(user.role), {
                replace: true,
              });
            }
          }}
        />
        {!registration && (
          <label className="check">
            <input
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
            />
            Keep this tab signed in after reload (session storage)
          </label>
        )}
        {!registration && (
          <small>
            Unchecked: tokens stay in memory. Tab persistence stores tokens in
            browser storage, accessible to scripts on this origin.
          </small>
        )}
        {params.has("registered") && (
          <p role="status">Account created. Sign in to continue.</p>
        )}
        <p>
          {registration ? (
            <Link to="/login">Already have an account? Sign in →</Link>
          ) : (
            <Link to="/register">New here? Create an account →</Link>
          )}
        </p>
      </Panel>
    </div>
  );
}
export function Profile() {
  const q = useApi("E06");
  const { reload } = useSession();
  return (
    <>
      <Title title="Your profile" />
      <Remote query={q}>
        {(v) => (
          <Panel>
            <p>
              {v.email} · {v.role}
            </p>
            <Form
              schema={schemas.user}
              initial={{ name: v.name, phone: v.phone }}
              fields={[
                { name: "name", required: true },
                { name: "phone", required: true },
              ]}
              onSubmit={async (data) => {
                await api("E07", { body: data });
                await queryClient.invalidateQueries({ queryKey: ["E06"] });
                await reload();
              }}
            />
          </Panel>
        )}
      </Remote>
    </>
  );
}

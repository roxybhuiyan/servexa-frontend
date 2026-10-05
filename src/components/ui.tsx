import { useState, useRef, useEffect, useId, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { api, type Endpoint, type Responses } from "../api/services";
import { ApiError } from "../api/client";
import { useSession } from "../app/session";
import type { Page } from "../api/types";
import { label, localDate } from "../lib/format";
import s from "./ui.module.css";
export function useApi<E extends Endpoint>(
  endpoint: E,
  id?: string,
  query?: Record<string, unknown>,
  enabled = true,
) {
  const { user } = useSession();
  return useQuery({
    queryKey: [endpoint, user?.id || "public", id || "", query || {}],
    queryFn: ({ signal }) => api(endpoint, { id, query, signal }),
    enabled,
  });
}
export function Title({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className={s.title}>
      <div>
        <small>{eyebrow || "SERVEXA"}</small>
        <h1>{title}</h1>
      </div>
      {children}
    </header>
  );
}
export function ErrorBox({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  if (!error) return null;
  return (
    <div role="alert" className={s.error}>
      <strong>
        {error instanceof ApiError ? `${error.status || "Connection"} · ` : ""}
        {error instanceof Error ? error.message : "Something went wrong."}
      </strong>
      {error instanceof ApiError && error.retryAfter && (
        <p>Try again in {error.retryAfter} seconds.</p>
      )}
      {retry && (
        <button type="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className={s.skeleton} role="status" aria-label="Loading">
      <span />
      <span />
      <span />
    </div>
  );
}
export function Empty({
  children = "Nothing to show yet.",
}: {
  children?: ReactNode;
}) {
  return <div className={s.empty}>{children}</div>;
}
export function Status({ value }: { value: string }) {
  return (
    <span className={s.badge} data-status={value}>
      {label(value)}
    </span>
  );
}
export function Panel({ children }: { children: ReactNode }) {
  return <section className={s.panel}>{children}</section>;
}
export function Remote<T>({
  query,
  children,
}: {
  query: {
    isPending: boolean;
    isFetching: boolean;
    error: unknown;
    data: T | undefined;
    refetch: () => unknown;
  };
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <Loading />;
  if (query.error)
    return <ErrorBox error={query.error} retry={() => void query.refetch()} />;
  if (query.data === undefined) return <Empty />;
  return (
    <>
      <span role="status" className={s.refresh}>
        {query.isFetching ? "Updating…" : ""}
      </span>
      {children(query.data)}
    </>
  );
}
export function Pagination({
  meta,
  onPage,
}: {
  meta: Page<unknown>["meta"];
  onPage: (page: number) => void;
}) {
  return (
    <nav aria-label="Pagination" className={s.pagination}>
      <span>
        {meta.total} results · Page {meta.page} of{" "}
        {Math.max(1, meta.totalPages)}
      </span>
      <button disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Previous
      </button>
      <button
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPage(meta.page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
export type Field = {
  name: string;
  label?: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  nullable?: boolean;
  help?: string;
  hidden?: boolean;
};
export function Form({
  fields,
  schema,
  initial = {},
  onSubmit,
  submit = "Save changes",
  patch = false,
}: {
  fields: Field[];
  schema: z.ZodType;
  initial?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>;
  submit?: string;
  patch?: boolean;
}) {
  const formId = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<Record<string, unknown>>({ defaultValues: initial });
  const [failure, setFailure] = useState<unknown>(null),
    [saved, setSaved] = useState(false);
  return (
    <form
      className={s.form}
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFailure(null);
        setSaved(false);
        const data: Record<string, unknown> = {};
        for (const f of fields) {
          if (patch && !dirtyFields[f.name]) continue;
          let v = values[f.name];
          if (f.type === "number") v = v === "" ? undefined : Number(v);
          if (f.type === "datetime-local" && v) {
            const d = new Date(String(v));
            v = isNaN(d.getTime()) ? v : d.toISOString();
          }
          if (v === "") v = f.nullable ? null : f.required ? "" : undefined;
          if (v !== undefined) data[f.name] = v;
        }
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
          for (const issue of parsed.error.issues)
            setError(String(issue.path[0] || "root"), {
              message: issue.message,
            });
          return;
        }
        try {
          await onSubmit(parsed.data as Record<string, unknown>);
          setSaved(true);
        } catch (e) {
          setFailure(e);
          if (e instanceof ApiError)
            for (const field of e.errors)
              setError(field.path.replace(/^body\./, ""), {
                message: field.message,
              });
        }
      })}
    >
      {fields.map((f) => (
        <label key={f.name} hidden={f.hidden}>
          {f.label || label(f.name)}
          {f.required ? " *" : ""}
          {f.type === "textarea" ? (
            <textarea
              {...register(f.name)}
              aria-label={f.label || label(f.name) + (f.required ? " *" : "")}
              aria-invalid={!!errors[f.name]}
              aria-describedby={
                errors[f.name] ? `${formId}-${f.name}-error` : undefined
              }
              rows={4}
            />
          ) : f.options ? (
            <select
              {...register(f.name)}
              aria-label={f.label || label(f.name) + (f.required ? " *" : "")}
              aria-invalid={!!errors[f.name]}
              aria-describedby={
                errors[f.name] ? `${formId}-${f.name}-error` : undefined
              }
            >
              <option value="">Select…</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              {...register(f.name)}
              aria-label={f.label || label(f.name) + (f.required ? " *" : "")}
              type={f.hidden ? "hidden" : f.type || "text"}
              step={f.type === "number" ? "any" : undefined}
              autoComplete={
                f.name === "password" ? "current-password" : undefined
              }
              aria-invalid={!!errors[f.name]}
              aria-describedby={
                errors[f.name] ? `${formId}-${f.name}-error` : undefined
              }
            />
          )}
          {f.help && <small>{f.help}</small>}
          {errors[f.name] && (
            <span id={`${formId}-${f.name}-error`} className={s.fieldError}>
              {String(errors[f.name]?.message)}
            </span>
          )}
        </label>
      ))}
      {errors.root && <p role="alert">{String(errors.root.message)}</p>}
      <ErrorBox error={failure} />
      {saved && <p role="status">Saved successfully.</p>}
      <button className="primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submit}
      </button>
    </form>
  );
}
export function Confirm({
  title,
  children,
  onConfirm,
  disabled = false,
}: {
  title: string;
  children?: ReactNode;
  onConfirm: () => Promise<unknown>;
  disabled?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  return (
    <>
      <button
        disabled={disabled}
        onClick={() => {
          setError(null);
          dialog.current?.showModal();
        }}
      >
        {title}
      </button>
      <dialog ref={dialog}>
        <h2>{title}?</h2>
        {children}
        <ErrorBox error={error} />
        <div className="actions">
          <button disabled={busy} onClick={() => dialog.current?.close()}>
            Keep unchanged
          </button>
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                dialog.current?.close();
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : "Confirm"}
          </button>
        </div>
      </dialog>
    </>
  );
}
export type Filter = {
  name: string;
  options?: string[];
  type?: string;
  label?: string;
};
export function Filters({
  fields,
  value,
  onChange,
}: {
  fields: Filter[];
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <form
      className={s.filters}
      onSubmit={(e) => {
        e.preventDefault();
        const v = { ...draft, page: 1 };
        for (const f of fields)
          if (f.type === "datetime-local" && v[f.name as keyof typeof v])
            Object.assign(v, {
              [f.name]: new Date(
                String(v[f.name as keyof typeof v]),
              ).toISOString(),
            });
        onChange(v);
      }}
    >
      {fields.map((f) => (
        <label key={f.name}>
          {f.label || label(f.name)}
          {f.options ? (
            <select
              value={String(draft[f.name] || "")}
              onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
            >
              <option value="">All</option>
              {f.options.map((x) => (
                <option key={x} value={x}>
                  {label(x)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type || "text"}
              value={
                f.type === "datetime-local" && draft[f.name]
                  ? /[zZ]|[+-]\d{2}:\d{2}$/.test(String(draft[f.name]))
                    ? localDate(String(draft[f.name]))
                    : String(draft[f.name]).slice(0, 16)
                  : String(draft[f.name] || "")
              }
              onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
            />
          )}
        </label>
      ))}
      <button className="primary">Apply filters</button>
      <button
        type="button"
        onClick={() => {
          setDraft({});
          onChange({ page: 1 });
        }}
      >
        Reset
      </button>
    </form>
  );
}
export function Json({ value }: { value: unknown }) {
  return <pre className={s.json}>{JSON.stringify(value, null, 2)}</pre>;
}
export function Metrics({ value }: { value: unknown }) {
  if (Array.isArray(value))
    return (
      <div className="grid">
        {value.map((v, i) => (
          <Panel key={i}>
            <Metrics value={v} />
          </Panel>
        ))}
      </div>
    );
  if (value && typeof value === "object")
    return (
      <dl className={s.metrics}>
        {Object.entries(value).map(([key, v]) => (
          <div key={key}>
            <dt>{label(key)}</dt>
            <dd>
              {typeof v === "object" ? <Metrics value={v} /> : String(v ?? "—")}
            </dd>
          </div>
        ))}
      </dl>
    );
  return <span>{String(value ?? "—")}</span>;
}

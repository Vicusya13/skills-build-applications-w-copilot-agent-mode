export function Loading({ label }: { label: string }) {
  return (
    <p role="status" className="text-muted">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      Loading {label}…
    </p>
  );
}

export function ErrorAlert({ label, message }: { label: string; message: string }) {
  return (
    <div role="alert" className="alert alert-danger">
      Unable to load {label}. The API returned an error ({message}). Please try again later.
    </div>
  );
}

export function EmptyState({ children }: { children: string }) {
  return <p className="text-muted fst-italic">{children}</p>;
}

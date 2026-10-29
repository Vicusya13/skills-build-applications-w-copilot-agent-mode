import { useState, type FormEvent } from 'react';
import { getJson } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { EmptyState, ErrorAlert, Loading } from './StatusMessages.js';

type Suggestion = { _id?: string; title: string; focus?: string; minutes?: number; difficulty?: string; reason: string };

const DEFAULT_EMAIL = 'mona@example.com';

export default function Workouts() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [draft, setDraft] = useState(DEFAULT_EMAIL);
  const state = useApi(
    () => getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`),
    email,
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (draft.trim()) setEmail(draft.trim());
  }

  return (
    <section aria-labelledby="workouts-heading">
      <h2 id="workouts-heading" className="h4">Workout suggestions</h2>
      <p>Recommend workouts from activity patterns.</p>
      <form className="row g-2 mb-3" onSubmit={onSubmit}>
        <div className="col-auto">
          <label htmlFor="workout-email" className="visually-hidden">Student email</label>
          <input id="workout-email" type="email" className="form-control" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">Get suggestions</button>
        </div>
      </form>
      {state.status === 'loading' && <Loading label="workout suggestions" />}
      {state.status === 'error' && <ErrorAlert label="workout suggestions" message={state.message} />}
      {state.status === 'success' &&
        (state.data.suggestions.length === 0 ? (
          <EmptyState>No workout suggestions yet for this student.</EmptyState>
        ) : (
          <div className="row g-3">
            {state.data.suggestions.map((suggestion, index) => (
              <div key={suggestion._id ?? index} className="col-md-6">
                <article className="card h-100">
                  <div className="card-body">
                    <h3 className="h5 card-title">{suggestion.title}</h3>
                    {suggestion.focus && (
                      <p className="mb-1 text-muted">
                        {suggestion.focus}
                        {suggestion.minutes ? ` · ${suggestion.minutes} min` : ''}
                        {suggestion.difficulty ? ` · ${suggestion.difficulty}` : ''}
                      </p>
                    )}
                    <p className="card-text">{suggestion.reason}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        ))}
    </section>
  );
}

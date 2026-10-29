import { getJson } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { EmptyState, ErrorAlert, Loading } from './StatusMessages.js';

type Team = { _id?: string; name: string; mascot?: string; members: unknown[] };

export default function Teams() {
  const state = useApi(() => getJson<{ teams: Team[] }>('/api/teams'), 'teams');

  return (
    <section aria-labelledby="teams-heading">
      <h2 id="teams-heading" className="h4">Teams</h2>
      <p>Manage teams and members.</p>
      {state.status === 'loading' && <Loading label="teams" />}
      {state.status === 'error' && <ErrorAlert label="teams" message={state.message} />}
      {state.status === 'success' &&
        (state.data.teams.length === 0 ? (
          <EmptyState>No teams have been created yet.</EmptyState>
        ) : (
          <ul className="list-group">
            {state.data.teams.map((team, index) => (
              <li key={team._id ?? index} className="list-group-item d-flex justify-content-between align-items-center">
                <span>
                  <strong>{team.name}</strong>
                  {team.mascot && <span className="text-muted"> · mascot {team.mascot}</span>}
                </span>
                <span className="badge text-bg-primary rounded-pill">
                  {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}

import { getJson } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { EmptyState, ErrorAlert, Loading } from './StatusMessages.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const state = useApi(() => getJson<{ leaderboard: Entry[] }>('/api/leaderboard'), 'leaderboard');

  return (
    <section aria-labelledby="leaderboard-heading">
      <h2 id="leaderboard-heading" className="h4">Leaderboard</h2>
      <p>Compare team point totals.</p>
      {state.status === 'loading' && <Loading label="the leaderboard" />}
      {state.status === 'error' && <ErrorAlert label="the leaderboard" message={state.message} />}
      {state.status === 'success' &&
        (state.data.leaderboard.length === 0 ? (
          <EmptyState>No leaderboard rankings yet — log an activity to get on the board.</EmptyState>
        ) : (
          <table className="table">
            <caption>Teams ranked by total points</caption>
            <thead>
              <tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Total points</th></tr>
            </thead>
            <tbody>
              {state.data.leaderboard.map((entry) => (
                <tr key={entry.teamName}>
                  <td>{entry.rank}</td>
                  <td>{entry.teamName}</td>
                  <td>{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </section>
  );
}

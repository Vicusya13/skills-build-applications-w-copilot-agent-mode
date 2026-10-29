import { getJson } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { EmptyState, ErrorAlert, Loading } from './StatusMessages.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };

export default function Activities() {
  const state = useApi(() => getJson<{ activities: Activity[] }>('/api/activities'), 'activities');

  return (
    <section aria-labelledby="activities-heading">
      <h2 id="activities-heading" className="h4">Activities</h2>
      <p>Track student activity minutes and points.</p>
      {state.status === 'loading' && <Loading label="activities" />}
      {state.status === 'error' && <ErrorAlert label="activities" message={state.message} />}
      {state.status === 'success' &&
        (state.data.activities.length === 0 ? (
          <EmptyState>No activities logged yet.</EmptyState>
        ) : (
          <table className="table table-striped">
            <caption>Logged activities</caption>
            <thead>
              <tr><th scope="col">Type</th><th scope="col">Minutes</th><th scope="col">Points</th><th scope="col">Date</th></tr>
            </thead>
            <tbody>
              {state.data.activities.map((activity, index) => (
                <tr key={activity._id ?? index}>
                  <td className="text-capitalize">{activity.type}</td>
                  <td>{activity.minutes}</td>
                  <td>{activity.points}</td>
                  <td>{activity.occurredAt ? new Date(activity.occurredAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </section>
  );
}

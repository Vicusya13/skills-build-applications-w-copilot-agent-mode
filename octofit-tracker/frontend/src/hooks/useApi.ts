import { useEffect, useState } from 'react';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

/** Runs a loader whenever `key` changes and tracks loading / error / success state. */
export function useApi<T>(loader: () => Promise<T>, key: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    loader()
      .then((data) => active && setState({ status: 'success', data }))
      .catch((error: unknown) =>
        active && setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }),
      );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

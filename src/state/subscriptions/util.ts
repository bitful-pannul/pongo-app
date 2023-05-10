export interface SubParams { app: string; path: string, event: (data: any) => void; err: () => void; quit: () => void }

export function createSubscription(
  app: string,
  path: string,
  e: (data: any) => void
): SubParams {
  const request = {
    app,
    path,
    event: e,
    err: () => null,
    quit: () => {
      throw new Error('subscription clogged');
    },
  };
  // TODO: err, quit handling (resubscribe?)
  return request;
}

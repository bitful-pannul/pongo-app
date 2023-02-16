import create, { SetState } from 'zustand';
import { useCallback, useEffect, useState } from 'react';
import _, { omit, pick } from 'lodash';
import {
  Allies,
  Charge,
  ChargeUpdateInitial,
  scryAllies,
  scryAllyTreaties,
  scryCharges,
  scryDefaultAlly,
  Treaty,
  Docket,
  Treaties,
  AllyUpdateIni,
  AllyUpdateNew,
  TreatyUpdateIni,
  TreatyUpdate,
  docketInstall,
  ChargeUpdate,
  kilnRevive,
  kilnSuspend,
  allyShip,
} from '@urbit/api';
import Urbit from '../api';
import { DefaultStore } from './types/types';
import { resetSubscriptions } from './util';
import { ONE_SECOND } from '../util/time';

declare global {
  var api: Urbit;
}

export type Status = 'initial' | 'loading' | 'success' | 'error';

export interface ChargeWithDesk extends Charge {
  desk: string;
}

export interface ChargesWithDesks {
  [ref: string]: ChargeWithDesk;
}

export interface DocketWithDesk extends Docket {
  desk: string;
}

interface DocketState extends DefaultStore {
  charges: ChargesWithDesks;
  treaties: Treaties;
  allies: Allies;
  defaultAlly: string | null;
  subscriptions: number[];
  api: null | Urbit;
  init: (api: Urbit) => Promise<void>;
  fetchCharges: () => Promise<void>;
  fetchDefaultAlly: () => Promise<void>;
  requestTreaty: (ship: string, desk: string) => Promise<Treaty>;
  fetchAllies: () => Promise<Allies>;
  fetchAllyTreaties: (ally: string) => Promise<Treaties>;
  toggleDocket: (desk: string) => Promise<void>;
  installDocket: (ship: string, desk: string) => Promise<void>;
  uninstallDocket: (desk: string) => Promise<number | void>;
  addAlly: (ship: string) => Promise<void>;
  hasDesk: (desk: string) => boolean;
  set: SetState<DocketState>;
}

const useDocketState = create<DocketState>((set, get) => ({
  charges: {},
  treaties: {},
  allies: {},
  defaultAlly: null,
  subscriptions: [],
  api: null,
  init: async (api: Urbit) => {
    get().fetchCharges()

    resetSubscriptions(set, api, get().subscriptions, [
      api.subscribe({
        app: 'docket',
        path: '/charges',
        event: (data: ChargeUpdate) => {
          set((state) => {
            if ('add-charge' in data) {
              const { desk, charge } = data['add-charge'];
              return addCharge(state, desk, charge);
            }
      
            if ('del-charge' in data) {
              const desk = data['del-charge'];
              return delCharge(state, desk);
            }
      
            return { charges: state.charges };
          });
        },
      }),
      api.subscribe({
        app: 'treaty',
        path: '/treaties',
        event: (data: TreatyUpdate) => {
          set((draft) => {
            if ('add' in data) {
              const { ship, desk } = data.add;
              const treaty = normalizeDocket(data.add, desk);
              draft.treaties[`${ship}/${desk}`] = treaty;
            }
      
            if ('ini' in data) {
              const treaties = normalizeDockets(data.ini);
              draft.treaties = { ...draft.treaties, ...treaties };
            }
          });
        },
      }),
      api.subscribe({
        app: 'treaty',
        path: '/allies',
        event: (data: AllyUpdateNew) => {
          set((draft) => {
            if ('new' in data) {
              const { ship, alliance } = data.new;
              draft.allies[ship] = alliance;
            }
          });
        },
      })
    ])
  },
  fetchDefaultAlly: async () => {
    const defaultAlly = await global.api.scry<string>(scryDefaultAlly);
    set({ defaultAlly });
  },
  fetchCharges: async () => {
    const charg = (await global.api.scry<ChargeUpdateInitial>(scryCharges)).initial;

    const charges = Object.entries(charg).reduce(
      (obj: ChargesWithDesks, [key, value]) => {
        // eslint-disable-next-line no-param-reassign
        obj[key] = normalizeDocket(value as ChargeWithDesk, key);
        return obj;
      },
      {}
    );

    set({ charges });
  },
  clearSubscriptions: async () => {
    const { api, subscriptions } = get()
    if (api && subscriptions.length) {
      resetSubscriptions(set, api, subscriptions, [])
    }
  },
  fetchAllies: async () => {
    const allies = (await global.api.scry<AllyUpdateIni>(scryAllies)).ini;
    set({ allies });
    return allies;
  },
  fetchAllyTreaties: async (ally: string) => {
    let treaties = (await global.api.scry<TreatyUpdateIni>(scryAllyTreaties(ally)))
      .ini;
    treaties = normalizeDockets(treaties);
    set((s) => ({ treaties: { ...s.treaties, ...treaties } }));
    return treaties;
  },
  requestTreaty: async (ship: string, desk: string) => {
    const { treaties }: any = get();
    const key = `${ship}/${desk}`;
    if (key in treaties) {
      return treaties[key];
    }

    const result = await global.api.subscribeOnce<Docket>('treaty', `/treaty/${key}`, 20000);
    const treaty = { ...normalizeDocket(result, desk), ship };
    set({ treaties: { ...treaties, [key]: treaty } });

    return treaty;
  },
  installDocket: async (ship: string, desk: string) => {
    const treaty = get().treaties[`${ship}/${desk}`];
    if (!treaty) {
      throw new Error('Bad install');
    }
    set((state) =>
      addCharge(state, desk, { ...treaty, chad: { install: null } })
    );

    await global.api.poke(docketInstall(ship, desk));
  },
  uninstallDocket: async (desk: string) => {
    set((state) => delCharge(state, desk));
    await global.api.poke({
      app: 'docket',
      mark: 'docket-uninstall',
      json: desk,
    });
  },
  toggleDocket: async (desk: string) => {
    const { charges } = get();
    const charge = charges[desk];
    if (!charge) {
      return;
    }
    const suspended = 'suspend' in charge.chad;
    if (suspended) {
      await global.api.poke(kilnRevive(desk));
    } else {
      await global.api.poke(kilnSuspend(desk));
    }
  },
  addAlly: async (ship) => {
    set((draft) => {
      draft.allies[ship] = [];
    });

    await global.api.poke(allyShip(ship));
  },
  hasDesk: (desk: string) => Boolean(Object.values(get().charges).find(c => c.desk === desk)),
  set,
}));

function normalizeDocket<T extends Docket>(docket: T, desk: string): T {
  return {
    ...docket,
    desk,
    color: normalizeUrbitColor(docket.color),
  };
}

function normalizeDockets<T extends Docket>(
  dockets: Record<string, T>
): Record<string, T> {
  return Object.entries(dockets).reduce(
    (obj: Record<string, T>, [key, value]) => {
      const [, desk] = key.split('/');
      // eslint-disable-next-line no-param-reassign
      obj[key] = normalizeDocket(value, desk);
      return obj;
    },
    {}
  );
}

function addCharge(state: DocketState, desk: string, charge: Charge) {
  return {
    charges: {
      ...state.charges,
      [desk]: normalizeDocket(charge as ChargeWithDesk, desk),
    },
  };
}

function delCharge(state: DocketState, desk: string) {
  return { charges: omit(state.charges, desk) };
}

const selCharges = (s: DocketState) => s.charges;

export function useCharges() {
  return useDocketState(selCharges);
}

export function useCharge(desk: string) {
  return useDocketState(useCallback((state) => state.charges[desk], [desk]));
}

const selRequest = (s: DocketState) => s.requestTreaty;
export function useRequestDocket() {
  return useDocketState(selRequest);
}

const selAllies = (s: DocketState) => s.allies;
export function useAllies() {
  return useDocketState(selAllies);
}

export function useAllyTreaties(ship: string) {
  const allies = useAllies();
  const isAllied = ship in allies;
  const [status, setStatus] = useState<Status>('initial');
  const [treaties, setTreaties] = useState<Treaties>();

  useEffect(() => {
    if (Object.keys(allies).length > 0 && !isAllied) {
      setStatus('loading');
      useDocketState.getState().addAlly(ship);
    }
  }, [allies, isAllied, ship]);

  useEffect(() => {
    async function fetchTreaties() {
      if (isAllied) {
        setStatus('loading');
        try {
          const newTreaties = await useDocketState
            .getState()
            .fetchAllyTreaties(ship);

          if (Object.keys(newTreaties).length > 0) {
            setTreaties(newTreaties);
            setStatus('success');
          }
        } catch {
          setStatus('error');
        }
      }
    }

    fetchTreaties();
  }, [ship, isAllied]);

  const storeTreaties = useDocketState(
    useCallback(
      (s) => {
        const charter = s.allies[ship];
        return pick(s.treaties, ...(charter || []));
      },
      [ship]
    )
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStatus('error');
    }, 30 * ONE_SECOND); // wait 30 secs before timing out

    if (Object.keys(storeTreaties).length > 0) {
      setTreaties(storeTreaties);
      setStatus('success');
      clearTimeout(timeout);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [storeTreaties]);

  return {
    isAllied,
    treaties,
    status,
  };
}

export function useTreaty(host: string, desk: string) {
  return useDocketState(
    useCallback(
      (s) => {
        const ref = `${host}/${desk}`;
        return s.treaties[ref];
      },
      [host, desk]
    )
  );
}

export function allyForTreaty(ship: string, desk: string) {
  const ref = `${ship}/${desk}`;
  const { allies } = useDocketState.getState();
  const ally = Object.entries(allies).find(([, allied]) =>
    allied.includes(ref)
  )?.[0];
  return ally;
}

export function normalizeUrbitColor(color: string): string {
  if (color.startsWith('#')) {
    return color;
  }
  
  const colorString = color.slice(2).replace('.', '').toUpperCase();
  const lengthAdjustedColor = _.padEnd(colorString, 6, _.last(colorString));
  return `#${lengthAdjustedColor}`;
}

export default useDocketState;


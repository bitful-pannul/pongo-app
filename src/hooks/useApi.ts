import React, { useCallback, useEffect, useState } from 'react';
import useStore from '../state/useStore';
// import useLaunchState from '../state/launch';
// import useStorageState from '../state/storage';

export const RESOURCE_REGEX = /\/resource\/[a-z]*?\/ship\//;

export const useApi = () => {
  const { ship, api } = useStore();

  const bootstrap = useCallback(async (reset = false) => {
    if (api) {
      if (reset) {
        api.reset();
      }
    
      // const subs = [
      //   useContactState,
      //   useSettingsState,
      //   useStorageState,
      //   useLaunchState,
      // ].map(state => state.getState().initialize(api));
    
      // try {
      //   await Promise.all(subs);
      //   useSettingsState.getState().getAll();
      //   // gcpManager.start();
        
      //   const {
      //     getKeys,
      //     getShallowChildren
      //   } = useGraphState.getState();
        
      //   useHarkState.getState().getUnreads();
      //   // getKeys();
      //   getShallowChildren(ship, 'dm-inbox');
      // } catch (err) {
      // }
    }
  }, [api, ship]);

  return { api, bootstrap }
}

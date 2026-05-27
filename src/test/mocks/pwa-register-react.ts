export function useRegisterSW() {
  return {
    needRefresh: [false] as [boolean],
    offlineReady: [false] as [boolean],
    updateServiceWorker: async () => undefined
  };
}

const AsyncStorage = {
  async getItem(key: string) {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  async setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(key, value); } catch {}
  },
  async removeItem(key: string) {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(key); } catch {}
  },
};
export default AsyncStorage;

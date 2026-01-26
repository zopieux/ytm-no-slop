import {
  STORAGE_KEY_KEYWORDS,
  STORAGE_KEY_ARTISTS,
  STORAGE_KEY_SONGS,
  STORAGE_KEY_AI_DB,
  STORAGE_KEY_AUTO_SKIP,
} from '@/utils/constants';

const mockData = {
  [STORAGE_KEY_KEYWORDS]: ['slowed reverb', 'nightcore', 'AI cover', 'tiktok remix'],
  [STORAGE_KEY_ARTISTS]: [{ name: 'Fake Drake' }, { name: 'AI Kanye' }, { name: 'Ghostwriter' }],
  [STORAGE_KEY_SONGS]: [],
  [STORAGE_KEY_AI_DB]: Array.from({ length: 960 }, (_, i) => ({ name: `A${i}` })),
  [STORAGE_KEY_AUTO_SKIP]: true,
};

const listeners = new Map();

(window as any).storage = {
  getItem: async (key: string) => {
    return (mockData as any)[key] || null;
  },
  setItem: async (key: string, value: any) => {
    (mockData as any)[key] = value;
    if (listeners.has(key)) {
      listeners.get(key)(value);
    }
  },
  watch: (key: string, callback: Function) => {
    listeners.set(key, callback);
    return () => listeners.delete(key);
  },
};

(window as any).browser = {
  runtime: {
    sendMessage: async (msg: any) => {
      console.log('Mock sendMessage:', msg);
      return Promise.resolve();
    },
  },
};

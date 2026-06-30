/* eslint-disable @typescript-eslint/no-explicit-any */

function getStore<T>(table: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(`bimo_${table}`) || "[]");
  } catch {
    return [];
  }
}

function setStore<T>(table: string, data: T[]) {
  localStorage.setItem(`bimo_${table}`, JSON.stringify(data));
}

function newId(): string {
  return crypto.randomUUID();
}
function now(): string {
  return new Date().toISOString();
}

function makeOps(table: string) {
  return {
    async select() {
      return { data: getStore<any>(table), error: null };
    },
    async insert(row: any) {
      const all = getStore<any>(table);
      const newRow = { ...row, id: newId(), created_at: now() };
      all.push(newRow);
      setStore(table, all);
      return { data: newRow, error: null };
    },
    update(updates: any) {
      const all = getStore<any>(table);
      return {
        async eq(_column: string, value: any) {
          const idx = all.findIndex((r: any) => r.id === value);
          if (idx !== -1) all[idx] = { ...all[idx], ...updates };
          setStore(table, all);
          return { data: null, error: null };
        },
      };
    },
    delete() {
      const all = getStore<any>(table);
      return {
        async eq(_column: string, value: any) {
          setStore(table, all.filter((r: any) => r.id !== value));
          return { data: null, error: null };
        },
      };
    },
  };
}

function makeUpsertOps(table: string, uniqueKey: string) {
  return {
    async select() {
      return { data: getStore<any>(table), error: null };
    },
    async upsert(row: any) {
      const all = getStore<any>(table);
      const idx = all.findIndex((r: any) => r[uniqueKey] === row[uniqueKey]);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...row };
      } else {
        all.push({ ...row, id: newId(), created_at: now() });
      }
      setStore(table, all);
      return { data: null, error: null };
    },
  };
}

export const localDb = {
  from(table: string) {
    return makeOps(table);
  },

  fromUpsert(table: string, uniqueKey: string) {
    return makeUpsertOps(table, uniqueKey);
  },

  async getProfile() {
    try {
      return JSON.parse(localStorage.getItem("bimo_profile") || "null");
    } catch {
      return null;
    }
  },

  async saveProfile(profile: any) {
    localStorage.setItem("bimo_profile", JSON.stringify(profile));
  },
};

import type { SellerScenario } from "../domain/types";
import { sellerScenarioSchema } from "../domain/schemas";

const STORAGE_KEY = "seller-recovery-radar:scenarios";

let memoryStore: SellerScenario[] = [];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getStorage = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    const probe = `${STORAGE_KEY}:probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);

    return window.localStorage;
  } catch {
    return null;
  }
};

const parseScenarios = (raw: string | null) => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    const result = sellerScenarioSchema.array().safeParse(parsed);

    return result.success ? result.data : [];
  } catch {
    return [];
  }
};

const read = () => {
  const storage = getStorage();

  if (!storage) {
    return clone(memoryStore);
  }

  return parseScenarios(storage.getItem(STORAGE_KEY));
};

const write = (scenarios: SellerScenario[]) => {
  const storage = getStorage();
  const cloned = clone(scenarios);

  if (!storage) {
    memoryStore = cloned;
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(cloned));
  } catch {
    memoryStore = cloned;
  }
};

export const localScenarioRepository = {
  getAll() {
    return read();
  },

  getById(id: string) {
    return read().find((scenario) => scenario.id === id) ?? null;
  },

  save(scenario: SellerScenario) {
    const scenarios = read();
    const next = [scenario, ...scenarios.filter((item) => item.id !== scenario.id)];
    write(next);
    return clone(scenario);
  },

  remove(id: string) {
    write(read().filter((scenario) => scenario.id !== id));
  },

  clear() {
    write([]);
  },
};

export { STORAGE_KEY };

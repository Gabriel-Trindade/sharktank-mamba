import { analyzeScenario } from "../domain/analysis";
import { saveScenarioInputSchema, sellerScenarioSchema } from "../domain/schemas";
import type { AnalysisResult, SellerScenario } from "../domain/types";
import { demoScenario } from "../mocks/demoScenario";
import { localScenarioRepository } from "./localScenarioRepository";

export type SaveScenarioInput = Omit<SellerScenario, "id" | "createdAt">;

const sleep = (ms = 250) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const fakeApi = {
  async loadDemoScenario(): Promise<SellerScenario> {
    await sleep();
    const scenario = clone(demoScenario);
    localScenarioRepository.save(scenario);
    return scenario;
  },

  async saveScenario(input: SaveScenarioInput): Promise<SellerScenario> {
    await sleep();
    const parsed = saveScenarioInputSchema.parse(input);
    const scenario = sellerScenarioSchema.parse({
      ...parsed,
      id: createId(),
      createdAt: new Date().toISOString(),
    });

    return localScenarioRepository.save(scenario);
  },

  async getScenario(id: string): Promise<SellerScenario | null> {
    await sleep(120);
    return localScenarioRepository.getById(id);
  },

  async updateScenario(id: string, patch: Partial<SellerScenario>): Promise<SellerScenario> {
    await sleep();
    const current = localScenarioRepository.getById(id);

    if (!current) {
      throw new Error("Cenário não encontrado");
    }

    const scenario = sellerScenarioSchema.parse({
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
    });

    return localScenarioRepository.save(scenario);
  },

  async runAnalysis(id: string): Promise<AnalysisResult> {
    await sleep();
    const scenario = localScenarioRepository.getById(id);

    if (!scenario) {
      throw new Error("Cenário não encontrado");
    }

    return analyzeScenario(scenario);
  },

  async clearScenario(id: string): Promise<void> {
    await sleep(120);
    localScenarioRepository.remove(id);
  },

  async clearAll(): Promise<void> {
    await sleep(120);
    localScenarioRepository.clear();
  },
};

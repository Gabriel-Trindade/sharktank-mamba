import { beforeEach, describe, expect, it } from "vitest";
import { demoScenario } from "../mocks/demoScenario";
import { fakeApi } from "./fakeApi";
import { localScenarioRepository, STORAGE_KEY } from "./localScenarioRepository";

describe("localScenarioRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
    localScenarioRepository.clear();
  });

  it("saves, reads and removes scenarios", () => {
    localScenarioRepository.save(demoScenario);

    expect(localScenarioRepository.getById(demoScenario.id)?.name).toBe(demoScenario.name);
    expect(localScenarioRepository.getAll()).toHaveLength(1);

    localScenarioRepository.remove(demoScenario.id);

    expect(localScenarioRepository.getById(demoScenario.id)).toBeNull();
  });

  it("handles invalid JSON without throwing", () => {
    window.localStorage.setItem(STORAGE_KEY, "{invalid");

    expect(localScenarioRepository.getAll()).toEqual([]);
  });
});

describe("fakeApi", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await fakeApi.clearAll();
  });

  it("loads demo scenario", async () => {
    const scenario = await fakeApi.loadDemoScenario();

    expect(scenario.id).toBe(demoScenario.id);
    expect(scenario.products.length).toBeGreaterThan(0);
  });

  it("runs analysis for saved demo scenario", async () => {
    const scenario = await fakeApi.loadDemoScenario();
    const result = await fakeApi.runAnalysis(scenario.id);

    expect(result.overview.salesDropPct).toBeGreaterThan(0);
    expect(result.products.length).toBe(scenario.products.length);
    expect(result.recoveryPlan.length).toBeGreaterThan(0);
  });
});

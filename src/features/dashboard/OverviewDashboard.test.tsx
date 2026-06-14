import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { analyzeScenario } from "../../domain/analysis";
import { demoScenario } from "../../mocks/demoScenario";
import { OverviewDashboard } from "./OverviewDashboard";

describe("OverviewDashboard", () => {
  it("renders the main KPI cards and insights", () => {
    const result = analyzeScenario(demoScenario);
    render(<OverviewDashboard scenario={demoScenario} result={result} />);

    expect(screen.getByText("Vendas 30d")).toBeInTheDocument();
    expect(screen.getByText(/Caminho até/i)).toBeInTheDocument();
    expect(screen.getByText("Dependência Ads")).toBeInTheDocument();
    expect(screen.getByText("Leitura automática")).toBeInTheDocument();
  });
});

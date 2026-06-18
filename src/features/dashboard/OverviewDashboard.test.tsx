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

  it("descreve a meta separando total de pedidos do ritmo diário (sem 'equivalente a X pedidos')", () => {
    const result = analyzeScenario(demoScenario);
    render(<OverviewDashboard scenario={demoScenario} result={result} />);

    const pacingParagraph = screen.getByText(
      (_, element) =>
        element?.tagName === "P" && /pedidos\/dia/.test(element.textContent ?? ""),
    );

    // Mostra o total de pedidos e o ritmo diário como coisas distintas.
    expect(pacingParagraph.textContent).toMatch(/fechar o gap/i);
    expect(pacingParagraph.textContent).toMatch(/por dia/i);
    // Não deve mais equiparar o ritmo diário ao total de pedidos.
    expect(pacingParagraph.textContent).not.toMatch(/equivalente a/i);
  });

  it("mostra 'Alta' (não 'Queda') quando as vendas cresceram vs. período anterior", () => {
    const growthScenario = {
      ...demoScenario,
      account: { ...demoScenario.account, vendas30d: 20000, vendasPeriodoAnterior: 10000 },
    };
    const result = analyzeScenario(growthScenario);
    render(<OverviewDashboard scenario={growthScenario} result={result} />);

    expect(screen.getByText(/Alta .* vs\. período de referência/i)).toBeInTheDocument();
    expect(screen.queryByText(/Queda .* vs\. período de referência/i)).not.toBeInTheDocument();
  });

  it("mostra o card de Descontos Shopee quando há vendas sem desconto informadas", () => {
    const result = analyzeScenario(demoScenario);
    render(<OverviewDashboard scenario={demoScenario} result={result} />);

    expect(screen.getByText("Descontos Shopee")).toBeInTheDocument();
  });
});

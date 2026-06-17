import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Card } from "./components/ui/Card";
import { SectionHeader } from "./components/ui/SectionHeader";
import { saveScenarioInputSchema } from "./domain/schemas";
import type { AnalysisResult, SellerScenario } from "./domain/types";
import type { MarketBenchmarkFromGecko } from "./domain/market/geckoTypes";
import { normalizeCategoryKey } from "./domain/market/categoryKey";
import { DiagnosticDashboard } from "./features/dashboard/DiagnosticDashboard";
import { AccountMetricsForm } from "./features/inputs/AccountMetricsForm";
import { AdsMetricsForm } from "./features/inputs/AdsMetricsForm";
import { MarketForm } from "./features/inputs/MarketForm";
import { PromotionForm } from "./features/inputs/PromotionForm";
import { ScenarioConfigForm } from "./features/inputs/ScenarioConfigForm";
import { TrafficForm } from "./features/inputs/TrafficForm";
import { ProductUpload } from "./features/upload/ProductUpload";
import { fakeApi, type SaveScenarioInput } from "./services/fakeApi";
import { AppShell } from "./app/AppShell";
import {
  appSections,
  createEmptyScenarioDraft,
  scenarioToDraft,
  toPresentationDraft,
  type AppSectionId,
} from "./app/app-state";

type Theme = "light" | "dark";

const sectionCopy: Record<AppSectionId, { title: string; description: string }> = {
  produtos: {
    title: "Produtos",
    description: "Carregue a planilha de produtos e confira se os dados foram lidos.",
  },
  conta: {
    title: "Conta",
    description: "Preencha vendas, pedidos, cancelamentos e conversão da conta.",
  },
  trafego: {
    title: "Tráfego",
    description: "Separe vendas por canal para medir dependência de Ads e apoio orgânico.",
  },
  ads: {
    title: "Ads",
    description: "Informe entrega, cliques, pedidos, receita e investimento em Shopee Ads.",
  },
  promocoes: {
    title: "Promoções",
    description: "Configure descontos, resultado promocional e os limites do cenário (meta, margem, TACOS).",
  },
  mercado: {
    title: "Mercado",
    description: "Confira os dados do seller por categoria e busque o benchmark na Shopee via GeckoAPI.",
  },
  diagnostico: {
    title: "Diagnóstico",
    description: "KPIs, gargalos, curva A, mercado e plano de recuperação.",
  },
};

function App() {
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const [activeSection, setActiveSection] = useState<AppSectionId>("produtos");
  const [draft, setDraft] = useState<SaveScenarioInput>(() => createEmptyScenarioDraft());
  const [scenario, setScenario] = useState<SellerScenario | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [geckoInsights, setGeckoInsights] = useState<Record<string, MarketBenchmarkFromGecko>>({});
  const [isBusy, setIsBusy] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("seller-recovery-radar:theme", theme);
    } catch {
      // Prefer keeping the UI usable when browser storage is blocked.
    }
  }, [theme]);

  const currentCopy = sectionCopy[activeSection];
  const activeSectionIndex = appSections.findIndex((section) => section.id === activeSection);
  const completedSections = useMemo(() => getCompletedSections(draft, analysis), [analysis, draft]);

  const headerDetail = useMemo(() => {
    if (!analysis) {
      return currentCopy.description;
    }

    return `${currentCopy.description} Cenário ativo: ${scenario?.name ?? draft.name}.`;
  }, [analysis, currentCopy.description, draft.name, scenario?.name]);

  const loadDemo = async () => {
    setIsBusy(true);
    setMessages([]);

    try {
      const demo = await fakeApi.loadDemoScenario();
      // Apresentação: carrega o cenário mas começa em Produtos, sem gerar o
      // diagnóstico ainda — o apresentador percorre as abas uma a uma e busca
      // o benchmark de mercado ao vivo antes de gerar o diagnóstico.
      setScenario(demo);
      setDraft(toPresentationDraft(demo));
      setAnalysis(null);
      setGeckoInsights({});
      setActiveSection("produtos");
    } catch (error) {
      setMessages([readError(error)]);
    } finally {
      setIsBusy(false);
    }
  };

  const clearAnalysis = async () => {
    setIsBusy(true);
    setMessages([]);

    try {
      await fakeApi.clearAll();
      setScenario(null);
      setAnalysis(null);
      setGeckoInsights({});
      setDraft(createEmptyScenarioDraft());
      setActiveSection("produtos");
    } catch (error) {
      setMessages([readError(error)]);
    } finally {
      setIsBusy(false);
    }
  };

  const runAnalysis = async () => {
    setIsBusy(true);
    setMessages([]);

    try {
      if (draft.products.length === 0) {
        throw new Error("Carregue ao menos um produto antes de gerar o diagnóstico.");
      }

      // Descontos têm fonte única na seção de Promoções; o cenário reaproveita.
      const draftToSave: SaveScenarioInput = {
        ...draft,
        config: {
          ...draft.config,
          descontoAtualPct: draft.promotion.descontoAtualPct,
          descontoMaximoPct: draft.promotion.descontoMaximoPct,
        },
      };
      const parsed = saveScenarioInputSchema.parse(draftToSave);
      const savedScenario = scenario
        ? await fakeApi.updateScenario(scenario.id, parsed)
        : await fakeApi.saveScenario(parsed);
      const result = await fakeApi.runAnalysis(savedScenario.id);
      setScenario(savedScenario);
      setDraft(scenarioToDraft(savedScenario));
      setAnalysis(result);
      setActiveSection("diagnostico");
    } catch (error) {
      setMessages(readValidationErrors(error));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AppShell
      sections={appSections}
      activeSection={activeSection}
      completedSections={completedSections}
      onSectionChange={setActiveSection}
      theme={theme}
      onThemeToggle={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
      onLoadDemo={loadDemo}
      onClear={clearAnalysis}
      onRunAnalysis={runAnalysis}
      isBusy={isBusy}
    >
      <div className="page-stack">
        <SectionHeader
          eyebrow={`Passo ${activeSectionIndex + 1} de ${appSections.length}`}
          title={currentCopy.title}
          description={headerDetail}
        />

        {messages.length > 0 ? (
          <Card title="Ajustes necessários">
            <ul className="compact-list">
              {messages.map((message) => (
                <li key={message} className="muted">
                  {message}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {activeSection === "produtos" ? (
          <ProductUpload
            products={draft.products}
            onProductsParsed={(products) => setDraft((current) => ({ ...current, products }))}
          />
        ) : null}

        {activeSection === "conta" ? (
          <AccountMetricsForm value={draft.account} onChange={(account) => setDraft((current) => ({ ...current, account }))} />
        ) : null}

        {activeSection === "trafego" ? (
          <TrafficForm value={draft.traffic} onChange={(traffic) => setDraft((current) => ({ ...current, traffic }))} />
        ) : null}

        {activeSection === "ads" ? (
          <AdsMetricsForm value={draft.ads} onChange={(ads) => setDraft((current) => ({ ...current, ads }))} />
        ) : null}

        {activeSection === "promocoes" ? (
          <div className="section-stack">
            <PromotionForm
              value={draft.promotion}
              onChange={(promotion) => setDraft((current) => ({ ...current, promotion }))}
            />
            <ScenarioConfigForm value={draft.config} onChange={(config) => setDraft((current) => ({ ...current, config }))} />
          </div>
        ) : null}

        {activeSection === "mercado" ? (
          <MarketForm
            value={draft.market}
            onChange={(market) => setDraft((current) => ({ ...current, market }))}
            onGeckoInsight={(categoria, insight) =>
              setGeckoInsights((current) => ({ ...current, [normalizeCategoryKey(categoria)]: insight }))
            }
          />
        ) : null}

        {activeSection === "diagnostico" ? (
          scenario && analysis ? (
            <DiagnosticDashboard scenario={scenario} result={analysis} geckoInsights={geckoInsights} />
          ) : (
            <Card
              title="Diagnóstico ainda não gerado"
              description="Carregue o demo ou preencha os dados e clique em Gerar diagnóstico."
            />
          )
        ) : null}
      </div>
    </AppShell>
  );
}

const readTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    return window.localStorage.getItem("seller-recovery-radar:theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const readError = (error: unknown) => (error instanceof Error ? error.message : "Erro inesperado.");

const readValidationErrors = (error: unknown) => {
  if (error instanceof z.ZodError) {
    return error.issues.slice(0, 6).map((issue) => {
      const section = validationSectionLabels[String(issue.path[0])] ?? "Dados do cenário";
      const message = issue.message.startsWith("Invalid input")
        ? "preencha um valor válido."
        : issue.message;

      return `${section}: ${message}`;
    });
  }

  return [readError(error)];
};

const validationSectionLabels: Record<string, string> = {
  name: "Nome do cenário",
  products: "Produtos",
  account: "Conta",
  traffic: "Tráfego",
  ads: "Ads",
  promotion: "Promoções",
  market: "Mercado",
  config: "Configurações",
};

const getCompletedSections = (draft: SaveScenarioInput, analysis: AnalysisResult | null): AppSectionId[] => {
  const completed: AppSectionId[] = [];

  if (draft.products.length > 0) {
    completed.push("produtos");
  }

  if (draft.account.vendas30d > 0 && draft.account.pedidos30d > 0 && draft.account.visitantes > 0) {
    completed.push("conta");
  }

  if (draft.traffic.vendasTotais > 0) {
    completed.push("trafego");
  }

  if (draft.ads.impressoes > 0 && draft.ads.cliques > 0 && draft.ads.investimentoAds > 0) {
    completed.push("ads");
  }

  if (draft.promotion.nome.trim() && draft.promotion.vendasPromocao > 0 && draft.config.metaFaturamento > 0) {
    completed.push("promocoes");
  }

  if (draft.market.length > 0) {
    completed.push("mercado");
  }

  if (analysis) {
    completed.push("diagnostico");
  }

  return completed;
};

export default App;

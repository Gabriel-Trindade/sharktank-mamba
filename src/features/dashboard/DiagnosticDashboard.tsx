import { useState } from "react";
import { Tabs, type TabItem } from "../../components/ui/Tabs";
import type { AnalysisResult, SellerScenario } from "../../domain/types";
import type { MarketBenchmarkFromGecko } from "../../domain/market/geckoTypes";
import { AdsChannelsSection } from "./AdsChannelsSection";
import { MarketSection } from "./MarketSection";
import { OverviewDashboard } from "./OverviewDashboard";
import { ProductCurveSection } from "./ProductCurveSection";
import { RecoveryPlanSection } from "./RecoveryPlanSection";

type DiagnosticTab = "resumo" | "produtos" | "mercado" | "ads" | "plano";

const TABS: TabItem<DiagnosticTab>[] = [
  { value: "resumo", label: "Resumo" },
  { value: "produtos", label: "Produtos" },
  { value: "mercado", label: "Mercado" },
  { value: "ads", label: "Ads" },
  { value: "plano", label: "Plano" },
];

type DiagnosticDashboardProps = {
  scenario: SellerScenario;
  result: AnalysisResult;
  geckoInsights?: Record<string, MarketBenchmarkFromGecko>;
};

export const DiagnosticDashboard = ({ scenario, result, geckoInsights }: DiagnosticDashboardProps) => {
  const [activeTab, setActiveTab] = useState<DiagnosticTab>("resumo");

  return (
    <div className="section-stack">
      <Tabs items={TABS} value={activeTab} onChange={setActiveTab} />
      {activeTab === "resumo" && <OverviewDashboard scenario={scenario} result={result} />}
      {activeTab === "produtos" && <ProductCurveSection products={result.products} />}
      {activeTab === "mercado" && <MarketSection market={result.market} geckoInsights={geckoInsights} />}
      {activeTab === "ads" && <AdsChannelsSection scenario={scenario} result={result} />}
      {activeTab === "plano" && <RecoveryPlanSection actions={result.recoveryPlan} />}
    </div>
  );
};

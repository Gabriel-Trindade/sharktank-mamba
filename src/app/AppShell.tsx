import { BarChart3, Database, Play, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../components/ui/Button";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import type { AppSection, AppSectionId } from "./app-state";

type StepState = "complete" | "active" | "next" | "pending" | "final";

type AppShellProps = {
  sections: AppSection[];
  activeSection: AppSectionId;
  completedSections: AppSectionId[];
  onSectionChange: (section: AppSectionId) => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onLoadDemo: () => void;
  onClear: () => void;
  onRunAnalysis: () => void;
  isBusy: boolean;
  children: ReactNode;
};

export const AppShell = ({
  sections,
  activeSection,
  completedSections,
  onSectionChange,
  theme,
  onThemeToggle,
  onLoadDemo,
  onClear,
  onRunAnalysis,
  isBusy,
  children,
}: AppShellProps) => {
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeSection),
  );
  const finalIndex = sections.length - 1;
  const completedSet = new Set(completedSections);
  const completedInputSteps = sections
    .slice(0, finalIndex)
    .filter((section) => completedSet.has(section.id)).length;

  const getStepState = (section: AppSection, index: number): StepState => {
    if (section.id === activeSection) {
      return "active";
    }

    if (completedSet.has(section.id)) {
      return "complete";
    }

    if (index === finalIndex) {
      return "final";
    }

    if (index === activeIndex + 1) {
      return "next";
    }

    return "pending";
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-brand-mark">
            <BarChart3 size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="app-brand-title">Seller Recovery Radar</p>
            <p className="app-brand-subtitle">Diagnóstico e caminho até a meta</p>
          </div>
        </div>
        <div className="app-header-actions">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <Button icon={<Database size={17} />} onClick={onLoadDemo} disabled={isBusy}>
            Carregar demo
          </Button>
          <Button icon={<Trash2 size={17} />} variant="danger" onClick={onClear} disabled={isBusy}>
            Limpar análise
          </Button>
          <Button icon={<Play size={17} />} variant="primary" onClick={onRunAnalysis} disabled={isBusy}>
            Gerar diagnóstico
          </Button>
        </div>
      </header>

      <aside className="app-sidebar">
        <nav className="stepper" aria-label="Etapas do diagnóstico">
          <div className="stepper-summary">
            <span className="stepper-kicker">Fluxo de diagnóstico</span>
            <strong>
              Passo {activeIndex + 1} de {sections.length}
            </strong>
            <p>
              {completedInputSteps} de {finalIndex} etapas de entrada concluídas. O diagnóstico é o
              último passo.
            </p>
          </div>

          <div className="stepper-list">
            {sections.map((section, index) => {
              const stepState = getStepState(section, index);
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`step-button step-button-${stepState} ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${index + 1}. ${section.label}: ${stepStateLabels[stepState]}`}
                  onClick={() => onSectionChange(section.id)}
                >
                  <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="step-copy">
                    <span className="step-state">{stepStateLabels[stepState]}</span>
                    <span className="step-name">{section.label}</span>
                    <span className="step-description">{section.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
};

const stepStateLabels: Record<StepState, string> = {
  complete: "Concluído",
  active: "Etapa atual",
  next: "Próximo passo",
  pending: "Pendente",
  final: "Último passo",
};

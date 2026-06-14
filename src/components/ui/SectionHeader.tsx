import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export const SectionHeader = ({ eyebrow, title, description, actions }: SectionHeaderProps) => (
  <header className="section-header">
    <div>
      {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
    {actions ? <div className="section-actions">{actions}</div> : null}
  </header>
);

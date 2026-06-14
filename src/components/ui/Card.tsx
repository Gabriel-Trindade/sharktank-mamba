import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export const Card = ({ className, title, description, actions, children, ...props }: CardProps) => (
  <section className={clsx("ui-card", className)} {...props}>
    {title || description || actions ? (
      <header className="ui-card-header">
        <div>
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="ui-card-actions">{actions}</div> : null}
      </header>
    ) : null}
    {children}
  </section>
);

import { Badge } from "../../components/ui/Badge";
import { formatCurrency, formatInteger } from "../../domain/formatters";
import type { GeckoCompetitor } from "../../domain/market/geckoTypes";

type CompetitorPreviewListProps = {
  items: GeckoCompetitor[];
};

export const CompetitorPreviewList = ({ items }: CompetitorPreviewListProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="gecko-competitor-list">
      {items.map((item, index) => (
        <li className="gecko-competitor" key={`${item.url ?? item.name}-${index}`}>
          {item.thumbnail ? (
            <img className="gecko-competitor-thumb" src={item.thumbnail} alt="" loading="lazy" />
          ) : (
            <span className="gecko-competitor-thumb gecko-competitor-thumb-empty" aria-hidden />
          )}

          <div className="gecko-competitor-body">
            <strong className="gecko-competitor-name">{item.name}</strong>
            <span className="muted gecko-competitor-seller">{item.sellerName ?? "Vendedor não informado"}</span>
            <div className="badge-row">
              {item.freeShipping ? <Badge tone="info">Frete grátis</Badge> : null}
              {item.sponsored ? <Badge tone="warning">Patrocinado</Badge> : null}
            </div>
          </div>

          <div className="gecko-competitor-metrics">
            <strong>{item.price !== null ? formatCurrency(item.price) : "—"}</strong>
            <span className="muted">
              {item.soldCount !== null ? `${formatInteger(item.soldCount)} vendidos` : "vendas n/d"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

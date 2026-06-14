import { useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { FileDropzone } from "../../components/ui/FileDropzone";
import { MetricCard } from "../../components/ui/MetricCard";
import { formatCurrency, formatInteger } from "../../domain/formatters";
import type { ProductRow } from "../../domain/types";
import { parseProductsXlsx, type ParseProductsResult } from "./parse-products-xlsx";
import { downloadProductsTemplate } from "./product-template";

type UploadStatus = "empty" | "dragging" | "parsing" | "valid" | "invalid";

type ProductUploadProps = {
  products: ProductRow[];
  onProductsParsed: (products: ProductRow[]) => void;
};

const productColumns: DataTableColumn<ProductRow>[] = [
  {
    key: "produto",
    header: "Produto",
    render: (row) => (
      <div>
        <strong>{row.produto}</strong>
        <div className="muted">{row.sku}</div>
      </div>
    ),
  },
  { key: "categoria", header: "Categoria", render: (row) => row.categoria },
  { key: "unidades", header: "Unid.", align: "right", render: (row) => formatInteger(row.unidadesVendidas30d) },
  { key: "gmv", header: "GMV", align: "right", render: (row) => formatCurrency(row.gmv30d) },
  { key: "ads", header: "Ads", render: (row) => <Badge>{row.adsStatus ?? "desconhecido"}</Badge> },
];

export const ProductUpload = ({ products, onProductsParsed }: ProductUploadProps) => {
  const [status, setStatus] = useState<UploadStatus>(products.length > 0 ? "valid" : "empty");
  const [result, setResult] = useState<ParseProductsResult | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const parseFile = async (file: File) => {
    setStatus("parsing");

    try {
      const parseResult = await parseProductsXlsx(file);
      const valid = parseResult.products.length > 0 && parseResult.missingColumns.length === 0;
      setResult(parseResult);
      setStatus(valid ? "valid" : "invalid");

      if (valid) {
        onProductsParsed(parseResult.products);
      }
    } catch (error) {
      setResult({
        products: [],
        recognizedColumns: [],
        missingColumns: [],
        ignoredRows: 0,
        totalRows: 0,
        gmvIdentified: 0,
        errors: [error instanceof Error ? error.message : "Não foi possível ler a planilha."],
      });
      setStatus("invalid");
    }
  };

  const downloadTemplate = async () => {
    setTemplateError(null);

    try {
      await downloadProductsTemplate();
    } catch {
      setTemplateError("Não foi possível gerar o modelo agora. Tente novamente.");
    }
  };

  const shownProducts = result?.products.length ? result.products : products;
  const ignoredRowsDetail = result
    ? result.missingColumns.length
      ? "Há colunas faltantes"
      : result.ignoredRows > 0
        ? "Revise as linhas listadas"
        : "Todas as linhas foram lidas"
    : "Aguardando upload";

  return (
    <div className="section-stack">
      <Card
        title="Modelo da planilha"
        description="Baixe um arquivo de exemplo com a aba produtos, colunas esperadas e linhas preenchidas."
        actions={
          <Button icon={<Download size={17} />} onClick={downloadTemplate}>
            Baixar modelo XLSX
          </Button>
        }
      >
        {templateError ? <p className="muted">{templateError}</p> : null}
      </Card>

      <FileDropzone
        status={status}
        onFile={parseFile}
        onDraggingChange={(dragging) => {
          if (status === "parsing") {
            return;
          }
          setStatus(dragging ? "dragging" : result?.products.length || products.length ? "valid" : "empty");
        }}
      />

      <div className="dashboard-grid">
        <MetricCard
          label="Produtos encontrados"
          value={formatInteger(result?.products.length ?? products.length)}
          detail={`${formatInteger(result?.totalRows ?? products.length)} linhas lidas`}
          tone={shownProducts.length > 0 ? "success" : "neutral"}
        />
        <MetricCard
          label="Colunas reconhecidas"
          value={formatInteger(result?.recognizedColumns.length ?? 0)}
          detail={result?.recognizedColumns.slice(0, 4).join(", ") || "Aguardando upload"}
          tone="info"
        />
        <MetricCard
          label="Linhas ignoradas"
          value={formatInteger(result?.ignoredRows ?? 0)}
          detail={ignoredRowsDetail}
          tone={(result?.ignoredRows ?? 0) > 0 || (result?.missingColumns.length ?? 0) > 0 ? "warning" : "success"}
        />
        <MetricCard
          label="GMV identificado"
          value={formatCurrency(result?.gmvIdentified ?? products.reduce((sum, product) => sum + product.gmv30d, 0))}
          detail="Soma dos produtos válidos"
        />
      </div>

      {result?.missingColumns.length ? (
        <Card title="Colunas faltantes">
          <div className="badge-row">
            {result.missingColumns.map((column) => (
              <Badge key={column} tone="danger">
                {column}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}

      {result?.errors.length ? (
        <Card title="Feedback da importação">
          <ul className="compact-list">
            {result.errors.slice(0, 6).map((error) => (
              <li key={error} className="muted">
                {error}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Produtos importados" description="A mesma base alimenta curva A, score, insights e plano.">
        <DataTable columns={productColumns} rows={shownProducts.slice(0, 8)} getRowKey={(row) => row.sku} />
      </Card>
    </div>
  );
};

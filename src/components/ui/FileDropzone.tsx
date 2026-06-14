import type { DragEvent, InputHTMLAttributes } from "react";
import { UploadCloud } from "lucide-react";
import clsx from "clsx";

type FileDropzoneProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  status: "empty" | "dragging" | "parsing" | "valid" | "invalid";
  onFile: (file: File) => void;
  onDraggingChange?: (dragging: boolean) => void;
};

export const FileDropzone = ({
  status,
  onFile,
  onDraggingChange,
  className,
  ...props
}: FileDropzoneProps) => {
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onDraggingChange?.(false);
    const file = event.dataTransfer.files.item(0);

    if (file) {
      onFile(file);
    }
  };

  return (
    <label
      className={clsx("file-dropzone", `file-dropzone-${status}`, className)}
      onDragOver={(event) => {
        event.preventDefault();
        onDraggingChange?.(true);
      }}
      onDragLeave={() => onDraggingChange?.(false)}
      onDrop={handleDrop}
    >
      <UploadCloud size={30} aria-hidden="true" />
      <span className="file-dropzone-title">Solte a planilha .xlsx ou selecione um arquivo</span>
      <span className="file-dropzone-subtitle">Use a aba produtos do modelo ou uma planilha com as mesmas colunas.</span>
      <input
        {...props}
        type="file"
        accept=".xlsx"
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) {
            onFile(file);
          }
        }}
      />
    </label>
  );
};

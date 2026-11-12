import { useState, type DragEvent, type Ref } from "react";
import { Link } from "react-router";
import {
  Banner,
  Button,
  Icon,
  IconButton,
  Modal,
} from "../../../components/ui";
import { useMenuImportFlow } from "../hooks";
import { MenuPreviewResult } from "./MenuPreviewResult";

function fileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// The Upload Menu/Food Rotation panel of the Admin Calendar (Figma 268:11404, D7).
// Figma lists PDF and DOCX too; the importer reads only the DSWD Excel file, so
// the text says .xlsx (DEC-045). Choose a file, preview, then confirm.
// `inputRef` lets the page's Upload Document button open the file chooser.
export function MenuUploadPanel({
  inputRef,
}: {
  inputRef?: Ref<HTMLInputElement>;
}) {
  const flow = useMenuImportFlow();
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    flow.chooseFile(event.dataTransfer.files[0] ?? null);
  }

  return (
    <section
      aria-labelledby="menu-upload-title"
      className="rounded-card border border-border-subtle bg-surface p-4 shadow-panel"
    >
      <h2
        id="menu-upload-title"
        className="flex items-center gap-2 text-15 font-semibold text-danger-text"
      >
        <Icon name="upload" size={20} />
        Upload Menu/Food Rotation
      </h2>
      <p className="mt-1 text-12">
        Upload the DSWD Excel file (.xlsx, 5 MB or smaller) containing the
        menu/food rotation.
      </p>

      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={handleDrop}
        className={`mt-3 flex min-h-11 cursor-pointer flex-col items-center gap-1 rounded-control border border-dashed p-4 text-center text-12 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-text ${
          dragging
            ? "border-border bg-accent-soft"
            : "border-border-subtle bg-header"
        }`}
      >
        <Icon name="file-text" size={24} />
        Drag and drop your file here or click to browse
        <input
          key={flow.inputKey}
          ref={inputRef}
          type="file"
          accept=".xlsx"
          aria-label="Choose the DSWD Excel file"
          className="sr-only"
          onChange={(event) => {
            flow.chooseFile(event.target.files?.[0] ?? null);
          }}
        />
      </label>

      {flow.file !== null && (
        <div className="mt-3">
          <p className="text-12 font-medium">Selected File</p>
          <div
            data-testid="selected-file"
            className="mt-1 flex items-center gap-2 rounded-control border border-border-subtle px-2"
          >
            <Icon name="file-text" size={16} />
            <span className="min-w-0 flex-1 truncate text-12">
              {flow.file.name}
            </span>
            <span className="shrink-0 text-11 text-text-secondary">
              {fileSize(flow.file.size)}
            </span>
            <IconButton
              icon="x"
              label="Remove the file"
              onClick={() => {
                flow.chooseFile(null);
              }}
            />
          </div>
        </div>
      )}

      {flow.error !== null && (
        <div className="mt-3">
          <Banner tone="danger">{flow.error}</Banner>
        </div>
      )}

      <Button
        variant="accent"
        icon="upload"
        className="mt-3 w-full"
        disabled={flow.file === null}
        loading={flow.previewing}
        onClick={flow.upload}
      >
        Upload &amp; Process
      </Button>
      <p className="mt-2 text-11 text-text-secondary">
        The system will extract the menu for each day and display it on the
        calendar. Nothing is saved until you confirm.
      </p>
      <p className="mt-1">
        <Link
          to="/menu-imports"
          className="inline-flex min-h-11 items-center text-12 text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          View import history
        </Link>
      </p>

      {flow.preview !== null && (
        <Modal open wide onClose={flow.closePreview} title="Check this file">
          <MenuPreviewResult
            preview={flow.preview}
            confirming={flow.confirming}
            onConfirm={flow.confirm}
          />
        </Modal>
      )}
    </section>
  );
}

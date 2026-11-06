import type { MenuPreview } from "@ricportal/shared";
import { useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Pagination,
  Table,
} from "../../../components/ui";
import { useMenuBatches, useMenuConfirm, useMenuPreview } from "../hooks";

function PreviewResult({
  preview,
  onConfirm,
  confirming,
}: {
  preview: MenuPreview;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const warnings = [
    ...preview.warnings,
    ...preview.batches.flatMap((batch) =>
      batch.warnings.map((text) => `${batch.sheetName}: ${text}`),
    ),
  ];
  return (
    <Card>
      <h2 className="mb-2 text-18 font-semibold">{preview.fileName}</h2>
      {preview.batches.length > 0 && (
        <Table
          caption="Sheets found in the file"
          rows={preview.batches}
          rowKey={(row) => row.sheetName}
          columns={[
            { key: "sheet", header: "Sheet", render: (row) => row.sheetName },
            { key: "pr", header: "PR No.", render: (row) => row.prNo },
            { key: "date", header: "PR date", render: (row) => row.prDate },
            {
              key: "period",
              header: "Period",
              render: (row) => `${row.periodStart} to ${row.periodEnd}`,
            },
            {
              key: "days",
              header: "Days",
              align: "right",
              render: (row) => String(row.days),
            },
          ]}
        />
      )}
      <div className="mt-3 flex flex-col gap-2">
        {preview.errors.length > 0 && (
          <Banner tone="danger" title="This file cannot be imported">
            <ul className="list-disc pl-4">
              {preview.errors.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </Banner>
        )}
        {preview.overlaps.length > 0 && (
          <Banner tone="warning" title="These dates already have a menu">
            {preview.overlaps.length} date(s) overlap, from{" "}
            {preview.overlaps[0]} to {preview.overlaps.at(-1)}. Remove them from
            the file and upload it again.
          </Banner>
        )}
        {warnings.length > 0 && (
          <Banner tone="warning" title="Please check">
            <ul className="list-disc pl-4">
              {warnings.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </Banner>
        )}
      </div>
      {preview.token !== null && (
        <div className="mt-3">
          <Button loading={confirming} onClick={onConfirm}>
            Confirm import
          </Button>
        </div>
      )}
    </Card>
  );
}

// Admin: upload the DSWD Excel file, preview it, confirm it (P4-T10).
export function MenuImportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<MenuPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewMutation = useMenuPreview();
  const confirmMutation = useMenuConfirm();
  const batches = useMenuBatches(page);
  const toast = useToast();

  return (
    <>
      <PageHeader
        title="Menu Imports"
        description="Upload the DSWD food rotation file. One file serves all centers."
      />
      <div className="mb-4 flex max-w-lg flex-col gap-3">
        <FormField
          label="DSWD Excel file"
          hint="An .xlsx file of 5 MB or smaller. Nothing is saved until you confirm."
        >
          {(field) => (
            <Input
              {...field}
              key={inputKey}
              type="file"
              accept=".xlsx"
              className="py-2"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
                setError(null);
              }}
            />
          )}
        </FormField>
        {error !== null && <Banner tone="danger">{error}</Banner>}
        <div>
          <Button
            icon="upload"
            disabled={file === null}
            loading={previewMutation.isPending}
            onClick={() => {
              if (file === null) return;
              setError(null);
              previewMutation.mutate(file, {
                onSuccess: setPreview,
                onError: (failure) => {
                  setPreview(null);
                  setError(
                    failure.message === "Some fields are not valid."
                      ? "Choose an Excel file ending in .xlsx."
                      : failure.message,
                  );
                },
              });
            }}
          >
            Upload and preview
          </Button>
        </div>
      </div>

      {preview !== null && (
        <div className="mb-6">
          <PreviewResult
            preview={preview}
            confirming={confirmMutation.isPending}
            onConfirm={() => {
              if (preview.token === null) return;
              confirmMutation.mutate(preview.token, {
                onSuccess: (result) => {
                  toast.show({
                    kind: "success",
                    message: `Imported ${String(result.days)} feeding days from ${String(result.batches)} sheet(s).`,
                  });
                  setPreview(null);
                  setFile(null);
                  setInputKey((key) => key + 1);
                },
                onError: (failure) => {
                  setPreview(null);
                  setError(failure.message);
                },
              });
            }}
          />
        </div>
      )}

      <h2 className="mb-2 text-18 font-semibold">History</h2>
      <QueryBoundary
        query={batches}
        errorTitle="Could not load the import history."
      >
        {batches.data?.data.length === 0 ? (
          <EmptyState title="No DSWD file has been imported yet." />
        ) : (
          <>
            <Table
              caption="Imported batches"
              rows={batches.data?.data ?? []}
              rowKey={(row) => row.id}
              columns={[
                { key: "pr", header: "PR No.", render: (row) => row.prNo },
                {
                  key: "period",
                  header: "Period",
                  render: (row) => `${row.periodStart} to ${row.periodEnd}`,
                },
                {
                  key: "days",
                  header: "Days",
                  align: "right",
                  render: (row) => String(row.days),
                },
                { key: "file", header: "File", render: (row) => row.fileName },
                {
                  key: "sheet",
                  header: "Sheet",
                  render: (row) => row.sheetName,
                },
              ]}
            />
            <Pagination
              page={batches.data?.meta.page ?? page}
              pageSize={batches.data?.meta.pageSize ?? 20}
              total={batches.data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryBoundary>
    </>
  );
}

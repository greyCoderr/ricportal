import { useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  Banner,
  Button,
  EmptyState,
  FormField,
  Input,
  Pagination,
  Table,
} from "../../../components/ui";
import { formatDate } from "../../../lib/format";
import { MenuPreviewResult } from "../components/MenuPreviewResult";
import { useMenuBatches, useMenuImportFlow } from "../hooks";

// Admin: upload the DSWD Excel file, preview it, confirm it (P4-T10).
export function MenuImportsPage() {
  const flow = useMenuImportFlow();
  const [page, setPage] = useState(1);
  const batches = useMenuBatches(page);

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
              key={flow.inputKey}
              type="file"
              accept=".xlsx"
              className="py-2"
              onChange={(event) => {
                flow.chooseFile(event.target.files?.[0] ?? null);
              }}
            />
          )}
        </FormField>
        {flow.error !== null && <Banner tone="danger">{flow.error}</Banner>}
        <div>
          <Button
            icon="upload"
            disabled={flow.file === null}
            loading={flow.previewing}
            onClick={flow.upload}
          >
            Upload and preview
          </Button>
        </div>
      </div>

      {flow.preview !== null && (
        <div className="mb-6">
          <MenuPreviewResult
            preview={flow.preview}
            confirming={flow.confirming}
            onConfirm={flow.confirm}
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
              cardsOnPhone
              caption="Imported batches"
              rows={batches.data?.data ?? []}
              rowKey={(row) => row.id}
              columns={[
                { key: "pr", header: "PR No.", render: (row) => row.prNo },
                {
                  key: "period",
                  header: "Period",
                  render: (row) =>
                    `${formatDate(row.periodStart)} to ${formatDate(row.periodEnd)}`,
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

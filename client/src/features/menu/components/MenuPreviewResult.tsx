import type { MenuPreview } from "@ricportal/shared";
import { Banner, Button, Card, Table } from "../../../components/ui";
import { formatDate } from "../../../lib/format";

export function MenuPreviewResult({
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
            {
              key: "date",
              header: "PR date",
              render: (row) => formatDate(row.prDate),
            },
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
            {formatDate(preview.overlaps[0] ?? "")} to{" "}
            {formatDate(preview.overlaps.at(-1) ?? "")}. Remove them from the
            file and upload it again.
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

import { centerPatchSchema, type CenterDto } from "@ricportal/shared";
import { useState } from "react";
import { z } from "zod";
import { TextField } from "../../../components/form/fields";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  Badge,
  Banner,
  Button,
  Checkbox,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Table,
} from "../../../components/ui";
import { useZodForm } from "../../../lib/use-zod-form";
import { useCenters, useCreateCenter, useUpdateCenter } from "../hooks";

const centerFormSchema = centerPatchSchema.extend({
  name: z.string().trim().min(2, "Enter the center name.").max(120),
});

function CenterForm({
  center,
  onClose,
}: {
  center: CenterDto | null;
  onClose: () => void;
}) {
  const create = useCreateCenter();
  const update = useUpdateCenter();
  const [isActive, setIsActive] = useState(center?.isActive ?? true);
  const form = useZodForm(centerFormSchema, {
    name: center?.name ?? "",
    barangay: center?.barangay ?? "",
    address: center?.address ?? "",
  });
  const busy = create.isPending || update.isPending;

  const submit = form.handleSubmit((data) => {
    const handlers = {
      onSuccess: onClose,
      onError: (error: unknown) => {
        form.applyError(error);
      },
    };
    if (center === null) {
      create.mutate(data, handlers);
    } else {
      update.mutate({ id: center.id, patch: { ...data, isActive } }, handlers);
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={center === null ? "Add a center" : `Edit ${center.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="center-form" loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <form
        id="center-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        <TextField form={form} name="name" label="Center name" required />
        <TextField form={form} name="barangay" label="Barangay" />
        <TextField form={form} name="address" label="Address" />
        {center !== null && (
          <Checkbox
            label="This center is active"
            checked={isActive}
            onChange={(event) => {
              setIsActive(event.target.checked);
            }}
          />
        )}
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

export function CentersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CenterDto | "new" | null>(null);
  const centers = useCenters({ q: search.trim(), page });

  return (
    <>
      <PageHeader
        title="RIC Children Centers"
        description="The centers of the Municipal Rural Improvement Club."
        actions={
          <Button
            icon="plus"
            onClick={() => {
              setEditing("new");
            }}
          >
            Add center
          </Button>
        }
      />
      <div className="mb-3 max-w-sm">
        <Input
          aria-label="Search centers"
          placeholder="Search by name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>
      <QueryBoundary query={centers} errorTitle="Could not load the centers.">
        {centers.data?.data.length === 0 ? (
          <EmptyState
            title={
              search.trim() === ""
                ? "No centers yet."
                : `No center matches "${search.trim()}".`
            }
          />
        ) : (
          <>
            <Table
              caption="RIC Children Centers"
              rows={centers.data?.data ?? []}
              rowKey={(row) => row.id}
              columns={[
                { key: "name", header: "Center", render: (row) => row.name },
                {
                  key: "barangay",
                  header: "Barangay",
                  render: (row) => row.barangay ?? "",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) =>
                    row.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="warning">Inactive</Badge>
                    ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (row) => (
                    <Button
                      variant="secondary"
                      aria-label={`Edit ${row.name}`}
                      onClick={() => {
                        setEditing(row);
                      }}
                    >
                      Edit
                    </Button>
                  ),
                },
              ]}
            />
            <Pagination
              page={centers.data?.meta.page ?? page}
              pageSize={centers.data?.meta.pageSize ?? 20}
              total={centers.data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryBoundary>
      {editing !== null && (
        <CenterForm
          center={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

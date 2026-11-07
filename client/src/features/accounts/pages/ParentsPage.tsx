import type { ParentDto, UserStatus } from "@ricportal/shared";
import { useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FormField,
  Pagination,
  Select,
  Table,
} from "../../../components/ui";
import { useCurrentUser } from "../../auth/components/guards";
import type { ParentAction } from "../api";
import { AccountStatusBadge } from "../components/StatusBadges";
import { useMoveParent, useParents, useResetParentPassword } from "../hooks";

const FILTERS: { value: UserStatus; label: string; empty: string }[] = [
  {
    value: "PENDING",
    label: "Waiting for approval",
    empty: "No parents are waiting for approval at",
  },
  { value: "ACTIVE", label: "Active", empty: "No active parents yet at" },
  { value: "DECLINED", label: "Declined", empty: "No declined requests at" },
  { value: "DISABLED", label: "Disabled", empty: "No disabled parents at" },
];

const ACTIONS: Record<UserStatus, { action: ParentAction; label: string }[]> = {
  PENDING: [
    { action: "approve", label: "Approve" },
    { action: "decline", label: "Decline" },
  ],
  ACTIVE: [{ action: "disable", label: "Disable" }],
  DECLINED: [{ action: "enable", label: "Enable" }],
  DISABLED: [{ action: "enable", label: "Enable" }],
};

export function ParentsPage() {
  const user = useCurrentUser();
  const [status, setStatus] = useState<UserStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [confirmReset, setConfirmReset] = useState<ParentDto | null>(null);
  const parents = useParents({ status, page });
  const move = useMoveParent();
  const reset = useResetParentPassword();
  const toast = useToast();
  const filter = FILTERS.find((item) => item.value === status);

  return (
    <>
      <PageHeader
        title="Parent Requests"
        description={`Parents of ${user.centerName ?? "your center"}.`}
      />
      <div className="mb-3 max-w-sm">
        <FormField label="Show">
          {(field) => (
            <Select
              {...field}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as UserStatus);
                setPage(1);
              }}
            >
              {FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>
      <QueryBoundary query={parents} errorTitle="Could not load the parents.">
        {parents.data?.data.length === 0 ? (
          <EmptyState
            title={`${filter?.empty ?? "Nothing at"} ${user.centerName ?? "your center"}.`}
          />
        ) : (
          <>
            <Table
              cardsOnPhone
              caption="Parents"
              rows={parents.data?.data ?? []}
              rowKey={(row) => row.id}
              rowClassName={(row) =>
                row.status === "DISABLED" ? "bg-header text-text-secondary" : ""
              }
              columns={[
                { key: "name", header: "Name", render: (row) => row.fullName },
                {
                  key: "username",
                  header: "Username",
                  render: (row) => row.username,
                },
                {
                  key: "mobile",
                  header: "Mobile",
                  render: (row) => row.mobile ?? "",
                },
                {
                  key: "child",
                  header: "Child",
                  render: (row) => row.childName ?? "",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <AccountStatusBadge status={row.status} />,
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      {ACTIONS[row.status].map((item, index) => (
                        <Button
                          key={item.action}
                          variant={index === 0 ? "primary" : "secondary"}
                          aria-label={`${item.label} ${row.fullName}`}
                          disabled={move.isPending}
                          onClick={() => {
                            move.mutate(
                              { id: row.id, action: item.action },
                              {
                                onError: (error) => {
                                  toast.show({
                                    kind: "error",
                                    message: error.message,
                                  });
                                },
                              },
                            );
                          }}
                        >
                          {item.label}
                        </Button>
                      ))}
                      {row.status === "ACTIVE" && (
                        <Button
                          variant="secondary"
                          aria-label={`Reset password of ${row.fullName}`}
                          onClick={() => {
                            setConfirmReset(row);
                          }}
                        >
                          Reset to default
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
            <Pagination
              page={parents.data?.meta.page ?? page}
              pageSize={parents.data?.meta.pageSize ?? 20}
              total={parents.data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryBoundary>
      <ConfirmDialog
        open={confirmReset !== null}
        title="Reset this password?"
        confirmLabel="Reset to default"
        loading={reset.isPending}
        onCancel={() => {
          setConfirmReset(null);
        }}
        onConfirm={() => {
          if (confirmReset === null) {
            return;
          }
          reset.mutate(confirmReset.id, {
            onSuccess: (result) => {
              toast.show({
                kind: "success",
                message: `${result.message} ${confirmReset.fullName} must change it at the next login.`,
              });
              setConfirmReset(null);
            },
            onError: (error) => {
              setConfirmReset(null);
              toast.show({ kind: "error", message: error.message });
            },
          });
        }}
      >
        The password of {confirmReset?.fullName} goes back to the default, and
        they must change it at the next login.
      </ConfirmDialog>
    </>
  );
}

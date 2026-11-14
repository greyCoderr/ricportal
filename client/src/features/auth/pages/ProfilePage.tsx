import {
  changePasswordSchema,
  profileUpdateSchema,
  SEX_OPTIONS,
  type ProfileDto,
  type ProfileUpdateInput,
  type Role,
} from "@ricportal/shared";
import { useState } from "react";
import {
  DateField,
  PasswordField,
  SelectField,
  TextField,
} from "../../../components/form/fields";
import { NOT_SET } from "../../../components/ProfileCard";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Banner, Button, EmptyState, Modal } from "../../../components/ui";
import { formatInstantDate, formatInstantTime } from "../../../lib/format";
import { useZodForm } from "../../../lib/use-zod-form";
import {
  AccountSecurityCard,
  PersonalInformationCard,
  ProfileActivityCard,
  ProfileSummaryCard,
} from "../components/ProfileSections";
import {
  RecentStatusActivity,
  RecentSubmittedReports,
  TeacherHeaderCard,
  TeacherStatCards,
} from "../components/TeacherProfileSections";
import {
  useChangePassword,
  useProfile,
  useRecentLogins,
  useTeacherSummary,
  useUpdateProfile,
} from "../hooks";
import { TEACHER_REPORTS_PAGE_SIZE } from "../api";

const TITLE: Record<Role, string> = {
  ADMIN: "Profile",
  TEACHER: "RIC Teacher Profile",
  PARENT: "Parent Profile",
};

const EXTRA_FIELDS = [
  "email",
  "address",
  "position",
  "sex",
  "birthDate",
  "qualification",
] as const;

// Sends an extra field only when it changed: left out keeps the stored value.
function profilePatch(
  profile: ProfileDto,
  data: {
    fullName: string;
    mobile?: string | undefined;
  } & Partial<Record<(typeof EXTRA_FIELDS)[number], string | null | undefined>>,
): ProfileUpdateInput {
  const patch: Record<string, string> = {
    fullName: data.fullName,
    mobile: data.mobile ?? "",
  };
  for (const field of EXTRA_FIELDS) {
    const next = data[field] ?? "";
    if (next !== (profile[field] ?? "")) {
      patch[field] = next;
    }
  }
  return patch as ProfileUpdateInput;
}

function EditProfileDialog({
  profile,
  onClose,
}: {
  profile: ProfileDto;
  onClose: () => void;
}) {
  const update = useUpdateProfile();
  const form = useZodForm(profileUpdateSchema, {
    fullName: profile.fullName,
    mobile: profile.mobile ?? "",
    email: profile.email ?? "",
    address: profile.address ?? "",
    position: profile.position ?? "",
    sex: profile.sex ?? "",
    birthDate: profile.birthDate ?? "",
    qualification: profile.qualification ?? "",
  });
  return (
    <Modal open onClose={onClose} title="Edit Profile">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          update.mutate(profilePatch(profile, data), {
            onSuccess: onClose,
            onError: (error) => {
              form.applyError(error);
            },
          });
        })}
      >
        <TextField form={form} name="fullName" label="Full Name" required />
        <DateField form={form} name="birthDate" label="Date of Birth" />
        <TextField
          form={form}
          name="email"
          label="Email Address"
          autoComplete="email"
        />
        <SelectField form={form} name="sex" label="Gender">
          <option value="">{NOT_SET}</option>
          {SEX_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
        <TextField
          form={form}
          name="mobile"
          label="Contact Number"
          inputMode="tel"
          autoComplete="tel"
          required={profile.role === "PARENT"}
        />
        <TextField form={form} name="address" label="Address" />
        {profile.role === "TEACHER" && (
          <>
            <TextField form={form} name="position" label="Position" />
            <TextField form={form} name="qualification" label="Qualification" />
          </>
        )}
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
        <Button type="submit" loading={update.isPending}>
          Save changes
        </Button>
      </form>
    </Modal>
  );
}

function ChangePasswordDialog({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const change = useChangePassword();
  const form = useZodForm(changePasswordSchema, {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  return (
    <Modal open onClose={onClose} title="Change Password">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          change.mutate(data, {
            onSuccess: onChanged,
            onError: (error) => {
              form.applyError(error);
            },
          });
        })}
      >
        <PasswordField
          form={form}
          name="currentPassword"
          label="Current password"
          required
        />
        <PasswordField
          form={form}
          name="newPassword"
          label="New password"
          hint="At least 8 characters with a letter and a number."
          required
          autoComplete="new-password"
        />
        <PasswordField
          form={form}
          name="confirmPassword"
          label="Confirm new password"
          required
          autoComplete="new-password"
        />
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
        <Button type="submit" loading={change.isPending}>
          Save password
        </Button>
      </form>
    </Modal>
  );
}

function LoginHistoryDialog({ onClose }: { onClose: () => void }) {
  const logins = useRecentLogins();
  return (
    <Modal open onClose={onClose} title="Login History">
      <QueryBoundary query={logins} errorTitle="Could not load your logins.">
        {logins.data?.length === 0 && (
          <EmptyState title="No logins recorded yet." />
        )}
        {logins.data !== undefined && logins.data.length > 0 && (
          <ol
            aria-label="Last logins"
            className="flex flex-col divide-y divide-border-subtle text-13 tracking-label"
          >
            {logins.data.map((login) => (
              <li key={login.at} className="flex justify-between gap-4 py-2">
                <span>{formatInstantDate(login.at)}</span>
                <span className="text-text-secondary">
                  {formatInstantTime(login.at)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </QueryBoundary>
    </Modal>
  );
}

// Plan 4 D9: the Teacher Profile of Figma 88:695 above the Round 3 sections.
function TeacherOverview({ profile }: { profile: ProfileDto }) {
  const [page, setPage] = useState(1);
  const summary = useTeacherSummary(page);
  const data = summary.data?.data;
  const total = summary.data?.meta.total ?? 0;
  return (
    <div className="mb-4 flex flex-col gap-4">
      <TeacherHeaderCard profile={profile} teacherCode={data?.teacherCode} />
      <QueryBoundary
        query={summary}
        errorTitle="Could not load your reports and activity."
      >
        <TeacherStatCards counts={data?.counts} />
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <RecentSubmittedReports
            reports={data?.reports ?? []}
            page={page}
            pages={Math.ceil(total / TEACHER_REPORTS_PAGE_SIZE)}
            onPage={setPage}
          />
          <RecentStatusActivity activity={data?.activity ?? []} />
        </div>
      </QueryBoundary>
    </div>
  );
}

function ProfileDetails({ profile }: { profile: ProfileDto }) {
  const [dialog, setDialog] = useState<"edit" | "password" | "logins" | null>(
    null,
  );
  const [changed, setChanged] = useState(false);
  const close = () => {
    setDialog(null);
  };

  return (
    <>
      <h1 className="text-24 font-bold tracking-label lg:text-40">
        {TITLE[profile.role]}
      </h1>
      <p className="mt-1 mb-6 text-13 tracking-label text-text-secondary">
        View and manage your account information and security settings.
      </p>
      {changed && (
        <div className="mb-4">
          <Banner tone="success">Your password was changed.</Banner>
        </div>
      )}
      {profile.role === "TEACHER" ? (
        <TeacherOverview profile={profile} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)]">
          <ProfileSummaryCard profile={profile} />
          <ProfileActivityCard
            onViewAll={() => {
              setDialog("logins");
            }}
          />
        </div>
      )}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <PersonalInformationCard
          profile={profile}
          onEdit={() => {
            setDialog("edit");
          }}
        />
        <AccountSecurityCard
          profile={profile}
          onChangePassword={() => {
            setChanged(false);
            setDialog("password");
          }}
          onViewHistory={() => {
            setDialog("logins");
          }}
        />
      </div>
      {dialog === "edit" && (
        <EditProfileDialog profile={profile} onClose={close} />
      )}
      {dialog === "logins" && <LoginHistoryDialog onClose={close} />}
      {dialog === "password" && (
        <ChangePasswordDialog
          onClose={close}
          onChanged={() => {
            setChanged(true);
            close();
          }}
        />
      )}
    </>
  );
}

// Admin and Parent in the layout of the Admin frame (Plan 3 D7, DEC-049); the
// Teacher in the layout of 88:695 (Plan 4 D9), with the same sections below.
export function ProfilePage() {
  const profile = useProfile();
  return (
    <QueryBoundary query={profile} errorTitle="Could not load your profile.">
      {profile.data !== undefined && <ProfileDetails profile={profile.data} />}
    </QueryBoundary>
  );
}

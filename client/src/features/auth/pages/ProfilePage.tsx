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
import { NOT_SET, ProfileCard } from "../../../components/ProfileCard";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Badge, Banner, Button, Modal } from "../../../components/ui";
import { formatDate, formatInstantDate } from "../../../lib/format";
import { LABELS } from "../../../lib/labels";
import { userCode } from "../../../lib/user-code";
import { useZodForm } from "../../../lib/use-zod-form";
import { useChangePassword, useProfile, useUpdateProfile } from "../hooks";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: LABELS.admin,
  TEACHER: LABELS.teacher,
  PARENT: LABELS.parent,
};

const TITLE: Record<Role, string> = {
  ADMIN: "Profile",
  TEACHER: "RIC Teacher Profile",
  PARENT: "Parent Profile",
};

const ID_LABEL: Record<Role, string> = {
  ADMIN: "User ID",
  TEACHER: "Teacher ID",
  PARENT: "Parent ID",
};

const ACTIVE_BADGE: Record<Role, string> = {
  ADMIN: "Active Administrator",
  TEACHER: "Active Teacher",
  PARENT: "Active Parent",
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
        <TextField form={form} name="fullName" label="Full name" required />
        <TextField
          form={form}
          name="mobile"
          label="Mobile number"
          inputMode="tel"
          autoComplete="tel"
          required={profile.role === "PARENT"}
        />
        <TextField
          form={form}
          name="email"
          label="Email"
          autoComplete="email"
        />
        <TextField form={form} name="address" label="Address" />
        <TextField form={form} name="position" label="Position" />
        <SelectField form={form} name="sex" label="Sex" placeholder="Select...">
          {SEX_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
        <DateField form={form} name="birthDate" label="Birth date" />
        <TextField form={form} name="qualification" label="Qualification" />
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

function ProfileDetails({ profile }: { profile: ProfileDto }) {
  const [dialog, setDialog] = useState<"edit" | "password" | null>(null);
  const [changed, setChanged] = useState(false);
  const close = () => {
    setDialog(null);
  };

  return (
    <>
      <h1 className="mb-6 text-24 font-bold tracking-label lg:text-40">
        {TITLE[profile.role]}
      </h1>
      {changed && (
        <div className="mb-4">
          <Banner tone="success">Your password was changed.</Banner>
        </div>
      )}
      <ProfileCard
        name={profile.fullName}
        badge={<Badge tone="success">{ACTIVE_BADGE[profile.role]}</Badge>}
        contacts={[
          profile.email ?? "No email yet",
          profile.mobile ?? "No mobile number yet",
          profile.address ?? "No address yet",
        ]}
        columns={[
          [
            {
              label: ID_LABEL[profile.role],
              value: userCode(profile.role, profile.id),
            },
            {
              label: "Date Registered",
              value: formatInstantDate(profile.createdAt),
            },
            ...(profile.centerName === null
              ? []
              : [{ label: LABELS.center, value: profile.centerName }]),
          ],
          [
            { label: "Sex", value: profile.sex ?? NOT_SET },
            {
              label: "BirthDate",
              value:
                profile.birthDate === null
                  ? NOT_SET
                  : formatDate(profile.birthDate),
            },
            { label: "Qualification", value: profile.qualification ?? NOT_SET },
          ],
          [
            { label: "Username", value: profile.username },
            { label: "Role", value: ROLE_LABEL[profile.role] },
            { label: "Position", value: profile.position ?? NOT_SET },
            {
              label: "Last Login",
              value:
                profile.lastLoginAt === null
                  ? "Never"
                  : formatInstantDate(profile.lastLoginAt),
            },
          ],
        ]}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          icon="pencil"
          onClick={() => {
            setDialog("edit");
          }}
        >
          Edit Profile
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setChanged(false);
            setDialog("password");
          }}
        >
          Change Password
        </Button>
      </div>
      {dialog === "edit" && (
        <EditProfileDialog profile={profile} onClose={close} />
      )}
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

// Profile (Figma 88:695 and 378:16539; D9). Every field of the frame with a data
// source. The report cards and activity lists are left out (SPRINT_SHORTCUTS).
export function ProfilePage() {
  const profile = useProfile();
  return (
    <QueryBoundary query={profile} errorTitle="Could not load your profile.">
      {profile.data !== undefined && <ProfileDetails profile={profile.data} />}
    </QueryBoundary>
  );
}

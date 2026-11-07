import {
  changePasswordSchema,
  profileUpdateSchema,
  type ProfileDto,
  type Role,
} from "@ricportal/shared";
import { useState } from "react";
import avatar from "../../../assets/avatar-placeholder.png";
import { PasswordField, TextField } from "../../../components/form/fields";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Badge, Banner, Button, Modal } from "../../../components/ui";
import { LABELS } from "../../../lib/labels";
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

const ACTIVE_BADGE: Record<Role, string> = {
  ADMIN: "Active Administrator",
  TEACHER: "Active Teacher",
  PARENT: "Active Parent",
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-12 tracking-label text-text-secondary">{label}</dt>
      <dd className="mt-1 text-13 tracking-label">{value}</dd>
    </div>
  );
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
  });
  return (
    <Modal open onClose={onClose} title="Edit Profile">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          update.mutate(
            { fullName: data.fullName, mobile: data.mobile ?? "" },
            {
              onSuccess: onClose,
              onError: (error) => {
                form.applyError(error);
              },
            },
          );
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
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <img
          src={avatar}
          alt=""
          className="size-[7.5rem] shrink-0 rounded-full object-cover lg:size-[10.375rem]"
        />
        <div className="min-w-0 md:w-64">
          <p className="text-20 font-bold tracking-label">{profile.fullName}</p>
          <div className="mt-2">
            <Badge tone="success">{ACTIVE_BADGE[profile.role]}</Badge>
          </div>
        </div>
        <dl className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 md:border-l md:border-border-subtle md:pl-8">
          <Detail label="Username" value={profile.username} />
          <Detail label="Role" value={ROLE_LABEL[profile.role]} />
          {profile.centerName !== null && (
            <Detail label={LABELS.center} value={profile.centerName} />
          )}
          <Detail label="Mobile number" value={profile.mobile ?? "Not set"} />
        </dl>
      </div>
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

// Profile (Figma 88:695 and 378:16539; D11). Only the fields D11 lists are real
// here; the report cards and activity lists of the frame are not (DEC-037).
export function ProfilePage() {
  const profile = useProfile();
  return (
    <QueryBoundary query={profile} errorTitle="Could not load your profile.">
      {profile.data !== undefined && <ProfileDetails profile={profile.data} />}
    </QueryBoundary>
  );
}

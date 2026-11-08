import type { ProfileActivityDto, ProfileDto, Role } from "@ricportal/shared";
import type { ReactNode } from "react";
import avatar from "../../../assets/avatar-placeholder.png";
import { NOT_SET } from "../../../components/ProfileCard";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Badge, Button, Icon, type IconName } from "../../../components/ui";
import { formatDate, formatInstantDate } from "../../../lib/format";
import { LABELS } from "../../../lib/labels";
import { userCode } from "../../../lib/user-code";
import { useProfileActivity } from "../hooks";

const NOT_AVAILABLE = "Not available in this version";

const ROLE_NAME: Record<Role, string> = {
  ADMIN: "System Administrator",
  TEACHER: LABELS.teacher,
  PARENT: LABELS.parent,
};

const SUMMARY_TEXT: Record<Role, string> = {
  ADMIN:
    "As a System Administrator, you have full access to manage the RICPortal system, users, and reports to support the Rural Improvement Club operations.",
  TEACHER:
    "As a RIC Teacher, you manage the enrolled children, parents, and reports of your RIC Children Center.",
  PARENT:
    "As a Parent, you help with the feeding program of your RIC Children Center on your assigned days.",
};

type Tile = { icon: IconName; label: string; value: string };

function accountTiles(profile: ProfileDto): Tile[] {
  const role: Tile = {
    icon: "users",
    label: "Role",
    value: ROLE_NAME[profile.role],
  };
  if (profile.role === "ADMIN") {
    return [
      role,
      { icon: "file-text", label: "Permissions", value: "Full Access" },
    ];
  }
  const center: Tile = {
    icon: "house",
    label: LABELS.center,
    value: profile.centerName ?? NOT_SET,
  };
  if (profile.role === "PARENT") {
    return [role, center];
  }
  return [
    role,
    center,
    {
      icon: "user",
      label: "Teacher ID",
      value: userCode("TEACHER", profile.id),
    },
  ];
}

type ActivityRow = { icon: IconName; value: number; label: string };

function activityRows(activity: ProfileActivityDto): ActivityRow[] {
  const logins: ActivityRow = {
    icon: "clock",
    value: activity.loginsThisMonth,
    label: "Logins This Month",
  };
  if (activity.role === "ADMIN") {
    return [
      {
        icon: "users",
        value: activity.teachersManaged,
        label: "Teachers Managed",
      },
      {
        icon: "users",
        value: activity.enrolledStudents,
        label: "Enrolled Students Monitored",
      },
      {
        icon: "file-text",
        value: activity.reportsGenerated,
        label: "Reports Generated",
      },
      logins,
    ];
  }
  if (activity.role === "TEACHER") {
    return [
      {
        icon: "users",
        value: activity.childrenEnrolled,
        label: "Children Enrolled",
      },
      {
        icon: "users",
        value: activity.parentsApproved,
        label: "Parents Approved",
      },
      {
        icon: "file-text",
        value: activity.reportsSubmitted,
        label: "Reports Submitted",
      },
      logins,
    ];
  }
  return [logins];
}

function passwordChangedText(days: number | null): string {
  if (days === null) return "Not changed yet";
  if (days === 0) return "Last changed today";
  return `Last changed ${String(days)} ${days === 1 ? "day" : "days"} ago`;
}

function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: IconName;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-card border border-border-subtle bg-surface p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-3 text-13 font-bold tracking-label">
          <Icon name={icon} />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function IconChip({ icon }: { icon: IconName }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-success-soft text-success">
      <Icon name={icon} size={18} />
    </span>
  );
}

function Fact({ icon, label, value }: Tile) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-control border border-border-subtle p-3">
      <IconChip icon={icon} />
      <div className="min-w-0">
        <p className="text-11 tracking-label text-text-secondary">{label}</p>
        <p className="text-13 font-medium tracking-label break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function ContactLine({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <li className="flex min-w-0 items-center gap-3 text-12 tracking-label">
      <Icon name={icon} size={18} className="shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

export function ProfileSummaryCard({ profile }: { profile: ProfileDto }) {
  return (
    <section className="flex min-w-0 flex-col gap-6 rounded-card border border-border-subtle bg-surface p-5 shadow-card lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-center">
        <img
          src={avatar}
          alt=""
          className="size-[7.5rem] shrink-0 rounded-full object-cover lg:size-[10.375rem]"
        />
        <div className="min-w-0">
          <p className="text-20 font-bold tracking-label break-words">
            {profile.fullName}
          </p>
          <div className="mt-2">
            <Badge tone="success">{ROLE_NAME[profile.role]}</Badge>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            <ContactLine icon="mail">{profile.email ?? NOT_SET}</ContactLine>
            <ContactLine icon="phone">{profile.mobile ?? NOT_SET}</ContactLine>
            <ContactLine icon="calendar-days">
              Joined {formatInstantDate(profile.createdAt)}
            </ContactLine>
            <li className="flex items-center gap-3 text-12 tracking-label">
              <Icon name="shield-check" size={18} className="shrink-0" />
              Account Status
              <Badge tone="success">Active</Badge>
            </li>
          </ul>
        </div>
      </div>
      <div className="min-w-0 border-border-subtle lg:w-[38%] lg:shrink-0 lg:border-l lg:pl-6">
        <h2 className="flex items-center gap-3 text-13 font-bold tracking-label">
          <Icon name="users" />
          Account Summary
        </h2>
        <p className="mt-3 text-12 tracking-label text-text-secondary">
          {SUMMARY_TEXT[profile.role]}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {accountTiles(profile).map((tile) => (
            <Fact key={tile.label} {...tile} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProfileActivityCard({ onViewAll }: { onViewAll: () => void }) {
  const activity = useProfileActivity();
  return (
    <SectionCard icon="chart-column" title="System Activity">
      <QueryBoundary query={activity} errorTitle="Could not load the activity.">
        {activity.data !== undefined && (
          <ul className="flex flex-col divide-y divide-border-subtle rounded-control border border-border-subtle">
            {activityRows(activity.data).map((row) => (
              <li key={row.label} className="flex items-center gap-3 p-3">
                <IconChip icon={row.icon} />
                <div className="min-w-0">
                  <p className="text-13 font-bold tracking-label">
                    {row.value}
                  </p>
                  <p className="text-11 tracking-label text-text-secondary">
                    {row.label}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
      <div className="mt-3 flex justify-center">
        <Button variant="secondary" onClick={onViewAll}>
          View All Activity
        </Button>
      </div>
    </SectionCard>
  );
}

function Info({ icon, label, value }: Tile) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <IconChip icon={icon} />
      <div className="min-w-0">
        <p className="text-11 tracking-label text-text-secondary">{label}</p>
        <p className="text-13 font-bold tracking-label break-words">{value}</p>
      </div>
    </div>
  );
}

export function PersonalInformationCard({
  profile,
  onEdit,
}: {
  profile: ProfileDto;
  onEdit: () => void;
}) {
  const fields: Tile[] = [
    { icon: "user", label: "Full Name", value: profile.fullName },
    {
      icon: "calendar-days",
      label: "Date of Birth",
      value:
        profile.birthDate === null ? NOT_SET : formatDate(profile.birthDate),
    },
    { icon: "mail", label: "Email Address", value: profile.email ?? NOT_SET },
    { icon: "user", label: "Gender", value: profile.sex ?? NOT_SET },
    {
      icon: "phone",
      label: "Contact Number",
      value: profile.mobile ?? NOT_SET,
    },
    { icon: "map-pin", label: "Address", value: profile.address ?? NOT_SET },
  ];
  if (profile.role === "TEACHER") {
    fields.push(
      { icon: "users", label: "Position", value: profile.position ?? NOT_SET },
      {
        icon: "file-text",
        label: "Qualification",
        value: profile.qualification ?? NOT_SET,
      },
    );
  }
  return (
    <SectionCard
      icon="user"
      title="Personal Information"
      action={
        <Button variant="secondary" icon="pencil" onClick={onEdit}>
          Edit Profile
        </Button>
      }
    >
      <div className="grid gap-4 rounded-control border border-border-subtle p-4 sm:grid-cols-2">
        {fields.map((field) => (
          <Info key={field.label} {...field} />
        ))}
      </div>
    </SectionCard>
  );
}

function SecurityRow({
  icon,
  label,
  detail,
  action,
}: {
  icon: IconName;
  label: string;
  detail: ReactNode;
  action: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <IconChip icon={icon} />
        <div className="min-w-0">
          <p className="text-12 font-medium tracking-label">{label}</p>
          <p className="text-11 tracking-label text-text-secondary">{detail}</p>
        </div>
      </div>
      {action}
    </li>
  );
}

export function AccountSecurityCard({
  profile,
  onChangePassword,
  onViewHistory,
}: {
  profile: ProfileDto;
  onChangePassword: () => void;
  onViewHistory: () => void;
}) {
  return (
    <SectionCard
      icon="shield-check"
      title="Account Security"
      action={
        <Button variant="secondary" icon="lock" onClick={onChangePassword}>
          Change Password
        </Button>
      }
    >
      <ul className="flex flex-col divide-y divide-border-subtle rounded-control border border-border-subtle">
        <SecurityRow
          icon="lock"
          label="Password"
          detail={<span aria-label="Hidden">••••••••••••</span>}
          action={
            <span className="text-11 tracking-label text-text-secondary">
              {passwordChangedText(profile.passwordChangedDaysAgo)}
            </span>
          }
        />
        <SecurityRow
          icon="shield-check"
          label="Two-Factor Authentication"
          detail={NOT_AVAILABLE}
          action={
            <Button variant="secondary" disabled>
              Enable
            </Button>
          }
        />
        <SecurityRow
          icon="smartphone"
          label="Active Sessions"
          detail={NOT_AVAILABLE}
          action={
            <Button variant="secondary" disabled>
              View Sessions
            </Button>
          }
        />
        <SecurityRow
          icon="clock"
          label="Login History"
          detail="View recent login activity"
          action={
            <Button variant="secondary" onClick={onViewHistory}>
              View History
            </Button>
          }
        />
      </ul>
    </SectionCard>
  );
}

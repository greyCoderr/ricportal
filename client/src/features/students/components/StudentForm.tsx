import {
  computeAge,
  isCalendarDate,
  isUsualAge,
  manilaToday,
  profileExtraSchema,
  studentCreateSchema,
  type StudentDto,
} from "@ricportal/shared";
import { useState } from "react";
import {
  DateField,
  SelectField,
  TextField,
} from "../../../components/form/fields";
import { Banner, Button } from "../../../components/ui";
import { useZodForm } from "../../../lib/use-zod-form";
import { useCreateStudent, useUpdateStudent } from "../hooks";
import {
  toDraft,
  toProfileExtra,
  type ExtraDraft,
} from "../profile-extra-form";
import {
  BirthRegistered,
  ExtraTextField,
  FacilityRow,
  FamilyTable,
  FeesAndSignOff,
  HealthPanels,
  HomeRow,
  SectionTitle,
} from "./StudentExtraSections";

// The age shown while typing (BR-01). The server computes it again.
export function agePreview(
  birthdate: string,
  today: string,
): { text: string; warning: string | null } | null {
  if (!isCalendarDate(birthdate)) {
    return null;
  }
  const age = computeAge(birthdate, today);
  if (age === null) {
    return { text: "This birthdate is in the future.", warning: null };
  }
  return {
    text: `Age today: ${String(age)}`,
    warning: isUsualAge(age)
      ? null
      : "Most children here are 2 to 4 years old. You can still save this child; they count in the Other row.",
  };
}

const text = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const NUMBER_OPTIONS = Array.from({ length: 21 }, (_, index) => index);

// Add and edit student, as a page like Figma 258:5447 (D9). The blueprint's fields
// keep their columns and stay the required ones; everything else goes to
// profile_extra and is optional until the client confirms it (A-17).
export function StudentForm({
  student,
  onClose,
}: {
  student: StudentDto | null;
  onClose: () => void;
}) {
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const form = useZodForm(studentCreateSchema, {
    lastName: text(student?.lastName),
    firstName: text(student?.firstName),
    middleName: text(student?.middleName),
    gender: text(student?.gender),
    birthdate: text(student?.birthdate),
    weightKg: text(student?.weightKg),
    heightCm: text(student?.heightCm),
    parentGuardianName: text(student?.parentGuardianName),
    enrolledOn: student?.enrolledOn ?? manilaToday(),
    birthOrder: text(student?.birthOrder),
    numberOfSiblings: text(student?.numberOfSiblings),
    religion: text(student?.religion),
    ethnicity: text(student?.ethnicity),
  });
  const [draft, setDraft] = useState<ExtraDraft>(() =>
    toDraft(student === null ? null : (student.profileExtra ?? {})),
  );
  const [extraError, setExtraError] = useState<string | null>(null);
  const preview = agePreview(form.values.birthdate, manilaToday());
  const busy = create.isPending || update.isPending;
  const shared = { draft, setDraft };

  return (
    <form
      noValidate
      className="flex flex-col gap-8 rounded-card border border-border-subtle bg-surface p-4 shadow-panel lg:p-8"
      onSubmit={form.handleSubmit((data) => {
        const extra = profileExtraSchema.safeParse(toProfileExtra(draft));
        if (!extra.success) {
          const issue = extra.error.issues[0];
          setExtraError(
            `Please check the form: ${issue?.path.join(" ") ?? ""} ${issue?.message ?? ""}`.trim(),
          );
          return;
        }
        setExtraError(null);
        const body = { ...data, profileExtra: extra.data };
        const handlers = {
          onSuccess: onClose,
          onError: (error: unknown) => {
            form.applyError(error);
          },
        };
        if (student === null) {
          create.mutate(body, handlers);
        } else {
          update.mutate({ id: student.id, data: body }, handlers);
        }
      })}
    >
      <section className="flex flex-col gap-4">
        <SectionTitle>I. Identifying Information</SectionTitle>
        <FacilityRow {...shared} />

        <fieldset className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_8rem_2fr] md:items-start">
          <legend className="mb-2 text-15 font-medium">2a. Name</legend>
          <TextField form={form} name="lastName" label="Last name" required />
          <TextField form={form} name="firstName" label="First name" required />
          <TextField form={form} name="middleName" label="Middle name" />
          <ExtraTextField {...shared} name="suffix" label="Jr/Sr" />
          <ExtraTextField {...shared} name="nickname" label="2b. Nickname" />
        </fieldset>

        <div className="grid gap-4 md:grid-cols-4 md:items-start">
          <fieldset>
            <legend className="mb-2 text-15 font-medium">
              3. Sex
              <span aria-hidden="true" className="text-primary">
                {" *"}
              </span>
            </legend>
            <div className="flex gap-6">
              {(
                [
                  ["M", "Male"],
                  ["F", "Female"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="inline-flex min-h-11 items-center gap-3 text-15"
                >
                  <input
                    type="radio"
                    name="gender"
                    className="size-5 accent-primary"
                    checked={form.values.gender === value}
                    onChange={() => {
                      form.setValue("gender", value);
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            {form.errors.gender !== undefined && (
              <p className="text-13 text-danger-text">{form.errors.gender}</p>
            )}
          </fieldset>
          <SelectField form={form} name="birthOrder" label="4a. Birth Order">
            <option value="">Select...</option>
            {NUMBER_OPTIONS.slice(1).map((number) => (
              <option key={number} value={String(number)}>
                {number}
              </option>
            ))}
          </SelectField>
          <SelectField
            form={form}
            name="numberOfSiblings"
            label="4b. No. of Siblings"
          >
            <option value="">Select...</option>
            {NUMBER_OPTIONS.map((number) => (
              <option key={number} value={String(number)}>
                {number}
              </option>
            ))}
          </SelectField>
          <div className="flex flex-col gap-2">
            <DateField
              form={form}
              name="birthdate"
              label="5a. Date of Birth"
              required
            />
            {preview !== null && (
              <p aria-live="polite" className="text-15 font-medium">
                {preview.text}
              </p>
            )}
          </div>
        </div>
        {preview?.warning != null && (
          <Banner tone="warning">{preview.warning}</Banner>
        )}

        <div className="grid gap-4 md:grid-cols-[3fr_1fr] md:items-start">
          <ExtraTextField
            {...shared}
            name="birthPlace"
            label="6. Birth Place"
          />
          <BirthRegistered {...shared} />
        </div>

        <HomeRow {...shared} />

        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <TextField form={form} name="religion" label="8. Religion" />
          <TextField form={form} name="ethnicity" label="9. Ethnicity" />
        </div>

        <div className="grid gap-4 md:grid-cols-4 md:items-start">
          <TextField
            form={form}
            name="weightKg"
            label="Weight (kg)"
            inputMode="decimal"
            required
          />
          <TextField
            form={form}
            name="heightCm"
            label="Height (cm)"
            inputMode="decimal"
            required
          />
          <TextField
            form={form}
            name="parentGuardianName"
            label="Parent or guardian"
            required
          />
          <DateField form={form} name="enrolledOn" label="Date enrolled" />
        </div>
      </section>

      <section>
        <SectionTitle>II. Family Information</SectionTitle>
        <FamilyTable {...shared} />
      </section>

      <section>
        <SectionTitle>II. Family Information</SectionTitle>
        <HealthPanels {...shared} />
      </section>

      <FeesAndSignOff {...shared} />

      {extraError !== null && <Banner tone="danger">{extraError}</Banner>}
      {form.formError !== null && (
        <Banner tone="danger">{form.formError}</Banner>
      )}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Save Student
        </Button>
      </div>
    </form>
  );
}

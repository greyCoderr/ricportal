import {
  computeAge,
  isCalendarDate,
  isUsualAge,
  manilaToday,
  studentCreateSchema,
  type StudentDto,
} from "@ricportal/shared";
import { SelectField, TextField } from "../../../components/form/fields";
import { Banner, Button, Modal } from "../../../components/ui";
import { useZodForm } from "../../../lib/use-zod-form";
import { useCreateStudent, useUpdateStudent } from "../hooks";

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

// Add and edit student (Figma 258:5447). The fields follow the blueprint; the
// extra fields of the Figma form are listed in docs/SPRINT_SHORTCUTS.md.
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
  const preview = agePreview(form.values.birthdate, manilaToday());
  const busy = create.isPending || update.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={student === null ? "Add a student" : `Edit ${student.displayName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="student-form" loading={busy}>
            Save Student
          </Button>
        </>
      }
    >
      <form
        id="student-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          const handlers = {
            onSuccess: onClose,
            onError: (error: unknown) => {
              form.applyError(error);
            },
          };
          if (student === null) {
            create.mutate(data, handlers);
          } else {
            update.mutate({ id: student.id, data }, handlers);
          }
        })}
      >
        <TextField form={form} name="lastName" label="Last name" required />
        <TextField form={form} name="firstName" label="First name" required />
        <TextField form={form} name="middleName" label="Middle name" />
        <SelectField
          form={form}
          name="gender"
          label="Sex"
          required
          placeholder="Select..."
        >
          <option value="M">Male</option>
          <option value="F">Female</option>
        </SelectField>
        <TextField
          form={form}
          name="birthdate"
          label="Date of birth"
          type="date"
          required
        />
        {preview !== null && (
          <div className="flex flex-col gap-2">
            <p aria-live="polite" className="text-16 font-medium">
              {preview.text}
            </p>
            {preview.warning !== null && (
              <Banner tone="warning">{preview.warning}</Banner>
            )}
          </div>
        )}
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
        <TextField
          form={form}
          name="enrolledOn"
          label="Date enrolled"
          type="date"
        />
        <TextField
          form={form}
          name="birthOrder"
          label="Birth order"
          inputMode="numeric"
        />
        <TextField
          form={form}
          name="numberOfSiblings"
          label="No. of siblings"
          inputMode="numeric"
        />
        <TextField form={form} name="religion" label="Religion" />
        <TextField form={form} name="ethnicity" label="Ethnicity" />
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

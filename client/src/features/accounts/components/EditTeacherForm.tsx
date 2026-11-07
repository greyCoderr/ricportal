import { teacherPatchSchema, type TeacherDto } from "@ricportal/shared";
import { SelectField, TextField } from "../../../components/form/fields";
import { Banner, Button, Modal } from "../../../components/ui";
import { useZodForm } from "../../../lib/use-zod-form";
import { useCenters, useUpdateTeacher } from "../hooks";

export function useActiveCenterOptions() {
  const centers = useCenters({ page: 1, pageSize: 100 });
  return (centers.data?.data ?? []).filter((center) => center.isActive);
}

export function EditTeacherForm({
  teacher,
  onClose,
}: {
  teacher: TeacherDto;
  onClose: () => void;
}) {
  const update = useUpdateTeacher();
  const centers = useActiveCenterOptions();
  const form = useZodForm(teacherPatchSchema, {
    fullName: teacher.fullName,
    mobile: teacher.mobile ?? "",
    centerId: teacher.centerId === null ? "" : String(teacher.centerId),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${teacher.fullName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="teacher-edit-form"
            loading={update.isPending}
          >
            Save
          </Button>
        </>
      }
    >
      <form
        id="teacher-edit-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          update.mutate(
            { id: teacher.id, patch: data },
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
        />
        <SelectField
          form={form}
          name="centerId"
          label="RIC Children Center"
          required
        >
          {centers.map((center) => (
            <option key={center.id} value={String(center.id)}>
              {center.name}
            </option>
          ))}
        </SelectField>
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

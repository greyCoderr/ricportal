import type { ProfileExtra } from "@ricportal/shared";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  Checkbox,
  DateInput,
  FormField,
  Input,
  Select,
} from "../../../components/ui";
import type { ExtraDraft } from "../profile-extra-form";

// The sections of Figma 258:5447 that live in profile_extra (D9). Labels and
// numbers are the frame's own. The frame's dropdowns have no option lists, so
// those with unknown lists are text fields (docs/ui-specs/student-form.md).

type SetDraft = Dispatch<SetStateAction<ExtraDraft>>;
type TextKey = {
  [K in keyof ProfileExtra]-?: NonNullable<ProfileExtra[K]> extends string
    ? K
    : never;
}[keyof ProfileExtra];
type CheckKey = {
  [K in keyof ProfileExtra]-?: NonNullable<ProfileExtra[K]> extends boolean
    ? K
    : never;
}[keyof ProfileExtra];

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-15 font-medium tracking-label text-primary">
      {children}
    </h2>
  );
}

function ExtraText({
  draft,
  setDraft,
  name,
  label,
  placeholder,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
  name: TextKey;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField label={label}>
      {(field) => (
        <Input
          {...field}
          placeholder={placeholder}
          value={draft[name] ?? ""}
          onChange={(event) => {
            setDraft((current) => ({ ...current, [name]: event.target.value }));
          }}
        />
      )}
    </FormField>
  );
}

function ExtraCheck({
  draft,
  setDraft,
  name,
  label,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
  name: CheckKey;
  label: string;
}) {
  return (
    <Checkbox
      label={label}
      checked={draft[name] === true}
      onChange={(event) => {
        setDraft((current) => ({ ...current, [name]: event.target.checked }));
      }}
    />
  );
}

export function AddressRow({
  draft,
  setDraft,
  first,
  keys,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
  first: ReactNode;
  keys: [TextKey, TextKey, TextKey, TextKey];
}) {
  const labels = ["Barangay", "Municipality", "Province", "Region"];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
      {first}
      {keys.map((name, index) => (
        <ExtraText
          key={name}
          draft={draft}
          setDraft={setDraft}
          name={name}
          label={labels[index] ?? ""}
        />
      ))}
    </div>
  );
}

export function FacilityRow({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  return (
    <AddressRow
      draft={draft}
      setDraft={setDraft}
      keys={[
        "facilityBarangay",
        "facilityMunicipality",
        "facilityProvince",
        "facilityRegion",
      ]}
      first={
        <ExtraText
          draft={draft}
          setDraft={setDraft}
          name="facilityLocation"
          label="1. Facility Location"
        />
      }
    />
  );
}

export function HomeRow({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  return (
    <AddressRow
      draft={draft}
      setDraft={setDraft}
      keys={["homeBarangay", "homeMunicipality", "homeProvince", "homeRegion"]}
      first={
        <ExtraText
          draft={draft}
          setDraft={setDraft}
          name="homeStreet"
          label="7. Home Address"
          placeholder="No. & Street Address"
        />
      }
    />
  );
}

export function ExtraTextField(props: {
  draft: ExtraDraft;
  setDraft: SetDraft;
  name: TextKey;
  label: string;
}) {
  return <ExtraText {...props} />;
}

export function BirthRegistered({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-15 font-medium">5b. Birth Registered</legend>
      <div className="flex gap-6">
        {(
          [
            ["YES", "Yes"],
            ["NO", "No"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="inline-flex min-h-11 items-center gap-3 text-15"
          >
            <input
              type="radio"
              name="birthRegistered"
              className="size-5 accent-primary"
              checked={draft.birthRegistered === value}
              onChange={() => {
                setDraft((current) => ({ ...current, birthRegistered: value }));
              }}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const FAMILY_COLUMNS =
  "2xl:grid-cols-[1.5rem_1.5fr_1.15fr_1fr_0.85fr_1fr_1.1fr_1fr_1fr]";

export function FamilyTable({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  function setRow(index: number, key: string, value: string) {
    setDraft((current) => ({
      ...current,
      familyMembers: current.familyMembers.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    }));
  }

  const headers = [
    "",
    "11a. Full Name",
    "b. Birthday",
    "c. Relationship",
    "d. Sex",
    "e. Civil Status",
    "f. Highest Education",
    "g. Occupation",
    "h. Monthly Income",
  ];
  const textColumns = [["relationship", "c. Relationship"]] as const;

  return (
    <div className="flex flex-col gap-3 2xl:gap-2">
      <div
        aria-hidden="true"
        className={`hidden gap-2 border-b border-border-subtle pb-2 text-12 2xl:grid ${FAMILY_COLUMNS}`}
      >
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>
      {draft.familyMembers.map((row, index) => {
        const number = String(index + 1);
        return (
          <fieldset
            key={number}
            className={`grid gap-2 rounded-control border border-border-subtle p-3 sm:grid-cols-2 xl:grid-cols-4 2xl:items-center 2xl:rounded-none 2xl:border-0 2xl:p-0 ${FAMILY_COLUMNS}`}
          >
            <legend className="sr-only">Family member {number}</legend>
            <span aria-hidden="true" className="text-13 font-medium">
              {number}.
            </span>
            <FormField label="11a. Full Name" hideLabelFrom="2xl">
              {(field) => (
                <Input
                  {...field}
                  value={row.fullName ?? ""}
                  onChange={(event) => {
                    setRow(index, "fullName", event.target.value);
                  }}
                />
              )}
            </FormField>
            <FormField label="b. Birthday" hideLabelFrom="2xl">
              {(field) => (
                <DateInput
                  {...field}
                  value={row.birthday ?? ""}
                  onValueChange={(value) => {
                    setRow(index, "birthday", value);
                  }}
                />
              )}
            </FormField>
            {textColumns.map(([key, label]) => (
              <FormField key={key} label={label} hideLabelFrom="2xl">
                {(field) => (
                  <Input
                    {...field}
                    value={row[key] ?? ""}
                    onChange={(event) => {
                      setRow(index, key, event.target.value);
                    }}
                  />
                )}
              </FormField>
            ))}
            <FormField label="d. Sex" hideLabelFrom="2xl">
              {(field) => (
                <Select
                  {...field}
                  value={row.sex ?? ""}
                  onChange={(event) => {
                    setRow(index, "sex", event.target.value);
                  }}
                >
                  <option value="">Select</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </Select>
              )}
            </FormField>
            {(
              [
                ["civilStatus", "e. Civil Status"],
                ["education", "f. Highest Education"],
                ["occupation", "g. Occupation"],
              ] as const
            ).map(([key, label]) => (
              <FormField key={key} label={label} hideLabelFrom="2xl">
                {(field) => (
                  <Input
                    {...field}
                    value={row[key] ?? ""}
                    onChange={(event) => {
                      setRow(index, key, event.target.value);
                    }}
                  />
                )}
              </FormField>
            ))}
            <FormField label="h. Monthly Income" hideLabelFrom="2xl">
              {(field) => (
                <Input
                  {...field}
                  inputMode="decimal"
                  placeholder="PHP"
                  value={row.monthlyIncome ?? ""}
                  onChange={(event) => {
                    setRow(index, "monthlyIncome", event.target.value);
                  }}
                />
              )}
            </FormField>
          </fieldset>
        );
      })}
    </div>
  );
}

const PANEL = "rounded-control border border-border-subtle p-4";

function Underwent({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  const shared = { draft, setDraft };
  return (
    <section className={PANEL}>
      <p className="mb-2 text-15 font-medium">
        12 The underwent the following{" "}
        <span className="text-12 font-normal text-text-muted italic">
          (check all applicable and details)
        </span>
      </p>
      <div className="flex flex-col gap-1">
        <ExtraCheck
          {...shared}
          name="breastfed"
          label="Breastfeeding - breastfed to"
        />
        <ExtraText {...shared} name="breastfedMonths" label="months" />
        <ExtraCheck
          {...shared}
          name="supplemental"
          label="Supplemental Feeding - supplemented to"
        />
        <ExtraText {...shared} name="supplementalDays" label="days" />
        <ExtraCheck
          {...shared}
          name="riceDistribution"
          label="Food for School(Rice Distribution) - weekly allotment of"
        />
        <ExtraText {...shared} name="riceKg" label="kg" />
        <ExtraCheck
          {...shared}
          name="assistance"
          label="Assessment of Assistance by Disability from"
        />
        <div className="flex flex-col pl-6">
          <ExtraCheck
            {...shared}
            name="assistanceGovernment"
            label="Government Hospital/Clinic/Health Unit"
          />
          <ExtraCheck
            {...shared}
            name="assistancePrivate"
            label="Private Hospitals/Clinic/Medical Personnel"
          />
          <ExtraCheck {...shared} name="assistanceOthers" label="Others:" />
          <ExtraText
            {...shared}
            name="assistanceOthersText"
            label="Others, details"
          />
        </div>
      </div>
    </section>
  );
}

function Disabilities({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  function setRow(index: number, key: "type" | "cause", value: string) {
    setDraft((current) => ({
      ...current,
      disabilities: current.disabilities.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    }));
  }
  return (
    <section>
      <h3 className="mb-2 text-15 font-medium text-primary">
        13. The Child has the following disabilities/impairments:
      </h3>
      <div className={`flex flex-col gap-3 ${PANEL}`}>
        {draft.disabilities.map((row, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <FormField
              label="a. Disability/impairment"
              hint={index === 0 ? "e.g. hearing, speech, visual" : undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  value={row.type ?? ""}
                  onChange={(event) => {
                    setRow(index, "type", event.target.value);
                  }}
                />
              )}
            </FormField>
            <FormField
              label="b.Cause"
              hint={index === 0 ? "e.g. inborn, illness" : undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  value={row.cause ?? ""}
                  onChange={(event) => {
                    setRow(index, "cause", event.target.value);
                  }}
                />
              )}
            </FormField>
          </div>
        ))}
      </div>
    </section>
  );
}

function EccdExperience({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  function setRow(index: number, key: string, value: string) {
    setDraft((current) => ({
      ...current,
      eccd: current.eccd.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    }));
  }
  return (
    <section>
      <h3 className="mb-2 text-15 font-medium text-primary">
        14. The child has the following past ECCD experience:
      </h3>
      <div className={`flex flex-col gap-3 ${PANEL}`}>
        {draft.eccd.map((row, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="a. Service Type"
              hint={index === 0 ? "e.g. Center, Community" : undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  value={row.serviceType ?? ""}
                  onChange={(event) => {
                    setRow(index, "serviceType", event.target.value);
                  }}
                />
              )}
            </FormField>
            <FormField
              label="b. Service"
              hint={
                index === 0 ? "e.g. Child Minding Day Care Mother" : undefined
              }
            >
              {(field) => (
                <Input
                  {...field}
                  value={row.service ?? ""}
                  onChange={(event) => {
                    setRow(index, "service", event.target.value);
                  }}
                />
              )}
            </FormField>
            <FormField label="c. From(Start date)">
              {(field) => (
                <DateInput
                  {...field}
                  value={row.from ?? ""}
                  onValueChange={(value) => {
                    setRow(index, "from", value);
                  }}
                />
              )}
            </FormField>
            <FormField label="d. To (End Date)">
              {(field) => (
                <DateInput
                  {...field}
                  value={row.to ?? ""}
                  onValueChange={(value) => {
                    setRow(index, "to", value);
                  }}
                />
              )}
            </FormField>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HealthPanels({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Underwent draft={draft} setDraft={setDraft} />
      <div className="flex min-w-0 flex-col gap-4">
        <Disabilities draft={draft} setDraft={setDraft} />
        <EccdExperience draft={draft} setDraft={setDraft} />
      </div>
    </div>
  );
}

export function FeesAndSignOff({
  draft,
  setDraft,
}: {
  draft: ExtraDraft;
  setDraft: SetDraft;
}) {
  const shared = { draft, setDraft };
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_2fr]">
      <section className={PANEL}>
        <h3 className="text-15 font-medium">15a. Participation Fee</h3>
        <ExtraCheck {...shared} name="feePaid" label="Paid amount of:" />
        <ExtraText {...shared} name="feeAmount" label="Amount in PHP" />
        <h3 className="mt-3 text-13 font-medium">15b. Parents’ Counterpart</h3>
        <div className="flex flex-col">
          <ExtraCheck {...shared} name="counterpartCash" label="Cash" />
          <ExtraCheck {...shared} name="counterpartInKind" label="In Kind" />
          <ExtraCheck {...shared} name="counterpartNone" label="None" />
        </div>
      </section>
      <section className={PANEL}>
        <h3 className="text-15 font-medium">16. Schedule</h3>
        <div className="flex flex-col">
          <ExtraCheck {...shared} name="scheduleCash" label="Cash" />
          <ExtraCheck {...shared} name="scheduleInKind" label="In Kind" />
        </div>
      </section>
      <section className={PANEL}>
        <h3 className="text-15 font-medium">17. Attendance</h3>
        <div className="flex flex-col">
          <ExtraCheck
            {...shared}
            name="attendanceContinuing"
            label="Continuing"
          />
          <ExtraCheck
            {...shared}
            name="attendanceDroppedOut"
            label="Dropped Out"
          />
        </div>
        <p className="mt-2 text-13 font-medium">if drop out, reason</p>
        <div className="flex flex-col">
          <ExtraCheck {...shared} name="dropIllness" label="Illness" />
          <ExtraCheck
            {...shared}
            name="dropTransfer"
            label="Transfer of Residence"
          />
          <ExtraCheck {...shared} name="dropOthers" label="Others (Specify)" />
          <ExtraText
            {...shared}
            name="dropOthersText"
            label="Others, details"
          />
        </div>
      </section>
      <section className="grid content-start gap-4 sm:grid-cols-2">
        <ExtraText {...shared} name="accomplishedBy" label="Accomplished By:" />
        <FormField label="Date Accomplished">
          {(field) => (
            <DateInput
              {...field}
              value={draft.dateAccomplished ?? ""}
              onValueChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  dateAccomplished: value,
                }));
              }}
            />
          )}
        </FormField>
        <ExtraText
          {...shared}
          name="providerName"
          label="Name and Signature of ECCD Service Provider:"
        />
        <ExtraText {...shared} name="encoderId" label="Encoder ID" />
      </section>
    </div>
  );
}

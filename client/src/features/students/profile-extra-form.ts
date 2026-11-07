import {
  DISABILITIES_MAX,
  ECCD_MAX,
  FAMILY_MEMBERS_MAX,
  type ProfileExtra,
} from "@ricportal/shared";

type Rows<K extends keyof ProfileExtra> = NonNullable<ProfileExtra[K]>;

// The form always shows every row of its tables; what is saved leaves out blanks.
export type ExtraDraft = Omit<
  ProfileExtra,
  "familyMembers" | "disabilities" | "eccd"
> & {
  familyMembers: Rows<"familyMembers">;
  disabilities: Rows<"disabilities">;
  eccd: Rows<"eccd">;
};

function padded<T>(rows: T[] | undefined, length: number): T[] {
  return Array.from({ length }, (_, index) => rows?.[index] ?? ({} as T));
}

// The program runs in one municipality, so a new student starts with its address.
export const NEW_STUDENT_DEFAULTS: ProfileExtra = {
  facilityMunicipality: "Libmanan",
  facilityProvince: "Camarines Sur",
  facilityRegion: "Region V",
  homeMunicipality: "Libmanan",
  homeProvince: "Camarines Sur",
  homeRegion: "Region V",
};

export function toDraft(extra: ProfileExtra | null): ExtraDraft {
  const source = extra ?? NEW_STUDENT_DEFAULTS;
  return {
    ...source,
    familyMembers: padded(source.familyMembers, FAMILY_MEMBERS_MAX),
    disabilities: padded(source.disabilities, DISABILITIES_MAX),
    eccd: padded(source.eccd, ECCD_MAX),
  };
}

function isFilled(value: unknown): boolean {
  return value !== "" && value !== false && value !== undefined;
}

function compactRow<T extends object>(row: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => isFilled(value)),
  ) as Partial<T>;
}

function compactRows<T extends object>(rows: T[]): Partial<T>[] {
  return rows.map(compactRow).filter((row) => Object.keys(row).length > 0);
}

// Only what was filled in. Lists with no rows are left out.
export function toProfileExtra(draft: ExtraDraft): ProfileExtra {
  const { familyMembers, disabilities, eccd, ...fields } = draft;
  const family = compactRows(familyMembers);
  const impairments = compactRows(disabilities);
  const experience = compactRows(eccd);
  return {
    ...compactRow(fields),
    ...(family.length > 0 ? { familyMembers: family } : {}),
    ...(impairments.length > 0 ? { disabilities: impairments } : {}),
    ...(experience.length > 0 ? { eccd: experience } : {}),
  };
}

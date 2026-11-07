import { profileExtraSchema, studentCreateSchema } from "@ricportal/shared";
import { describe, expect, it } from "vitest";

const VALID = {
  facilityLocation: "Sibujo Day Care",
  facilityBarangay: "Sibujo",
  facilityMunicipality: "Libmanan",
  facilityProvince: "Camarines Sur",
  facilityRegion: "Region V",
  nickname: "Nene",
  suffix: "Jr",
  birthPlace: "Libmanan",
  birthRegistered: "YES",
  homeStreet: "12 Rizal St.",
  familyMembers: [
    {
      fullName: "Rosa Dela Cruz",
      birthday: "1995-02-28",
      relationship: "Mother",
      sex: "F",
      civilStatus: "Married",
      education: "College",
      occupation: "Vendor",
      monthlyIncome: "8000.50",
    },
  ],
  breastfed: true,
  breastfedMonths: "12",
  disabilities: [{ type: "Hearing", cause: "Inborn" }],
  eccd: [
    {
      serviceType: "Center",
      service: "Child Minding",
      from: "2025-06-01",
      to: "2026-03-31",
    },
  ],
  feePaid: true,
  feeAmount: "150.00",
  counterpartCash: true,
  attendanceContinuing: true,
  accomplishedBy: "Ana Cruz",
  dateAccomplished: "2026-06-01",
};

function refuses(value: unknown) {
  expect(profileExtraSchema.safeParse(value).success).toBe(false);
}

describe("profile_extra (D9)", () => {
  it("accepts a full form and an empty one", () => {
    expect(profileExtraSchema.safeParse(VALID).success).toBe(true);
    expect(profileExtraSchema.safeParse({}).success).toBe(true);
  });

  it("treats blank optional values as allowed", () => {
    expect(
      profileExtraSchema.safeParse({
        birthRegistered: "",
        feeAmount: "",
        dateAccomplished: "",
        familyMembers: [{ fullName: "", birthday: "", sex: "" }],
      }).success,
    ).toBe(true);
  });

  it.each([
    ["a number for text", { nickname: 5 }],
    ["text for a checkbox", { breastfed: "yes" }],
    ["an object for text", { birthPlace: {} }],
    ["an unknown choice", { birthRegistered: "MAYBE" }],
    ["family members not a list", { familyMembers: "Rosa" }],
    ["a wrong type inside a row", { familyMembers: [{ fullName: 5 }] }],
    ["a bad sex in a row", { familyMembers: [{ sex: "X" }] }],
    ["an impossible birthday", { familyMembers: [{ birthday: "2023-02-30" }] }],
    ["a date in the display form", { dateAccomplished: "06/01/2026" }],
    ["a bad amount", { feeAmount: "abc" }],
    ["a negative amount", { feeAmount: "-5" }],
    ["an array at the top", []],
    ["a string at the top", "hello"],
  ])("refuses %s", (_name, value) => {
    refuses(value);
  });

  it("refuses unknown keys, at the top and inside a row", () => {
    refuses({ surprise: "x" });
    refuses({ familyMembers: [{ fullName: "Rosa", surprise: "x" }] });
    refuses({ disabilities: [{ type: "Hearing", surprise: "x" }] });
  });

  it("limits the rows to what the form shows", () => {
    refuses({ familyMembers: Array.from({ length: 6 }, () => ({})) });
    refuses({ disabilities: Array.from({ length: 4 }, () => ({})) });
    refuses({ eccd: Array.from({ length: 3 }, () => ({})) });
  });

  it("refuses text that is too long", () => {
    refuses({ nickname: "x".repeat(121) });
    expect(
      profileExtraSchema.safeParse({ nickname: "x".repeat(120) }).success,
    ).toBe(true);
  });

  it("refuses a form too large as a whole, though each field fits", () => {
    const long = "x".repeat(120);
    const member = {
      fullName: long,
      relationship: long,
      civilStatus: long,
      education: long,
      occupation: long,
    };
    const eccdRow = { serviceType: long, service: long };
    const large = {
      familyMembers: Array.from({ length: 5 }, () => member),
      disabilities: Array.from({ length: 3 }, () => ({
        type: long,
        cause: long,
      })),
      eccd: [eccdRow, eccdRow],
      facilityLocation: long,
      facilityBarangay: long,
      facilityMunicipality: long,
      facilityProvince: long,
      facilityRegion: long,
      homeStreet: long,
      homeBarangay: long,
      homeMunicipality: long,
      homeProvince: long,
      homeRegion: long,
      birthPlace: long,
      nickname: long,
      accomplishedBy: long,
      providerName: long,
      encoderId: long,
      dropOthersText: long,
      assistanceOthersText: long,
      suffix: long,
    };
    const result = profileExtraSchema.safeParse(large);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("too large");
  });
});

describe("the student schemas take profile_extra", () => {
  const CHILD = {
    lastName: "Dela Cruz",
    firstName: "Maria",
    gender: "F",
    birthdate: "2023-01-15",
    weightKg: "14.50",
    heightCm: "96.5",
    parentGuardianName: "Rosa Dela Cruz",
  };

  it("is optional, and valid when given", () => {
    expect(studentCreateSchema.safeParse(CHILD).success).toBe(true);
    expect(
      studentCreateSchema.safeParse({ ...CHILD, profileExtra: VALID }).success,
    ).toBe(true);
  });

  it("refuses a bad one", () => {
    expect(
      studentCreateSchema.safeParse({
        ...CHILD,
        profileExtra: { nickname: 5 },
      }).success,
    ).toBe(false);
  });
});

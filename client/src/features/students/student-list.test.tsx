import { describe, expect, it } from "vitest";
import { toDraft, toProfileExtra } from "./profile-extra-form";
import { earlierSchoolYears, studentCode, yearOf } from "./student-list";

describe("student list helpers", () => {
  it("builds the display code from the school year and id", () => {
    expect(studentCode({ id: 7, schoolYear: "2026-2027" })).toBe("RIC 26-007");
    expect(studentCode({ id: 1234, schoolYear: "2026-2027" })).toBe(
      "RIC 26-1234",
    );
  });

  it("names the year as Figma does", () => {
    expect(yearOf("2026-2027")).toBe("2026");
  });

  it("lists the four earlier school years, newest first", () => {
    expect(earlierSchoolYears("2026-2027")).toEqual([
      "2025-2026",
      "2024-2025",
      "2023-2024",
      "2022-2023",
    ]);
  });
});

describe("the profile_extra draft", () => {
  it("a new student starts with the municipality and every table row", () => {
    const draft = toDraft(null);
    expect(draft.homeMunicipality).toBe("Libmanan");
    expect(draft.familyMembers).toHaveLength(5);
    expect(draft.disabilities).toHaveLength(3);
    expect(draft.eccd).toHaveLength(2);
  });

  it("an existing student does not get the defaults added", () => {
    expect(toDraft({ nickname: "Nene" }).homeMunicipality).toBe(undefined);
  });

  it("saves only what was filled in", () => {
    const draft = toDraft({});
    draft.nickname = "Nene";
    draft.birthPlace = "";
    draft.breastfed = false;
    draft.supplemental = true;
    draft.familyMembers[1] = { fullName: "Rosa", sex: "" };
    expect(toProfileExtra(draft)).toEqual({
      nickname: "Nene",
      supplemental: true,
      familyMembers: [{ fullName: "Rosa" }],
    });
  });

  it("an untouched draft saves nothing but the defaults", () => {
    expect(toProfileExtra(toDraft({}))).toEqual({});
  });

  it("a saved form survives the round trip", () => {
    const saved = {
      nickname: "Nene",
      breastfed: true,
      familyMembers: [{ fullName: "Rosa", birthday: "1995-02-28" }],
      eccd: [{ service: "Child Minding" }],
    };
    expect(toProfileExtra(toDraft(saved))).toEqual(saved);
  });
});

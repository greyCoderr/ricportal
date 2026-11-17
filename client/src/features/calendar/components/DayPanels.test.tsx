import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DayPanels } from "./DayPanels";

// Plan 5 J2: the day panels against PARENT CALENDAR 393:1133 (phones) and RIC
// calendar 166:1553 (desktop).
const PARENTS = [
  { id: 1, fullName: "Carmen Ramos" },
  { id: 2, fullName: "Rosa Dela Cruz" },
];

function show(parentsLabel?: string) {
  return render(
    <DayPanels
      date="2026-11-13"
      menuName="Lumpia Medley"
      parents={PARENTS}
      {...(parentsLabel === undefined ? {} : { parentsLabel })}
      purchaseRequest={<p>rows</p>}
    />,
  );
}

describe("DayPanels", () => {
  it("names the parents panel as the Teacher frame does, by default", () => {
    show();
    expect(screen.getByText("Assigned Parents")).toBeTruthy();
  });

  it("takes the Parent frame's words for the Parent calendar", () => {
    show("Parents assigned");
    expect(screen.getByText("Parents assigned")).toBeTruthy();
    expect(screen.queryByText("Assigned Parents")).toBeNull();
  });

  it("on phones the tags reach the screen edge and are 52 px high (py-4)", () => {
    show();
    const menuTag = screen.getByText("Menu for 11/13/2026");
    const parentsTag = screen.getByText("Assigned Parents");
    expect(menuTag.classList).toContain("py-4");
    expect(menuTag.classList).toContain("-ml-4");
    expect(menuTag.classList).toContain("lg:ml-0");
    expect(parentsTag.classList).toContain("-mr-4");
    expect(parentsTag.classList).toContain("lg:mr-0");
  });

  it("the dish and the parents card hang from their tags by two short lines", () => {
    show();
    const dish = screen.getByText("Lumpia Medley");
    const card = screen.getByRole("list").parentElement;
    expect(dish.classList).toContain("ric-hang");
    expect(card?.classList).toContain("ric-hang");
  });

  it("the parents card is as wide as its names, not a fixed width", () => {
    show();
    const card = screen.getByRole("list").parentElement;
    expect(card?.classList).toContain("w-fit");
    expect(card?.classList).not.toContain("w-full");
  });
});

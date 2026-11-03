import { describe, expect, it } from "vitest";
import { ValidationError } from "./errors.js";
import { parsePagination } from "./pagination.js";

function validationErrorFrom(query: Record<string, unknown>): ValidationError {
  try {
    parsePagination(query);
  } catch (error) {
    if (error instanceof ValidationError) {
      return error;
    }
    throw error;
  }
  throw new Error("parsePagination did not throw");
}

describe("parsePagination", () => {
  it("uses page 1 and pageSize 20 by default", () => {
    expect(parsePagination({})).toEqual({
      page: 1,
      pageSize: 20,
      skip: 0,
      take: 20,
    });
  });

  it("computes skip and take", () => {
    expect(parsePagination({ page: "3", pageSize: "10" })).toEqual({
      page: 3,
      pageSize: 10,
      skip: 20,
      take: 10,
    });
  });

  it("allows the maximum pageSize of 100", () => {
    expect(parsePagination({ pageSize: "100" }).pageSize).toBe(100);
  });

  it.each(["0", "-1", "abc", "2.5", ["1", "2"]])("rejects page=%o", (page) => {
    const error = validationErrorFrom({ page });

    expect(error.details).toEqual([
      { field: "page", message: "Must be a whole number of 1 or more." },
    ]);
  });

  it.each(["0", "101", "500", "abc"])("rejects pageSize=%s", (pageSize) => {
    const error = validationErrorFrom({ pageSize });

    expect(error.details).toEqual([
      {
        field: "pageSize",
        message: "Must be a whole number from 1 to 100.",
      },
    ]);
  });

  it("reports both fields when both are invalid", () => {
    const error = validationErrorFrom({ page: "x", pageSize: "x" });

    expect(error.details.map((d) => d.field)).toEqual(["page", "pageSize"]);
  });
});

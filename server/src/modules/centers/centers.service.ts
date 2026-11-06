import type {
  centerCreateSchema,
  centerPatchSchema,
  CenterDto,
} from "@ricportal/shared";
import type { z } from "zod";
import {
  ConflictError,
  NotFoundError,
  RuleViolationError,
} from "../../core/errors.js";
import type { CentersRepository } from "./centers.repository.js";

const DUPLICATE = new ConflictError("A center with this name already exists.", [
  { field: "name", message: "A center with this name already exists." },
]);

export function createCentersService(repository: CentersRepository) {
  return {
    list(input: { q?: string | undefined; skip: number; take: number }) {
      return repository.list(input);
    },

    async create(
      input: z.output<typeof centerCreateSchema>,
    ): Promise<CenterDto> {
      if ((await repository.findByName(input.name)) !== null) {
        throw DUPLICATE;
      }
      return repository.create(input);
    },

    async update(
      id: number,
      input: z.output<typeof centerPatchSchema>,
    ): Promise<CenterDto> {
      const current = await repository.findById(id);
      if (current === null) {
        throw new NotFoundError("This center was not found.");
      }
      if (input.name !== undefined && input.name !== current.name) {
        const other = await repository.findByName(input.name);
        if (other !== null && other.id !== id) {
          throw DUPLICATE;
        }
      }
      if (
        input.isActive === false &&
        (await repository.countActiveTeachers(id)) > 0
      ) {
        throw new RuleViolationError(
          `${current.name} still has an active RIC Teacher. Disable or move the Teacher first.`,
        );
      }
      const data: Parameters<CentersRepository["update"]>[1] = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.barangay !== undefined) data.barangay = input.barangay;
      if (input.address !== undefined) data.address = input.address;
      if (input.isActive !== undefined) data.isActive = input.isActive;
      return repository.update(id, data);
    },
  };
}

export type CentersService = ReturnType<typeof createCentersService>;

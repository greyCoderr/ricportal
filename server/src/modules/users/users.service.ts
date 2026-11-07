import {
  PASSWORD_RESET_MESSAGE,
  type PasswordResetResult,
  type ParentDto,
  type teacherCreateSchema,
  type TeacherDto,
  type TeacherListQuery,
  type teacherPatchSchema,
  type UserStatus,
} from "@ricportal/shared";
import type { z } from "zod";
import {
  ConflictError,
  NotFoundError,
  RuleViolationError,
  StateInvalidError,
} from "../../core/errors.js";
import { hashPassword } from "../../core/password.js";
import type { UsersRepository } from "./users.repository.js";

type TeacherRow = NonNullable<
  Awaited<ReturnType<UsersRepository["findTeacher"]>>
>;
type ParentRow = NonNullable<
  Awaited<ReturnType<UsersRepository["findParentInCenter"]>>
>;

function toTeacherDto(row: TeacherRow): TeacherDto {
  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    mobile: row.mobile,
    status: row.status,
    centerId: row.centerId,
    centerName: row.center?.name ?? null,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
  };
}

function toParentDto(row: ParentRow): ParentDto {
  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    mobile: row.mobile,
    status: row.status,
    childName: row.parentProfile?.childName ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// Status machine (blueprint 4.9). Moving to the state it is already in returns
// the current state (a repeated approve is safe).
const PARENT_MOVES: Record<string, { from: UserStatus[]; to: UserStatus }> = {
  approve: { from: ["PENDING"], to: "ACTIVE" },
  decline: { from: ["PENDING"], to: "DECLINED" },
  disable: { from: ["ACTIVE"], to: "DISABLED" },
  enable: { from: ["DECLINED", "DISABLED"], to: "ACTIVE" },
};

export type ParentAction = "approve" | "decline" | "disable" | "enable";

export function createUsersService(deps: {
  repository: UsersRepository;
  bcryptCost: number;
  defaultPassword: string;
}) {
  const { repository, bcryptCost, defaultPassword } = deps;

  // D6: sets the default, forces a change at next login, ends old sessions and
  // clears a lockout. Only a plain message goes back.
  async function resetToDefault(id: number): Promise<PasswordResetResult> {
    await repository.resetPassword(
      id,
      await hashPassword(defaultPassword, bcryptCost),
    );
    return { message: PASSWORD_RESET_MESSAGE };
  }

  async function requireTeacherSlot(centerId: number, exceptId?: number) {
    const others = await repository.countOtherActiveTeachers(
      centerId,
      exceptId,
    );
    if (others > 0) {
      throw new ConflictError(
        "This center already has an active RIC Teacher.",
        [
          {
            field: "centerId",
            message: "This center already has an active RIC Teacher.",
          },
        ],
      );
    }
  }

  async function requireActiveCenter(centerId: number) {
    const center = await repository.findCenter(centerId);
    if (center?.isActive !== true) {
      throw new RuleViolationError("This center is not active.", [
        { field: "centerId", message: "Choose an active center." },
      ]);
    }
  }

  return {
    async listTeachers(
      input: { skip: number; take: number } & TeacherListQuery,
    ) {
      const { rows, total } = await repository.listTeachers(input);
      return { rows: rows.map(toTeacherDto), total };
    },

    async createTeacher(
      input: z.output<typeof teacherCreateSchema>,
    ): Promise<TeacherDto> {
      await requireActiveCenter(input.centerId);
      if (await repository.usernameExists(input.username)) {
        throw new ConflictError("This username is already taken.", [
          { field: "username", message: "This username is already taken." },
        ]);
      }
      await requireTeacherSlot(input.centerId);
      const row = await repository.createTeacher({
        username: input.username,
        fullName: input.fullName,
        mobile: input.mobile,
        centerId: input.centerId,
        passwordHash: await hashPassword(
          input.password ?? defaultPassword,
          bcryptCost,
        ),
      });
      return toTeacherDto(row);
    },

    async updateTeacher(
      id: number,
      input: z.output<typeof teacherPatchSchema>,
    ): Promise<TeacherDto> {
      const current = await repository.findTeacher(id);
      if (current === null) {
        throw new NotFoundError("This RIC Teacher was not found.");
      }
      const centerId = input.centerId ?? current.centerId;
      const status = input.status ?? current.status;
      if (input.centerId !== undefined) {
        await requireActiveCenter(input.centerId);
      }
      if (status === "ACTIVE" && centerId !== null) {
        await requireTeacherSlot(centerId, id);
      }
      const data: Parameters<UsersRepository["updateTeacher"]>[1] = {};
      if (input.fullName !== undefined) data.fullName = input.fullName;
      if (input.mobile !== undefined) data.mobile = input.mobile;
      if (input.centerId !== undefined) data.centerId = input.centerId;
      if (input.status !== undefined) data.status = input.status;
      return toTeacherDto(await repository.updateTeacher(id, data));
    },

    async resetTeacherPassword(id: number) {
      if ((await repository.findTeacher(id)) === null) {
        throw new NotFoundError("This RIC Teacher was not found.");
      }
      return resetToDefault(id);
    },

    async listParents(input: {
      centerId: number;
      status?: UserStatus | undefined;
      skip: number;
      take: number;
    }) {
      const { rows, total } = await repository.listParents(input);
      return { rows: rows.map(toParentDto), total };
    },

    listApprovedParents(centerId: number) {
      return repository.listApprovedParents(centerId);
    },

    async moveParent(
      id: number,
      centerId: number,
      action: ParentAction,
    ): Promise<ParentDto> {
      const parent = await repository.findParentInCenter(id, centerId);
      if (parent === null) {
        throw new NotFoundError("This Parent was not found.");
      }
      const move = PARENT_MOVES[action];
      if (move === undefined) {
        throw new StateInvalidError();
      }
      if (parent.status === move.to) {
        return toParentDto(parent);
      }
      if (!move.from.includes(parent.status)) {
        throw new StateInvalidError(
          "This Parent cannot be changed this way right now.",
        );
      }
      return toParentDto(await repository.setParentStatus(id, move.to));
    },

    async resetParentPassword(id: number, centerId: number) {
      if ((await repository.findParentInCenter(id, centerId)) === null) {
        throw new NotFoundError("This Parent was not found.");
      }
      return resetToDefault(id);
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;

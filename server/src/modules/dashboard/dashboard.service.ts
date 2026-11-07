import type { DashboardSummary } from "@ricportal/shared";
import type { SettingsRepository } from "../settings/settings.repository.js";
import type { DashboardRepository } from "./dashboard.repository.js";

// Real counts for the Admin dashboard and the RIC Teachers cards (D10). Disabled
// teachers and archived students are left out of the counts that show activity.
export function createDashboardService(deps: {
  repository: DashboardRepository;
  settings: SettingsRepository;
}) {
  const { repository, settings } = deps;
  return {
    async summary(): Promise<DashboardSummary> {
      const schoolYear = await settings.currentSchoolYear();
      const [teachers, centers, enrolledStudents, reports, submittedByType] =
        await Promise.all([
          repository.teacherCounts(),
          repository.centersWithActiveTeacher(),
          repository.countActiveStudents(schoolYear),
          repository.reportCounts(),
          repository.submittedReportCountsByType(),
        ]);
      const teacherCount = (status: string) =>
        teachers.find((row) => row.status === status)?._count._all ?? 0;
      const reportCount = (status: string) =>
        reports.find((row) => row.status === status)?._count._all ?? 0;
      const typeCount = (type: string) =>
        submittedByType.find((row) => row.type === type)?._count._all ?? 0;
      return {
        activeTeachers: teacherCount("ACTIVE"),
        disabledTeachers: teacherCount("DISABLED"),
        centersWithTeacher: centers.length,
        enrolledStudents,
        reports: {
          submitted: reportCount("SUBMITTED"),
          needRevision: reportCount("NEED_REVISION"),
          approved: reportCount("APPROVED"),
        },
        submittedByType: {
          enrollment: typeCount("ENROLLMENT"),
          accomplishment: typeCount("ACCOMPLISHMENT"),
        },
      };
    },
  };
}

export type DashboardService = ReturnType<typeof createDashboardService>;

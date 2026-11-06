// MySQL DATE columns reach Prisma as a Date at midnight UTC. These two are the
// only conversions between that and our "YYYY-MM-DD" strings (BR-09).
export function toDbDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function fromDbDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

import type { HealthRepository } from "../src/modules/health/health.repository.js";

// Test-only health repositories, so app tests never need a database.
export function upRepository(): HealthRepository {
  return { ping: () => Promise.resolve() };
}

export function downRepository(error: Error): HealthRepository {
  return { ping: () => Promise.reject(error) };
}

export function hangingRepository(): HealthRepository {
  return { ping: () => new Promise<void>(() => undefined) };
}

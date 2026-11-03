import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { created, ok, paginated } from "./response.js";

function buildApp(): express.Express {
  const app = express();
  app.get("/ok", (_req, res) => {
    ok(res, { id: 1 });
  });
  app.get("/ok-meta", (_req, res) => {
    ok(res, { id: 1 }, { source: "test" });
  });
  app.post("/created", (_req, res) => {
    created(res, { id: 2 });
  });
  app.get("/list", (_req, res) => {
    paginated(res, [{ id: 1 }, { id: 2 }], {
      page: 2,
      pageSize: 2,
      total: 5,
    });
  });
  return app;
}

describe("response helpers", () => {
  const app = buildApp();

  it("ok returns 200 with data and empty meta", async () => {
    const res = await request(app).get("/ok");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { id: 1 }, meta: {} });
  });

  it("ok passes meta through", async () => {
    const res = await request(app).get("/ok-meta");

    expect(res.body).toEqual({ data: { id: 1 }, meta: { source: "test" } });
  });

  it("created returns 201 with data and empty meta", async () => {
    const res = await request(app).post("/created");

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { id: 2 }, meta: {} });
  });

  it("paginated returns items with page, pageSize and total", async () => {
    const res = await request(app).get("/list");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      meta: { page: 2, pageSize: 2, total: 5 },
    });
  });
});

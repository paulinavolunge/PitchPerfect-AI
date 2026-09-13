import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { initialState } from "../../supabase/functions/_shared/budget/state";
describe("Budget PostgreSQL migration", () => {
  it("denies browser roles and atomically rejects duplicate version updates", async () => {
    const db = new PGlite();
    try {
      await db.exec(
        "create role anon; create role authenticated; create role service_role bypassrls;",
      );
      await db.exec(
        readFileSync(
          "supabase/migrations/20260911015511_budget_prospect_sessions.sql",
          "utf8",
        ),
      );
      const privileges = await db.query<{
        anon: boolean;
        authenticated: boolean;
        service: boolean;
      }>(
        "select has_table_privilege('anon','public.budget_prospect_sessions','select') as anon,has_table_privilege('authenticated','public.budget_prospect_sessions','update') as authenticated,has_table_privilege('service_role','public.budget_prospect_sessions','update') as service",
      );
      expect(privileges.rows[0]).toEqual({
        anon: false,
        authenticated: false,
        service: true,
      });
      await db.exec("set role service_role");
      await db.query(
        "insert into public.budget_prospect_sessions(id,owner,document) values ($1,$2,$3)",
        ["s", "owner", JSON.stringify({ state: initialState() })],
      );
      const sql =
        "update public.budget_prospect_sessions set version=version+1 where id=$1 and owner=$2 and version=$3 returning version";
      const [a, b] = await Promise.all([
        db.query(sql, ["s", "owner", 0]),
        db.query(sql, ["s", "owner", 0]),
      ]);
      expect(a.rows.length + b.rows.length).toBe(1);
      expect((await db.query(sql, ["s", "attacker", 1])).rows).toHaveLength(0);
    } finally {
      await db.close();
    }
  }, 30000);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("all migrations: profile ownership, private reads, bounded funnel and anti-farm privileges", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
    `);
    const migrations = new URL("../supabase/migrations/", import.meta.url);
    for (const file of (await readdir(migrations)).filter((f) => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, migrations), "utf8"));
    const owner = "11111111-1111-4111-8111-111111111111";
    const other = "22222222-2222-4222-8222-222222222222";
    await db.exec(`insert into auth.users values ('${owner}', 'owner@example.com', '{"user_name":"owner","provider_id":"123"}'), ('${other}', 'other@example.com', '{"user_name":"other","provider_id":"456"}');`);
    await db.exec(`insert into public.quest_history(user_id,id,repository_full_name,kind,xp_reward,started_at,completed_at,verified_commit_sha) values ('${owner}','docker:owner/repo','owner/repo','docker',900,now(),now(),'${'a'.repeat(40)}');`);
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${owner}';`);
    await db.exec(`update public.profiles set headline='Engineer', bio='My bio', public_links=array['https://example.com/'], is_public=true where user_id='${owner}';`);
    assert.equal((await db.query<{ headline: string }>("select headline from public.profiles where username='owner'")).rows[0]?.headline, "Engineer");
    assert.equal((await db.query("update public.profiles set headline='attacker' where username='other' returning user_id")).rows.length, 0);
    for (const sql of [
      `update public.profiles set github_user_id=999 where user_id='${owner}'`,
      `update public.profiles set username='spoofed' where user_id='${owner}'`,
      `update public.profiles set user_id='${other}' where user_id='${owner}'`,
      `update public.profiles set headline=repeat('x',81) where user_id='${owner}'`,
      `update public.profiles set bio=repeat('x',501) where user_id='${owner}'`,
      `update public.profiles set public_links=array['javascript:alert(1)'] where user_id='${owner}'`,
      `update public.profiles set public_links=array['https://user:pass@example.com/'] where user_id='${owner}'`,
      `update public.player_progress set total_xp=99999 where user_id='${owner}'`,
      `delete from public.quest_history where user_id='${owner}'`,
      `insert into public.funnel_events(user_id,event) values ('${other}','login')`,
      `insert into public.funnel_events(user_id,event) values ('${owner}','arbitrary')`,
      `insert into public.funnel_events(user_id,event,event_day) values ('${owner}','login','2000-01-01')`,
      `select public.award_verified_quest_v2('${owner}','owner/repo','testing','${'a'.repeat(40)}',123,'github_commit_after_start','{}')`,
    ]) await assert.rejects(db.exec(sql), sql);
    await db.exec(`insert into public.funnel_events(user_id,event) values ('${owner}','login');`);
    await assert.rejects(db.exec(`insert into public.funnel_events(user_id,event) values ('${owner}','login')`));
    await assert.rejects(db.exec("select * from public.funnel_events"));
    await db.exec("reset role; set role anon; set request.jwt.claim.sub = '';");
    assert.deepEqual((await db.query("select username from public.profiles")).rows, [{ username: "owner" }]);
    assert.equal((await db.query("select id from public.quest_history")).rows.length, 1);
    await assert.rejects(db.exec(`insert into public.funnel_events(user_id,event) values ('${owner}','proof_share')`));
    await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub = '${owner}'; update public.profiles set is_public=false where user_id='${owner}'; reset role; set role anon; set request.jwt.claim.sub='';`);
    assert.equal((await db.query("select * from public.profiles")).rows.length, 0);
    assert.equal((await db.query("select * from public.quest_history")).rows.length, 0);
    assert.equal((await db.query("select * from public.player_progress")).rows.length, 0);
    await db.exec("reset role;");
    assert.equal((await db.query<{ total_xp: number }>("select total_xp from public.player_progress where user_id=$1", [owner])).rows[0]?.total_xp, 0);
  } finally { await db.close(); }
});

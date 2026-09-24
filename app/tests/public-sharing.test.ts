import assert from "node:assert/strict";
import { test } from "node:test";
import { loadPublicCard, publicMetadata, publicPath } from "../src/lib/public-sharing";

test("public metadata uses anonymous no-store reads, locales and verified proofs only", async () => {
  const originalFetch = global.fetch;
  const originalOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://proofquest.example";
  let visible = true;
  let verified = true;
  let count = 0;
  global.fetch = async (input, init) => {
    count++;
    const url = new URL(String(input));
    assert.equal(init?.cache, "no-store");
    if (url.pathname.endsWith("/profiles")) {
      assert.equal(url.searchParams.get("is_public"), "eq.true");
      return Response.json(visible ? { user_id: "owner", username: "alice", display_name: "Alice", headline: "Engineer", bio: "Hello" } : null);
    }
    assert.ok(url.pathname.endsWith("/quest_history"));
    assert.equal(url.searchParams.get("verified_commit_sha"), "not.is.null");
    return Response.json(verified ? { kind: "docker", repository_full_name: "alice/project", xp_reward: 900, verified_commit_sha: "a".repeat(40) } : null);
  };
  try {
    const profile = { username: "alice" };
    const proof = { ...profile, kind: "docker", owner: "alice", repo: "project" };
    assert.equal(publicPath(proof), "/u/alice/proof/docker/alice/project");
    for (const locale of ["fr", "en", "de", "es"] as const) {
      const meta = await publicMetadata(proof, locale);
      assert.equal(meta.alternates?.canonical, `https://proofquest.example/u/alice/proof/docker/alice/project?lang=${locale}`);
      assert.ok(JSON.stringify(meta.openGraph).includes(`lang=${locale}`));
      assert.ok(JSON.stringify(meta).includes("900 XP"));
    }
    assert.ok((await publicMetadata(profile, "en")).description?.includes("Engineer"));
    verified = false;
    assert.equal(await loadPublicCard(proof, "en"), null);
    visible = false;
    const privateMetadata = await publicMetadata(profile, "en");
    assert.deepEqual(privateMetadata.robots, { index: false, follow: false });
    assert.equal(privateMetadata.openGraph, null);
    const before = count;
    assert.equal(await loadPublicCard({ username: "invalid/name" }, "en"), null);
    assert.equal(count, before);
  } finally {
    global.fetch = originalFetch;
    if (originalOrigin === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalOrigin;
  }
});

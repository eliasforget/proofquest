import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProfileInput, safePublicLink } from "../src/lib/profile-input";
import { getProductCopy } from "../src/lib/product-i18n";

test("profile editing trims, bounds and projects only presentation fields", () => {
  assert.deepEqual(parseProfileInput({ headline: " Engineer ", bio: " Hi ", public_links: ["https://example.com", "https://example.com/"], github_user_id: 7, is_public: true }), { headline: "Engineer", bio: "Hi", public_links: ["https://example.com/"] });
  for (const input of [null, {}, { headline: "a".repeat(81), bio: "", public_links: [] }, { headline: "", bio: "a".repeat(501), public_links: [] }, { headline: "", bio: "", public_links: Array(4).fill("https://example.com") }]) assert.equal(parseProfileInput(input), null);
  assert.ok(parseProfileInput({ headline: "", bio: "", public_links: [] }));
});

test("public links reject executable, relative, credential and malformed URLs", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,x", "//example.com", "http://example.com", "https://user:pass@example.com", "https://example.com\\evil", "https://example.com/ hi", "https://localhost", "https://example.com/" + "é".repeat(60), null]) assert.equal(safePublicLink(url), null, String(url));
  assert.equal(safePublicLink("https://example.com/me?q=yes#bio"), "https://example.com/me?q=yes#bio");
});

test("all four locales include every product message", () => {
  const keys = Object.keys(getProductCopy("fr")).sort();
  for (const locale of ["fr", "en", "de", "es"] as const) {
    const copy = getProductCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), keys);
    assert.ok(Object.values(copy).every((value) => value.length > 0));
  }
});

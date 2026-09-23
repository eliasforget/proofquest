"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GitHubRepositorySummary } from "@/lib/github-account";
import { getAuthCopy } from "@/lib/auth-i18n";
import type { Locale } from "@/lib/i18n";

export function RepositoryPicker({
  repositories,
  locale,
}: {
  repositories: GitHubRepositorySummary[];
  locale: Locale;
}) {
  const copy = getAuthCopy(locale);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return repositories;

    return repositories.filter((repo) =>
      [
        repo.name,
        repo.fullName,
        repo.owner,
        repo.relationship,
        repo.description ?? "",
        repo.language ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, repositories]);

  return (
    <div className="repository-picker">
      <div className="repository-search-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.search}
          aria-label={copy.search}
        />
        <span>{filtered.length} / {repositories.length}</span>
      </div>

      <div className="repository-card-grid">
        {filtered.map((repo) => {
          const [owner, name] = repo.fullName.split("/");

          return (
            <article className="repository-card" key={repo.id}>
              <div className="repository-card-head">
                <div>
                  <span className="micro-label">{repo.language ?? "MULTI"}</span>
                  <h2>{repo.name}</h2>
                  <small className="repository-owner">@{repo.owner}</small>
                </div>
                <div className="repository-card-flags">
                  {repo.relationship === "member" ? <span>MEMBER</span> : null}
                  {repo.fork ? <span>FORK</span> : null}
                  {repo.archived ? <span>ARCHIVED</span> : null}
                </div>
              </div>
              <p>{repo.description ?? "—"}</p>
              <div className="repository-card-meta">
                <span>★ {repo.stars}</span>
                <span>⑂ {repo.forks}</span>
                <span>
                  {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                    new Date(repo.updatedAt),
                  )}
                </span>
              </div>
              <div className="repository-card-actions">
                <Link
                  className="cta compact-cta"
                  href={`/analyze/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`}
                >
                  {copy.analyze} →
                </Link>
                <a
                  className="ghost compact"
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub ↗
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="repository-empty">{copy.empty}</p>
      ) : null}
    </div>
  );
}

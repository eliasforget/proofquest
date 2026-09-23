"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n";

function parseRepository(input: string) {
  const normalized = input.trim().replace(/\.git$/i, "").replace(/\/$/, "");
  const withoutHost = normalized.replace(/^https?:\/\/github\.com\//i, "").replace(/^github\.com\//i, "");
  const [owner, repo, ...rest] = withoutHost.split("/").filter(Boolean);

  if (rest.length > 0 || !owner || !repo || !/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
  return { owner, repo };
}

export function AnalyzeRepositoryForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const t = getDictionary(locale).analyze;
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepository(value);
    if (!parsed) { setError(t.invalid); return; }
    setError(null);
    router.push(`/analyze/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`);
  }

  return (
    <form className="repo-form" onSubmit={submit}>
      <label htmlFor="repository">{t.label}</label>
      <div className="repo-input-row">
        <input id="repository" value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)} placeholder={t.placeholder} autoComplete="off" spellCheck={false} />
        <button className="cta" type="submit">{t.submit} <span>→</span></button>
      </div>
      <div className="repo-form-foot">{t.foot.map((item) => <span key={item}>{item}</span>)}</div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  );
}

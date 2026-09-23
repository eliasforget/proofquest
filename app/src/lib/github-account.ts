const GITHUB_API = "https://api.github.com";
const API_VERSION = "2026-03-10";

export type GitHubRepositorySummary = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  fork: boolean;
  archived: boolean;
  updatedAt: string;
};

export async function listPublicRepositoriesForUser(username: string) {
  if (!/^[A-Za-z0-9-]{1,39}$/.test(username)) return [];

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "ProofQuest",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&direction=desc&per_page=100`,
    { headers, next: { revalidate: 120 } },
  );

  if (!response.ok) return [];

  const rows = (await response.json()) as Array<{
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    fork: boolean;
    archived: boolean;
    updated_at: string;
  }>;

  return rows.map((repo): GitHubRepositorySummary => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    fork: repo.fork,
    archived: repo.archived,
    updatedAt: repo.updated_at,
  }));
}

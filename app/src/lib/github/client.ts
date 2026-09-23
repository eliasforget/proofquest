const GITHUB_API = "https://api.github.com";
const RAW_GITHUB = "https://raw.githubusercontent.com";
const API_VERSION = "2026-03-10";

export type GitHubRepository = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  owner: { login: string };
};

export type GitTreeItem = {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
};

export type GitTreeResponse = {
  tree: GitTreeItem[];
  truncated: boolean;
};

export class GitHubAnalysisError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubAnalysisError";
  }
}

function githubHeaders(accept = "application/vnd.github+json") {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "ProofQuest-MVP",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

function requestOptions(
  fresh: boolean,
  headers?: Record<string, string>,
): RequestInit {
  if (fresh) return { headers, cache: "no-store" };
  return { headers, next: { revalidate: 300 } };
}

export async function githubJson<T>(
  path: string,
  fresh: boolean,
): Promise<T> {
  const response = await fetch(
    `${GITHUB_API}${path}`,
    requestOptions(fresh, githubHeaders()),
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubAnalysisError(
        "Repository not found or not publicly accessible.",
        404,
      );
    }

    if (response.status === 403) {
      throw new GitHubAnalysisError(
        "GitHub refused the request. The unauthenticated API rate limit may have been reached; add an optional GITHUB_TOKEN in .env.local and retry.",
        403,
      );
    }

    throw new GitHubAnalysisError(
      `GitHub API returned ${response.status}.`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

function rawUrl(
  owner: string,
  repo: string,
  ref: string,
  path: string,
) {
  const encodePath = (value: string) =>
    value.split("/").map(encodeURIComponent).join("/");

  return `${RAW_GITHUB}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodePath(ref)}/${encodePath(path)}`;
}

export async function githubRawFile(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  fresh: boolean,
) {
  const response = await fetch(
    rawUrl(owner, repo, ref, path),
    requestOptions(fresh),
  );

  if (!response.ok) return null;
  return response.text();
}

import { z } from 'zod';

const GITHUB_STARS_API_URL = '/api/v1/github-stars';

const githubRepositoryResponseSchema = z.object({
	count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional()
});

type GitHubFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function fetchGitHubStarCount(fetcher: GitHubFetcher = fetch): Promise<number | null> {
	try {
		const response = await fetcher(GITHUB_STARS_API_URL, {
			cache: 'no-store'
		});
		if (!response.ok) return null;

		const data = githubRepositoryResponseSchema.safeParse(await response.json());
		return data.success ? (data.data.count ?? null) : null;
	} catch {
		return null;
	}
}

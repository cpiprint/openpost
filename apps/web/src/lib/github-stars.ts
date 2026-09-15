import { z } from 'zod';

const GITHUB_REPOSITORY_API_URL = 'https://api.github.com/repos/getopenpost/openpost';

const githubRepositoryResponseSchema = z.object({
	stargazers_count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});

type GitHubFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function fetchGitHubStarCount(fetcher: GitHubFetcher = fetch): Promise<number | null> {
	try {
		const response = await fetcher(GITHUB_REPOSITORY_API_URL, {
			headers: {
				Accept: 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			},
			cache: 'no-store'
		});
		if (!response.ok) return null;

		const data = githubRepositoryResponseSchema.safeParse(await response.json());
		return data.success ? data.data.stargazers_count : null;
	} catch {
		return null;
	}
}

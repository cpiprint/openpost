const GITHUB_REPOSITORY_API_URL = 'https://api.github.com/repos/getopenpost/openpost';

type GitHubRepositoryResponse = {
	stargazers_count?: unknown;
};

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

		const data = (await response.json()) as GitHubRepositoryResponse;
		return typeof data.stargazers_count === 'number' &&
			Number.isSafeInteger(data.stargazers_count) &&
			data.stargazers_count >= 0
			? data.stargazers_count
			: null;
	} catch {
		return null;
	}
}

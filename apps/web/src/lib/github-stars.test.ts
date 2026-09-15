import { describe, expect, it, vi } from 'vitest';
import { fetchGitHubStarCount } from './github-stars';

describe('GitHub star count', () => {
	it('reads the repository star count from GitHub', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response(JSON.stringify({ stargazers_count: 512 }), { status: 200 }));

		expect(await fetchGitHubStarCount(fetcher)).toBe(512);
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.github.com/repos/getopenpost/openpost',
			expect.objectContaining({
				cache: 'no-store',
				headers: expect.objectContaining({ Accept: 'application/vnd.github+json' })
			})
		);
	});

	it('hides unavailable or malformed counts', async () => {
		const unavailable = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 403 }));
		const malformed = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				new Response(JSON.stringify({ stargazers_count: '512' }), { status: 200 })
			);

		expect(await fetchGitHubStarCount(unavailable)).toBeNull();
		expect(await fetchGitHubStarCount(malformed)).toBeNull();
	});
});

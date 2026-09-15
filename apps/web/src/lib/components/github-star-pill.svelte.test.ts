import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GitHubStarPill from './github-star-pill.svelte';

describe('GitHub star pill', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shows the live count as a repository link', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValue(new Response(JSON.stringify({ stargazers_count: 512 }), { status: 200 }))
		);

		const screen = await render(GitHubStarPill);
		const link = screen.getByRole('link', { name: 'OpenPost on GitHub' });
		await expect.element(link).toBeVisible();
		await expect.element(link).toHaveAttribute('href', 'https://github.com/getopenpost/openpost');
		await expect.element(link).toHaveTextContent('512');
	});
});

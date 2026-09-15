<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { ThemeIcon } from '$lib/themes/icons';
	import { fetchGitHubStarCount } from '$lib/github-stars';

	const repositoryURL = 'https://github.com/getopenpost/openpost';
	let starCount = $state<number | null>(null);

	onMount(() => {
		let cancelled = false;
		void fetchGitHubStarCount().then((count) => {
			if (!cancelled) starCount = count;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if starCount !== null}
	<a
		href={repositoryURL}
		target="_blank"
		rel="noreferrer"
		class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-sidebar-border px-2 text-xs font-medium text-sidebar-foreground/70 tabular-nums transition-colors group-data-[collapsible=icon]:hidden hover:border-sidebar-foreground/30 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
		aria-label={m.sidebar_github_repository()}
		title={m.sidebar_github_repository()}
		data-testid="github-star-pill"
	>
		<ThemeIcon role="github" class="size-3.5" />
		<span>{starCount}</span>
	</a>
{/if}

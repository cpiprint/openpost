<script lang="ts">
	import { onMount } from 'svelte';
	import Github from '@lucide/svelte/icons/github';
	import { appUrl, githubUrl } from '../_marketing';

	const starCountURL = `${appUrl}/api/v1/github-stars`;
	let starCount = $state<number | null>(null);

	onMount(() => {
		let cancelled = false;

		void fetch(starCountURL, { cache: 'no-store' })
			.then(async (response) => {
				if (!response.ok) return null;
				// SAFETY: The value is checked for an integer and non-negative range immediately below.
				const data = (await response.json()) as { count?: number };
				const count = data.count;
				if (count === undefined || !Number.isSafeInteger(count) || count < 0) return null;
				return count;
			})
			.catch(() => null)
			.then((count) => {
				if (!cancelled) starCount = count;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if starCount !== null}
	<a
		href={githubUrl}
		target="_blank"
		rel="noreferrer"
		class="focus-ring inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:border-foreground/30 hover:bg-muted/70 hover:text-foreground"
		aria-label="OpenPost on GitHub"
		title="OpenPost on GitHub"
		data-testid="github-star-pill"
	>
		<Github class="size-3.5" aria-hidden="true" />
		<span>{starCount}</span>
	</a>
{/if}

import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { SocialAccount } from '$lib/api/client';
import type { components } from '$lib/api/types';
import ComposerRequiredFields from './composer-required-fields.svelte';

type ResolvedAccountCapability = components['schemas']['ResolvedAccountCapability'];
type ProviderReadinessDecision = components['schemas']['Decision'];
type SettingDefinition = components['schemas']['SettingDefinition'];

const discordAccount: SocialAccount = {
	id: 'discord-bot',
	slug: 'discord-bot',
	platform: 'discord_bot',
	account_id: 'guild-1',
	account_username: 'OpenPost bot',
	account_avatar_url: '',
	instance_url: '',
	is_active: true,
	thread_replies_supported: true,
	messaging_supported: true,
	messages_enabled: false,
	grant_destination_count: 1,
	shared_grant: false
};

function channelSetting(): SettingDefinition {
	return {
		key: 'channel_id',
		message_key: 'publishing.setting.channel_id',
		label: 'Channel',
		group: 'content',
		control: 'remote_picker',
		type: 'select',
		scope: 'destination',
		intents: ['post'],
		output_profiles: ['discord.post'],
		media_shapes: ['text'],
		required: true,
		required_policy: 'always',
		options_source: 'discord_channels',
		constraints: {}
	};
}

function healthyReadiness(): ProviderReadinessDecision {
	return {
		advertisable: true,
		connectable: true,
		analytics_ready: true,
		discoverable: true,
		executable: true,
		observable: true,
		facts: {
			approval: 'approved',
			authorization: 'authorized',
			configuration: 'configured',
			control: 'enabled',
			live_certification: 'passed',
			local_test: 'passed',
			policy: 'allowed'
		},
		publishable: true,
		state: 'healthy'
	};
}

function capability(setting: SettingDefinition): ResolvedAccountCapability {
	return {
		account_id: discordAccount.id,
		content: {
			body: { required: false },
			title: { required: false },
			description: { required: false },
			alt_text: { required: false }
		},
		active_constraints: {},
		available_formats: [],
		capability_revision: 'test',
		compatible: true,
		format_selection_required: false,
		immediate_readiness: healthyReadiness(),
		intents: ['post'],
		issues: [],
		label: 'Discord channel',
		media: {
			min_count: 0,
			max_count: 10,
			allowed_mimes: [],
			requires_public_url: false,
			requires_https_fetchable: false
		},
		media_shapes: ['text'],
		native_scheduling: false,
		openpost_queued: true,
		output_profile: 'discord.post',
		profile: 'post',
		provider: 'discord_bot',
		requires_app_review: false,
		requires_public_media: false,
		scheduled_readiness: healthyReadiness(),
		segment_strategy: 'preserve',
		setting_groups: [{ key: 'content', settings: [setting] }]
	};
}

it('keeps a lone required channel label left and select right', async () => {
	const screen = await render(ComposerRequiredFields, {
		props: {
			accounts: [discordAccount],
			resolvedByAccount: { [discordAccount.id]: capability(channelSetting()) },
			valuesByAccount: {},
			optionGroupsByAccount: {
				[discordAccount.id]: { discord_channels: [{ value: 'general', label: '#general' }] }
			},
			onChange: vi.fn(),
			onFormatChange: vi.fn(),
			onAddMedia: vi.fn()
		}
	});
	const select = screen.getByRole('button', { name: /Channel/ });
	await expect.element(select).toHaveClass('w-auto');
	await expect.element(select).not.toHaveClass('mt-1');
	const label = document.querySelector<HTMLLabelElement>(
		'label[for="required-discord-bot-channel_id"]'
	);
	expect(label?.parentElement).toHaveClass('justify-between');
});

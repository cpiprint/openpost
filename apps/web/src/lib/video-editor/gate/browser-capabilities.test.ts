import { describe, expect, it } from 'vitest';
import { detectVideoEditorBrowserSupport } from './browser-capabilities';

type TestEnvironment = {
	isSecureContext: boolean;
	showDirectoryPicker?: () => Promise<void>;
	showOpenFilePicker?: () => Promise<void>;
	indexedDB: { open: () => undefined };
	navigator: {
		storage: { getDirectory: () => Promise<object> };
		userAgent: string;
		brave?: unknown;
	};
	VideoEncoder: () => void;
	VideoDecoder: () => void;
	AudioEncoder?: () => void;
	AudioDecoder: () => void;
	VideoFrame: () => void;
	AudioData: () => void;
	OffscreenCanvas: () => void;
	WebAssembly: { instantiate: () => Promise<object> };
};

function supportedEnvironment(): TestEnvironment {
	return {
		isSecureContext: true,
		showDirectoryPicker: () => Promise.resolve(),
		showOpenFilePicker: () => Promise.resolve(),
		indexedDB: { open: () => undefined },
		navigator: {
			storage: {
				getDirectory: () =>
					Promise.resolve({
						getDirectoryHandle: () => Promise.resolve({ removeEntry: () => Promise.resolve() }),
						removeEntry: () => Promise.resolve()
					})
			},
			userAgent: 'Chrome/140.0.0.0'
		},
		VideoEncoder: function VideoEncoder() {},
		VideoDecoder: function VideoDecoder() {},
		AudioEncoder: function AudioEncoder() {},
		AudioDecoder: function AudioDecoder() {},
		VideoFrame: function VideoFrame() {},
		AudioData: function AudioData() {},
		OffscreenCanvas: function OffscreenCanvas() {},
		WebAssembly: { instantiate: () => Promise.resolve({}) }
	};
}

describe('video editor browser capabilities', () => {
	it('accepts the complete editor capability set', async () => {
		expect(await detectVideoEditorBrowserSupport(supportedEnvironment())).toEqual({
			supported: true
		});
	});

	it('blocks browsers without the File System Access picker', async () => {
		const environment = supportedEnvironment();
		environment.showDirectoryPicker = undefined;
		environment.navigator.userAgent = 'Mozilla/5.0 Firefox/142.0';

		expect(await detectVideoEditorBrowserSupport(environment)).toEqual({
			supported: false,
			issue: 'filesystem-api'
		});
	});

	it('explains a Brave filesystem block separately from unsupported browsers', async () => {
		const environment = supportedEnvironment();
		environment.showDirectoryPicker = undefined;
		environment.navigator.brave = {};

		expect(await detectVideoEditorBrowserSupport(environment)).toEqual({
			supported: false,
			issue: 'filesystem-blocked'
		});
	});

	it('reports storage policy failures before the editor opens', async () => {
		const environment = supportedEnvironment();
		environment.navigator.storage.getDirectory = () =>
			Promise.reject(new DOMException('Blocked', 'SecurityError'));

		expect(await detectVideoEditorBrowserSupport(environment)).toEqual({
			supported: false,
			issue: 'storage-blocked'
		});
	});

	it('reports blocked OPFS subdirectory access even when the root opens', async () => {
		const environment = supportedEnvironment();
		environment.navigator.storage.getDirectory = () =>
			Promise.resolve({
				getDirectoryHandle: () =>
					Promise.reject(
						new DOMException(
							'The request is not allowed by the user agent or the platform in the current context.',
							'NotAllowedError'
						)
					),
				removeEntry: () => Promise.resolve()
			});

		expect(await detectVideoEditorBrowserSupport(environment)).toEqual({
			supported: false,
			issue: 'storage-blocked'
		});
	});

	it('blocks an insecure editor entry point', async () => {
		const environment = supportedEnvironment();
		environment.isSecureContext = false;

		expect(await detectVideoEditorBrowserSupport(environment)).toEqual({
			supported: false,
			issue: 'secure-context'
		});
	});

	it('blocks browsers without the media processing APIs', async () => {
		const environment = supportedEnvironment();
		environment.AudioEncoder = undefined;

		expect(await detectVideoEditorBrowserSupport(environment)).toEqual({
			supported: false,
			issue: 'media-api'
		});
	});
});

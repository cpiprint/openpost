export type VideoEditorBrowserIssue =
	| 'secure-context'
	| 'filesystem-blocked'
	| 'filesystem-api'
	| 'storage-blocked'
	| 'media-api';

export interface VideoEditorBrowserSupport {
	supported: boolean;
	issue?: VideoEditorBrowserIssue;
}

interface BrowserNavigator {
	userAgent?: string;
	brave?: unknown;
	storage?: {
		getDirectory?: () => Promise<object>;
	};
}

interface BrowserEnvironment {
	isSecureContext?: boolean;
	showDirectoryPicker?: unknown;
	showOpenFilePicker?: unknown;
	indexedDB?: { open?: unknown };
	navigator?: BrowserNavigator;
	VideoEncoder?: unknown;
	VideoDecoder?: unknown;
	AudioEncoder?: unknown;
	AudioDecoder?: unknown;
	VideoFrame?: unknown;
	AudioData?: unknown;
	OffscreenCanvas?: unknown;
	WebAssembly?: { instantiate?: unknown };
}

interface OpfsDirectoryHandle {
	getDirectoryHandle: (
		name: string,
		options?: { create?: boolean }
	) => Promise<{ removeEntry: (name: string) => Promise<void> }>;
	removeEntry: (name: string) => Promise<void>;
}

/**
 * Probe an OPFS subdirectory create+delete round-trip. Opening the OPFS root
 * can succeed while subdirectory access throws NotAllowedError (site storage
 * blocked, private window, iframe permissions-policy, sandboxed Linux
 * Chromium), which previously passed the gate and surfaced later as an
 * uncaught getDirectoryHandle failure on editor load.
 */
async function supportsOpfsSubdirectories(
	getDirectory: () => Promise<object>,
	storage: NonNullable<BrowserNavigator['storage']>
): Promise<boolean> {
	try {
		// SAFETY: getDirectory is navigator.storage.getDirectory, whose result
		// always exposes directory reads; subdirectory support is probed below.
		const root = (await getDirectory.call(storage)) as Partial<OpfsDirectoryHandle>;
		if (typeof root.getDirectoryHandle !== 'function') return false;
		const probe = await root.getDirectoryHandle('openpost-capability-probe', { create: true });
		if (typeof root.removeEntry === 'function') {
			try {
				await root.removeEntry('openpost-capability-probe');
			} catch {
				// The probe proved write access; failing to clean it up is harmless.
			}
		}
		return !!probe;
	} catch {
		return false;
	}
}

function isBraveBrowser(environment: BrowserEnvironment): boolean {
	return (
		environment.navigator?.brave !== undefined ||
		/brave\//i.test(environment.navigator?.userAgent ?? '')
	);
}

function supportsFileSystemAccess(environment: BrowserEnvironment): boolean {
	return (
		typeof environment.showDirectoryPicker === 'function' &&
		typeof environment.showOpenFilePicker === 'function'
	);
}

function supportsMediaProcessing(environment: BrowserEnvironment): boolean {
	return (
		typeof environment.VideoEncoder === 'function' &&
		typeof environment.VideoDecoder === 'function' &&
		typeof environment.AudioEncoder === 'function' &&
		typeof environment.AudioDecoder === 'function' &&
		typeof environment.VideoFrame === 'function' &&
		typeof environment.AudioData === 'function' &&
		typeof environment.OffscreenCanvas === 'function' &&
		typeof environment.WebAssembly?.instantiate === 'function'
	);
}

function currentEnvironment(): BrowserEnvironment {
	if (typeof window === 'undefined') return {};
	// SAFETY: this adapter reads optional browser capabilities from the current global object after the SSR guard.
	const browser = globalThis as BrowserEnvironment;
	return {
		isSecureContext: window.isSecureContext,
		showDirectoryPicker: window.showDirectoryPicker,
		showOpenFilePicker: window.showOpenFilePicker,
		indexedDB: browser.indexedDB,
		navigator: window.navigator,
		VideoEncoder: browser.VideoEncoder,
		VideoDecoder: browser.VideoDecoder,
		AudioEncoder: browser.AudioEncoder,
		AudioDecoder: browser.AudioDecoder,
		VideoFrame: browser.VideoFrame,
		AudioData: browser.AudioData,
		OffscreenCanvas: browser.OffscreenCanvas,
		WebAssembly: browser.WebAssembly
	};
}

/**
 * Check the APIs the editor actually needs before showing an editor surface.
 * Capability checks are preferred over browser-name allowlists, while Brave's
 * deliberate filesystem deviation gets a more useful remediation message.
 */
export async function detectVideoEditorBrowserSupport(
	environment: BrowserEnvironment = currentEnvironment()
): Promise<VideoEditorBrowserSupport> {
	if (environment.isSecureContext === false) {
		return { supported: false, issue: 'secure-context' };
	}

	if (!supportsFileSystemAccess(environment)) {
		return {
			supported: false,
			issue: isBraveBrowser(environment) ? 'filesystem-blocked' : 'filesystem-api'
		};
	}

	const getDirectory = environment.navigator?.storage?.getDirectory;
	if (typeof getDirectory !== 'function') {
		return { supported: false, issue: 'storage-blocked' };
	}
	// SAFETY: getDirectory is function-checked above, so storage exists here.
	const storage = environment.navigator?.storage as NonNullable<BrowserNavigator['storage']>;
	if (!(await supportsOpfsSubdirectories(getDirectory, storage))) {
		return {
			supported: false,
			issue: isBraveBrowser(environment) ? 'filesystem-blocked' : 'storage-blocked'
		};
	}

	if (!environment.indexedDB || typeof environment.indexedDB.open !== 'function') {
		return { supported: false, issue: 'storage-blocked' };
	}

	if (!supportsMediaProcessing(environment)) {
		return { supported: false, issue: 'media-api' };
	}

	return { supported: true };
}

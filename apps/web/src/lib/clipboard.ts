export async function writeClipboardText(value: string): Promise<void> {
	const clipboard = globalThis.navigator?.clipboard;
	if (clipboard?.writeText) {
		try {
			await clipboard.writeText(value);
			return;
		} catch {
			// Continue to the same-click fallback for browsers that expose the API but deny its permission.
		}
	}

	const document = globalThis.document;
	if (!document?.body) throw new Error('Clipboard unavailable');
	const textarea = document.createElement('textarea');
	textarea.value = value;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.top = '0';
	textarea.style.left = '-9999px';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.select();
	try {
		if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
	} finally {
		textarea.remove();
	}
}

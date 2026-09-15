import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeClipboardText } from './clipboard';

describe('clipboard writes', () => {
	afterEach(() => vi.restoreAllMocks());

	it('uses the Clipboard API when it succeeds', async () => {
		const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

		await expect(writeClipboardText('token-value')).resolves.toBeUndefined();
		expect(writeText).toHaveBeenCalledWith('token-value');
	});

	it('falls back to a same-click document copy when permission is denied', async () => {
		vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('permission denied'));
		const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true);

		await expect(writeClipboardText('token-value')).resolves.toBeUndefined();
		expect(execCommand).toHaveBeenCalledWith('copy');
		expect(document.body.querySelector('textarea')).toBeNull();
	});

	it('reports failure when both clipboard paths are unavailable', async () => {
		vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('permission denied'));
		vi.spyOn(document, 'execCommand').mockReturnValue(false);

		await expect(writeClipboardText('token-value')).rejects.toThrow('Clipboard unavailable');
	});
});

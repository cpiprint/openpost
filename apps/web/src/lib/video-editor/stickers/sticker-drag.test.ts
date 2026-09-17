import { describe, expect, it } from 'vitest';
import type { FluentEmojiSticker } from './fluent-emoji';
import { getStickerDragData, parseStickerDragData, writeStickerDragData } from './sticker-drag';

describe('sticker drag payload', () => {
	it('round-trips a sticker payload', () => {
		const raw = JSON.stringify({ version: 1, name: 'fire', label: 'Fire' });
		expect(parseStickerDragData(raw)).toMatchObject({ name: 'fire', label: 'Fire' });
	});

	it('rejects malformed payloads', () => {
		expect(parseStickerDragData('')).toBeNull();
		expect(parseStickerDragData('not-json')).toBeNull();
		expect(
			parseStickerDragData(JSON.stringify({ version: 1, name: 'UPPER CASE', label: 'X' }))
		).toBeNull();
		expect(parseStickerDragData(JSON.stringify({ version: 1, label: 'Missing name' }))).toBeNull();
	});

	it('falls back to the active drag when the transfer payload is missing', () => {
		const transfer = { getData: () => '' } as unknown as DataTransfer;
		expect(getStickerDragData(transfer)).toBeNull();
		const writer = { setData: () => {}, getData: () => '' } as unknown as DataTransfer;
		writeStickerDragData(writer, { name: 'fire', label: 'Fire' } as FluentEmojiSticker);
		expect(getStickerDragData(transfer)).toMatchObject({ name: 'fire' });
	});
});

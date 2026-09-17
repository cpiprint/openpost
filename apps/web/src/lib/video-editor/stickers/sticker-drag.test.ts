import { describe, expect, it } from 'vitest';
import type { FluentEmojiSticker } from './fluent-emoji';
import {
	clearStickerDragData,
	getStickerDragData,
	parseStickerDragData,
	writeStickerDragData,
	type StickerDataTransfer
} from './sticker-drag';

const sticker: FluentEmojiSticker = {
	name: 'fire',
	label: 'Fire',
	body: '<g/>',
	width: 32,
	height: 32,
	icon: { body: '<g/>' }
};

interface SeenTransfer {
	format: string;
	data: string;
}

function transferWriter(seen: SeenTransfer): StickerDataTransfer {
	return {
		effectAllowed: 'uninitialized',
		setData: (format, data) => {
			seen.format = format;
			seen.data = data;
		},
		getData: () => ''
	};
}

describe('sticker drag payload', () => {
	it('round-trips a sticker payload', () => {
		const seen: SeenTransfer = { format: '', data: '' };
		writeStickerDragData(transferWriter(seen), sticker);
		expect(parseStickerDragData(seen.data)).toMatchObject({
			name: 'fire',
			label: 'Fire'
		});
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
		clearStickerDragData();
		const reader: StickerDataTransfer = {
			effectAllowed: 'uninitialized',
			setData: () => {},
			getData: () => ''
		};
		expect(getStickerDragData(reader)).toBeNull();
		writeStickerDragData(transferWriter({}), sticker);
		expect(getStickerDragData(reader)).toMatchObject({ name: 'fire' });
	});
});

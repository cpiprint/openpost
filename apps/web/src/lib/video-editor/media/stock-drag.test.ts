import { describe, expect, it } from 'vitest';
import type { StockAsset } from '$lib/stock-media';
import {
	clearStockDragData,
	getActiveStockAsset,
	getStockDragData,
	parseStockDragData,
	writeStockDragData,
	type StockDataTransfer
} from './stock-drag';

// SAFETY: the drag payload only reads provider, external_id, title, kind, and
// dimensions; the remaining generated Asset fields are never touched here.
const photo = {
	provider: 'pexels',
	external_id: '123',
	title: 'Mountain',
	kind: 'photo',
	width: 1920,
	height: 1080
} as StockAsset;

interface SeenTransfer {
	format: string;
	data: string;
}

function transferWriter(seen: SeenTransfer): StockDataTransfer {
	return {
		effectAllowed: 'uninitialized',
		setData: (format, data) => {
			seen.format = format;
			seen.data = data;
		},
		getData: () => ''
	};
}

describe('stock drag payload', () => {
	it('round-trips a stock payload', () => {
		const seen: SeenTransfer = { format: '', data: '' };
		writeStockDragData(transferWriter(seen), photo);
		expect(parseStockDragData(seen.data)).toMatchObject({
			provider: 'pexels',
			externalId: '123',
			kind: 'photo'
		});
		expect(parseStockDragData('')).toBeNull();
	});

	it('rejects malformed payloads', () => {
		expect(parseStockDragData('not-json')).toBeNull();
		expect(
			parseStockDragData(JSON.stringify({ version: 1, provider: 'p', externalId: 'e', label: 'L' }))
		).toBeNull();
		expect(
			parseStockDragData(
				JSON.stringify({
					version: 1,
					provider: 'p',
					externalId: 'e',
					label: 'L',
					kind: 'audio'
				})
			)
		).toBeNull();
	});

	it('exposes the active asset for same-document drops', () => {
		writeStockDragData(transferWriter({}), photo);
		expect(getActiveStockAsset('pexels', '123')).toBe(photo);
		expect(getActiveStockAsset('pexels', 'other')).toBeNull();
		clearStockDragData();
		expect(getActiveStockAsset('pexels', '123')).toBeNull();
	});
});

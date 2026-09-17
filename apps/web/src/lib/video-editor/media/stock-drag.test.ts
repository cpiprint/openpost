import { describe, expect, it } from 'vitest';
import type { StockAsset } from '$lib/stock-media';
import {
	clearStockDragData,
	getActiveStockAsset,
	getStockDragData,
	parseStockDragData,
	writeStockDragData
} from './stock-drag';

const photo = {
	provider: 'pexels',
	external_id: '123',
	title: 'Mountain',
	kind: 'photo',
	width: 1920,
	height: 1080
} as StockAsset;

describe('stock drag payload', () => {
	it('round-trips a stock payload', () => {
		const writer = { setData: () => {} } as unknown as DataTransfer;
		writeStockDragData(writer, photo);
		const reader = {
			getData: () =>
				JSON.stringify({
					version: 1,
					provider: 'pexels',
					externalId: '123',
					label: 'Mountain',
					kind: 'photo'
				})
		} as unknown as DataTransfer;
		expect(getStockDragData(reader)).toMatchObject({
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
		const writer = { setData: () => {} } as unknown as DataTransfer;
		writeStockDragData(writer, photo);
		expect(getActiveStockAsset('pexels', '123')).toBe(photo);
		expect(getActiveStockAsset('pexels', 'other')).toBeNull();
		clearStockDragData();
		expect(getActiveStockAsset('pexels', '123')).toBeNull();
	});
});

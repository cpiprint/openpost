import { describe, expect, it } from 'vitest';
import type { LottieFilesAnimation } from './lottiefiles-api';
import {
	clearLottieDragData,
	getActiveLottieAnimation,
	getLottieDragData,
	parseLottieDragData,
	writeLottieDragData
} from './lottie-drag';

const animation = {
	id: 'abc123',
	name: 'Confetti',
	lottieUrl: 'https://assets-v2.lottiefiles.com/abc.json'
} as LottieFilesAnimation;

describe('lottie drag payload', () => {
	it('round-trips a lottie payload', () => {
		const writer = { setData: () => {} } as unknown as DataTransfer;
		writeLottieDragData(writer, animation);
		const reader = {
			getData: () =>
				JSON.stringify({ version: 1, id: 'abc123', label: 'Confetti', url: animation.lottieUrl })
		} as unknown as DataTransfer;
		expect(getLottieDragData(reader)).toMatchObject({ id: 'abc123' });
		expect(parseLottieDragData('')).toBeNull();
	});

	it('rejects malformed payloads', () => {
		expect(parseLottieDragData('not-json')).toBeNull();
		expect(parseLottieDragData(JSON.stringify({ version: 1, id: 'a', label: 'L' }))).toBeNull();
		expect(
			parseLottieDragData(
				JSON.stringify({ version: 1, id: 'a', label: 'L', url: 'http://evil/x.json' })
			)
		).toBeNull();
	});

	it('exposes the active animation for same-document drops', () => {
		const writer = { setData: () => {} } as unknown as DataTransfer;
		writeLottieDragData(writer, animation);
		expect(getActiveLottieAnimation('abc123')).toBe(animation);
		expect(getActiveLottieAnimation('other')).toBeNull();
		clearLottieDragData();
		expect(getActiveLottieAnimation('abc123')).toBeNull();
	});
});

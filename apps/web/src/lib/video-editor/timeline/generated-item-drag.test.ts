import { describe, expect, it } from 'vitest';
import {
	parseGeneratedItemDragData,
	shapeGeneratedItemDragData,
	textGeneratedItemDragData
} from './generated-item-drag';

describe('generated-item drag payload', () => {
	it('round-trips text and shape payloads', () => {
		expect(
			parseGeneratedItemDragData(JSON.stringify(textGeneratedItemDragData('Hello')))
		).toMatchObject({ kind: 'text', label: 'Hello' });
		expect(
			parseGeneratedItemDragData(JSON.stringify(shapeGeneratedItemDragData('Block', 'rectangle')))
		).toMatchObject({ kind: 'shape', shapeType: 'rectangle' });
	});

	it('round-trips background preset payloads', () => {
		expect(
			parseGeneratedItemDragData(
				JSON.stringify({
					version: 1,
					kind: 'background',
					label: 'Sunset mesh',
					presetId: 'mesh-sunset'
				})
			)
		).toMatchObject({ kind: 'background', presetId: 'mesh-sunset' });
	});

	it('rejects unknown background presets', () => {
		expect(
			parseGeneratedItemDragData(
				JSON.stringify({ version: 1, kind: 'background', label: 'X', presetId: 'nope' })
			)
		).toBeNull();
	});
});

type CryptoWithOptionalRandomUUID = Crypto & {
	randomUUID?: () => string;
};

function generateUUID(cryptoAPI: CryptoWithOptionalRandomUUID | undefined): string {
	const bytes = new Uint8Array(16);
	if (typeof cryptoAPI?.getRandomValues === 'function') {
		cryptoAPI.getRandomValues(bytes);
	} else {
		// These identifiers are not secrets. This keeps old non-browser runtimes usable
		// when they expose neither Web Crypto UUID support nor getRandomValues.
		for (let index = 0; index < bytes.length; index += 1) {
			bytes[index] = Math.floor(Math.random() * 256);
		}
	}
	bytes[6] = (bytes[6]! & 0x0f) | 0x40;
	bytes[8] = (bytes[8]! & 0x3f) | 0x80;
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createUUID(): string {
	const cryptoAPI = globalThis.crypto as CryptoWithOptionalRandomUUID | undefined;
	if (typeof cryptoAPI?.randomUUID === 'function') return cryptoAPI.randomUUID();
	return generateUUID(cryptoAPI);
}

/** Add the missing method for legacy browsers so existing call sites stay compatible. */
export function installCryptoRandomUUID(): void {
	const cryptoAPI = globalThis.crypto as CryptoWithOptionalRandomUUID | undefined;
	if (!cryptoAPI || typeof cryptoAPI.randomUUID === 'function') return;
	try {
		Object.defineProperty(cryptoAPI, 'randomUUID', {
			configurable: true,
			value: () => generateUUID(cryptoAPI)
		});
	} catch {
		// Callers that need a UUID directly use createUUID(), which does not require
		// mutating the browser's Crypto object.
	}
}

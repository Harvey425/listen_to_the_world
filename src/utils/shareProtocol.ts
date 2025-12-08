/**
 * The Starlight Protocol
 * Encodes UUIDs into compact, obfuscated URL-safe strings.
 * See: SHARE_PROTOCOL.md
 */

const KEY = 'EARTH'; // 0x45, 0x61, 0x72, 0x74, 0x68

export function encodeStationId(uuid: string): string {
    if (!uuid) return '';

    try {
        // 1. Clean UUID (remove dashes)
        const hex = uuid.replace(/-/g, '');
        if (hex.length !== 32) return uuid; // Fallback if not valid UUID

        // 2. Convert to Bytes
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 32; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }

        // 3. XOR with Key
        const salted = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            salted[i] = bytes[i] ^ KEY.charCodeAt(i % KEY.length);
        }

        // 4. Base64URL Encode
        // Convert Uint8Array to binary string
        let binary = '';
        for (let i = 0; i < salted.length; i++) {
            binary += String.fromCharCode(salted[i]);
        }

        // btoa and replace for URL safety
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

    } catch (e) {
        console.warn("Encoding failed", e);
        return uuid; // Fallback
    }
}

export function decodeStationId(code: string): string | null {
    if (!code) return null;

    try {
        // 1. Base64URL Decode
        let base64 = code.replace(/-/g, '+').replace(/_/g, '/');
        // Pad
        while (base64.length % 4) {
            base64 += '=';
        }

        const binary = atob(base64);
        const bytes = new Uint8Array(16);
        if (binary.length !== 16) return null; // Invalid length for UUID

        for (let i = 0; i < 16; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        // 2. XOR with Key (Reverse is same as forward)
        const originalBytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            originalBytes[i] = bytes[i] ^ KEY.charCodeAt(i % KEY.length);
        }

        // 3. Hex & Format UUID
        let hex = '';
        for (let i = 0; i < 16; i++) {
            hex += originalBytes[i].toString(16).padStart(2, '0');
        }

        // Add dashes: 8-4-4-4-12
        return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;

    } catch (e) {
        console.warn("Decoding failed", e);
        return null; // Or return code if it was a raw UUID (backward compat)?
        // Let's assume strict protocol for now, or fallback if regex match UUID.
        // Simple fallback: if code looks like UUID, return it.
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
            return code;
        }
        return null;
    }
}

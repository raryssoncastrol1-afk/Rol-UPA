/**
 * Utility to calculate SHA-256 hash for secure voter PIN verification.
 * Uses Web Crypto API natively supported in all modern browsers.
 */
export async function hashPin(pin: string): Promise<string> {
  const clean = pin.trim();
  const msgUint8 = new TextEncoder().encode(clean);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

// This verifier is only a local demonstration, never an authentication boundary.
export type DemoCredential = { salt: string; hash: string };
export const defaultDemoCredential: DemoCredential = {
  salt: "541d912fda82ee8349d41c5d6f62ab31",
  hash: "2da826c8f25d9fb57191b8e4f45d295daea26a30208fc74af36e1eee7f7b71d6",
};
export function hashDemoPassword(password: string, salt?: string): DemoCredential {
  const actualSalt = salt ?? bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt: actualSalt, hash: bytesToHex(pbkdf2(sha256, password, hexToBytes(actualSalt), { c: 100_000, dkLen: 32 })) };
}
export function verifyDemoPassword(password: string, credential: DemoCredential): boolean {
  if (!password || password.length > 256) return false;
  try { return hashDemoPassword(password, credential.salt).hash === credential.hash; }
  catch { return false; }
}

export function migrateDemoState(state: unknown) {
  const old = state as { profile?: Record<string, unknown>; demoCredential?: DemoCredential };
  const { password, ...profile } = old.profile ?? {};
  return { ...old, profile, demoCredential: typeof password === "string" ? hashDemoPassword(password) : old.demoCredential ?? defaultDemoCredential };
}
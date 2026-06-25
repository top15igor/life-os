import { createHash } from "crypto";

const secret = () => process.env.TELEGRAM_WEBHOOK_SECRET || "lifeos-secret";

// Хэш PIN (не храним сам PIN).
export function hashPin(pin: string): string {
  return createHash("sha256").update(`${pin}:${secret()}`).digest("hex");
}

// Значение cookie разблокировки — нельзя подделать без секрета; меняется при смене PIN.
export function unlockToken(pinHash: string): string {
  return createHash("sha256").update(`${pinHash}:${secret()}:unlock`).digest("hex");
}

import crypto from "crypto";

export type User = {
  id: string;
  name: string;
};

export function getUserFromApiKey(apiKey: string | null): User | null {
  if (!apiKey) return null;
  const raw = process.env.USER_KEYS_JSON;
  if (!raw) return null;
  const map = JSON.parse(raw) as Record<string, User>;
  return map[apiKey] ?? null;
}

export function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function newEventId(): string {
  return crypto.randomUUID();
}

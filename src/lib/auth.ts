import { useSyncExternalStore } from "react";

export interface CosmosUser {
  name: string;
  email: string;
  provider: "google" | "email";
}

interface StoredAccount extends CosmosUser {
  password: string;
}

const SESSION_KEY = "cosmos-session";
const ACCOUNTS_KEY = "cosmos-accounts";

const listeners = new Set<() => void>();

/** Cached parsed session — useSyncExternalStore requires a stable snapshot. */
let cachedSession: CosmosUser | null | undefined;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function notify() {
  for (const l of listeners) l();
}

function isValidUser(value: unknown): value is CosmosUser {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CosmosUser).name === "string" &&
    typeof (value as CosmosUser).email === "string" &&
    ((value as CosmosUser).provider === "google" || (value as CosmosUser).provider === "email")
  );
}

export function getSession(): CosmosUser | null {
  if (cachedSession === undefined) {
    const value = read<unknown>(SESSION_KEY);
    cachedSession = isValidUser(value) ? value : null;
  }
  return cachedSession;
}

function setSession(user: CosmosUser | null) {
  if (user) write(SESSION_KEY, user);
  else if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
  cachedSession = user;
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === SESSION_KEY || e.key === null) {
      cachedSession = undefined;
      notify();
    }
  });
}

const serverSnapshot: CosmosUser | null = null;

export function useSession(): CosmosUser | null {
  return useSyncExternalStore(subscribe, getSession, () => serverSnapshot);
}

function accounts(): StoredAccount[] {
  const value = read<unknown>(ACCOUNTS_KEY);
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is StoredAccount =>
      isValidUser(a) &&
      (a.provider === "google" || typeof (a as StoredAccount).password === "string"),
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createAccount(name: string, email: string, password: string): CosmosUser {
  const clean = normalizeEmail(email);
  if (accounts().some((a) => a.email === clean)) {
    throw new Error("An account with this email already exists. Try signing in instead.");
  }
  const user: StoredAccount = {
    name: name.trim(),
    email: clean,
    provider: "email",
    password,
  };
  write(ACCOUNTS_KEY, [...accounts(), user]);
  setSession({ name: user.name, email: user.email, provider: "email" });
  return { name: user.name, email: user.email, provider: "email" };
}

export function signInWithEmail(email: string, password: string): CosmosUser {
  const clean = normalizeEmail(email);
  const account = accounts().find((a) => a.email === clean);
  if (!account) {
    throw new Error("No account found for this email. Create one below.");
  }
  if (account.password !== password) {
    throw new Error("Incorrect password. Please try again.");
  }
  setSession({ name: account.name, email: account.email, provider: account.provider });
  return { name: account.name, email: account.email, provider: account.provider };
}

/**
 * Demo Google sign-in. The app is fully client-side (no backend), so this
 * mints a local session for a demo identity instead of running a real OAuth
 * handshake — swap this body for a real provider call when a backend exists.
 */
export function signInWithGoogle(): CosmosUser {
  const existing = accounts().find((a) => a.provider === "google");
  const name = existing?.name ?? "Google Explorer";
  const email = existing?.email ?? "explorer@gmail.com";
  if (!existing) {
    write(ACCOUNTS_KEY, [
      ...accounts(),
      { name, email, provider: "google", password: "" } satisfies StoredAccount,
    ]);
  }
  setSession({ name, email, provider: "google" });
  return { name, email, provider: "google" };
}

export function signOut() {
  setSession(null);
}

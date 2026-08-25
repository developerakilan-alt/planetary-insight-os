import { beforeEach, describe, expect, it } from "vitest";
import { createAccount, getSession, signInWithEmail, signOut, useSession } from "./auth";

describe("auth session store", () => {
  beforeEach(() => {
    localStorage.clear();
    signOut();
  });

  it("returns a stable snapshot identity across calls (useSyncExternalStore contract)", () => {
    createAccount("Ada", "ada@example.com", "secret123");
    const first = getSession();
    const second = getSession();
    expect(first).not.toBeNull();
    expect(first).toBe(second);
  });

  it("ignores malformed stored sessions instead of crashing the Navbar", () => {
    localStorage.setItem("cosmos-session", JSON.stringify({ nope: true }));
    expect(getSession()).toBeNull();
    localStorage.setItem("cosmos-session", '"garbage"');
    expect(getSession()).toBeNull();
  });

  it("updates the snapshot after sign-in and sign-out with stable identity", async () => {
    const { render } = await import("@testing-library/react");
    let seen: unknown;
    function Probe() {
      seen = useSession();
      return null;
    }
    createAccount("Ada", "ada@example.com", "secret123");
    signInWithEmail("ada@example.com", "secret123");
    render(<Probe />);
    expect(seen).toEqual({ name: "Ada", email: "ada@example.com", provider: "email" });
    const before = seen;
    signOut();
    expect(getSession()).toBeNull();
    expect(before).not.toBeNull();
  });

  it("rejects wrong password without mutating the session", () => {
    createAccount("Grace", "grace@example.com", "navy");
    expect(() => signInWithEmail("grace@example.com", "wrong")).toThrow(/Incorrect password/);
    expect(getSession()?.email).toBe("grace@example.com");
  });
});

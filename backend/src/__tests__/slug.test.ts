import { describe, expect, it } from "vitest";
import { slugify } from "../slug";

describe("slugify", () => {
  it("lowercases and hyphenates a normal name", () => {
    const slug = slugify("Acme Corp");
    expect(slug).toMatch(/^acme-corp-[a-z0-9]{4}$/);
  });

  it("strips special characters", () => {
    const slug = slugify("Jordan's Team!! 2026");
    expect(slug).toMatch(/^jordan-s-team-2026-[a-z0-9]{4}$/);
  });

  it("collapses multiple consecutive separators into one hyphen", () => {
    const slug = slugify("A   B---C");
    expect(slug).toMatch(/^a-b-c-[a-z0-9]{4}$/);
  });

  it("trims leading and trailing separators before the suffix", () => {
    const slug = slugify("  -Hello World-  ");
    expect(slug).toMatch(/^hello-world-[a-z0-9]{4}$/);
  });

  it("produces a different suffix on repeated calls, even for the same name", () => {
    const first = slugify("Acme Corp");
    const second = slugify("Acme Corp");
    expect(first).not.toBe(second);
  });
});
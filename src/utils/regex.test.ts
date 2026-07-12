import { describe, expect, test } from "vitest";
import { titleCheck } from "./regex";

describe("regex title test", () => {
  test("ensure minimum of 3 chars", () => {
    expect(titleCheck("sh")).toBeInstanceOf(Error);
    expect(titleCheck("shee")).toBeNull();
  });

  test("ensure maximum of 50 chars", () => {
    expect(titleCheck("s".repeat(60))).toBeInstanceOf(Error);
    expect(
      titleCheck("the quick brown fox jumps over the lazy dog"),
    ).toBeNull();
  });

  test("ensure only allows letters, numbers, spaces, hypens and underscores", () => {
    expect(titleCheck("lorem_ipsum-dolor-s1t-4mer")).toBeNull();
    expect(titleCheck("l()rem/psumdolorS!tamer")).toBeInstanceOf(Error);
  });
});

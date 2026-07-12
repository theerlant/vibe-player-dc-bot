import { test } from "vitest";
import { verifyUrl } from "./youtube";

test("test yt-dlp link verification", () => {
  verifyUrl("https://www.youtube.com/watch?v=z2j6x-oxkAc");
});

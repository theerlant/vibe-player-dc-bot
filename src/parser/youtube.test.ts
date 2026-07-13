import { test } from "vitest";
import { getStreamUrls, verifyUrl } from "./youtube";

test("test yt-dlp link verification", async () => {
  await verifyUrl("https://www.youtube.com/watch?v=z2j6x-oxkAc");
}, 10_000);

test("test yt-dlp stream url getter", async () => {
  const urls = await getStreamUrls(
    "https://www.youtube.com/watch?v=z2j6x-oxkAc",
  );
  console.log(urls);
}, 10_000);

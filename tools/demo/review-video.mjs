import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..", "..");
const videoPath = path.resolve(
  process.argv[2] ?? path.join(projectRoot, "output", "playwright", "pal-comf-demo.webm"),
);
const reviewDirectory = path.join(
  projectRoot,
  "output",
  "playwright",
  "video-review",
);
const requestedTimestamps = [0, 5, 10, 15, 20, 25, 30];
const chromeCandidates = [
  process.env.PLAYWRIGHT_CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

async function findBrowserExecutable() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known browser path.
    }
  }

  throw new Error(
    "Chrome or Edge was not found. Set PLAYWRIGHT_CHROME_PATH.",
  );
}

await rm(reviewDirectory, { recursive: true, force: true });
await mkdir(reviewDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: await findBrowserExecutable(),
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(pathToFileURL(videoPath).href);
  await page.waitForFunction(() => {
    const video = document.querySelector("video");
    return video && Number.isFinite(video.duration) && video.duration > 0;
  });
  const metadata = await page.evaluate(() => {
    const video = document.querySelector("video");

    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("Video element is missing.");
    }

    video.pause();
    video.controls = false;
    document.documentElement.style.background = "#000";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    video.style.display = "block";
    video.style.width = "1440px";
    video.style.height = "900px";
    video.style.objectFit = "contain";
    return {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    };
  });
  const timestamps = requestedTimestamps.filter(
    (timestamp) => timestamp < metadata.duration,
  );

  for (const timestamp of timestamps) {
    await page.evaluate(async (nextTime) => {
      const video = document.querySelector("video");

      if (!(video instanceof HTMLVideoElement)) {
        throw new Error("Video element is missing.");
      }

      await new Promise((resolve, reject) => {
        const handleSeeked = () => {
          video.removeEventListener("error", handleError);
          resolve();
        };
        const handleError = () => {
          video.removeEventListener("seeked", handleSeeked);
          reject(new Error("Video seek failed."));
        };
        video.addEventListener("seeked", handleSeeked, { once: true });
        video.addEventListener("error", handleError, { once: true });
        video.currentTime = nextTime;
      });
    }, timestamp);
    await page.screenshot({
      path: path.join(
        reviewDirectory,
        `frame-${String(timestamp).padStart(2, "0")}s.png`,
      ),
    });
  }

  console.log(JSON.stringify({ videoPath, reviewDirectory, metadata, timestamps }));
} finally {
  await browser.close();
}

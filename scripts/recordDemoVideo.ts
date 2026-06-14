import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright-core";

const hostedUrl = process.env.DISPATCHPILOT_HOSTED_URL ?? "https://airowe.github.io/dispatchpilot-qwen/";
const chromePath =
  process.env.CHROME_EXECUTABLE_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputPath = resolve(process.cwd(), "docs/dispatchpilot-demo.webm");
const videoDir = resolve(process.cwd(), "docs/.video-work");

await rm(videoDir, { recursive: true, force: true });
await mkdir(videoDir, { recursive: true });
await mkdir(dirname(outputPath), { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox"]
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: videoDir,
    size: { width: 1280, height: 720 }
  }
});

const page = await context.newPage();

try {
  await page.goto(hostedUrl, { waitUntil: "networkidle" });
  await page.getByText("DispatchPilot").waitFor({ timeout: 20_000 });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Run Autopilot/i }).click();
  await page.getByText("Dispatch packet").waitFor({ timeout: 20_000 });
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /Approve update/i }).click();
  await page.getByText("Update approved").waitFor({ timeout: 20_000 });
  await page.waitForTimeout(900);
  await page.getByText("Memory and audit").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1_200);
} finally {
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (!video) {
    throw new Error("No video was recorded.");
  }

  const recordedPath = await video.path();
  await rm(outputPath, { force: true });
  await rename(recordedPath, outputPath);
  await rm(videoDir, { recursive: true, force: true });

  console.log(
    JSON.stringify(
      {
        ok: true,
        hostedUrl,
        outputPath
      },
      null,
      2
    )
  );
}

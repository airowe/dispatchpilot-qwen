import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright-core";

const hostedUrl = process.env.DISPATCHPILOT_HOSTED_URL ?? "https://airowe.github.io/dispatchpilot-qwen/";
const chromePath =
  process.env.CHROME_EXECUTABLE_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const screenshotPath = resolve(process.cwd(), "docs/hosted-demo-check.png");

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox"]
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const failedResponses: string[] = [];
  page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.endsWith("/favicon.ico")) {
      failedResponses.push(`${status} ${url}`);
    }
  });

  await page.goto(hostedUrl, { waitUntil: "networkidle" });
  await page.getByText("DispatchPilot").waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: /Run Autopilot/i }).click();
  await page.getByText("Dispatch packet").waitFor({ timeout: 20_000 });
  await page.getByText("North Pier Market").first().waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: /Approve update/i }).click();
  await page.getByText("Update approved").waitFor({ timeout: 20_000 });

  if (failedResponses.length > 0) {
    throw new Error(`Hosted demo loaded with failed resources:\n${failedResponses.join("\n")}`);
  }

  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(
    JSON.stringify(
      {
        ok: true,
        hostedUrl,
        generatedPacket: true,
        approvalFlow: true,
        screenshotPath
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}

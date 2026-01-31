import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../.output/screenshot');
const GITHUB_DIR = path.resolve(__dirname, '../.github');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const viteProcess = spawn(
  'npx',
  ['vite', 'serve', 'scripts/screenshots', '--config', 'scripts/screenshots/vite.config.ts'],
  {
    stdio: 'pipe',
  },
);

viteProcess.stderr?.on('data', (data: Buffer) => {
  console.error(`Vite Error: ${data}`);
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const url = 'http://localhost:3000';

  let serverReady = false;

  process.stdout.write('Waiting for Vite server...');
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        serverReady = true;
        console.log('\nServer is ready!');
        break;
      }
    } catch {
      // ignore
    }
    process.stdout.write('.');
    await wait(200);
  }

  if (!serverReady) {
    console.error('\nTimeout waiting for Vite server');
    viteProcess.kill();
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 370, height: 600, deviceScaleFactor: 2 });

  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
  } catch (e) {
    console.error('Failed to load page. Is vite running?');
    console.error(e);
    viteProcess.kill();
    process.exit(1);
  }

  const themes = ['light', 'dark'] as const;
  const tabs = ['keywords', 'songs', 'artists', 'aidb', 'history'] as const;
  type Tab = (typeof tabs)[number];

  const tabSelectors: Record<Tab, string> = {
    keywords: '.tabs .tab-btn:nth-child(1)',
    songs: '.tabs .tab-btn:nth-child(2)',
    artists: '.tabs .tab-btn:nth-child(3)',
    aidb: '.tabs .tab-btn:nth-child(4)',
    history: '.tabs .tab-btn:nth-child(5)',
  };

  for (const theme of themes) {
    console.log(`Processing theme: ${theme}`);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);

    await wait(250);

    for (const tab of tabs) {
      console.log(`  Processing tab: ${tab}`);
      const selector = tabSelectors[tab];
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
      } else {
        console.error(`Could not find button for tab ${tab}`);
      }
      await wait(250);

      const body = await page.$('body');
      if (body) {
        await body.screenshot({
          path: path.join(OUTPUT_DIR, `${theme}-${tab}.png`),
        });
      }
    }
  }

  await browser.close();
  viteProcess.kill();

  for (const theme of themes) {
    console.log(`Creating GIF for ${theme} theme...`);
    const images = tabs.map((tab) => path.join(OUTPUT_DIR, `${theme}-${tab}.png`));
    const concatFilePath = path.join(OUTPUT_DIR, `${theme}-concat.txt`);

    const lines: string[] = [];
    images.forEach((img) => {
      lines.push(`file '${img}'`);
      lines.push(`duration 2`);
    });

    fs.writeFileSync(concatFilePath, lines.join('\n'));
    const outputGif = path.join(GITHUB_DIR, `${theme}-demo.gif`);

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatFilePath,
        '-vf',
        'fps=10,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop',
        '0',
        '-y',
        outputGif,
      ]);

      ff.on('close', (code) => {
        if (code === 0) {
          console.log(`Generated ${outputGif}`);
          fs.unlinkSync(concatFilePath);
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
    });
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  viteProcess.kill();
  process.exit(1);
});

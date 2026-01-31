import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const SIZES = [16, 32, 48, 96, 128];
const INPUT_FILE = path.resolve('public/icon.svg');

// Colors
const ACCENT_COLOR = '#ff4444';
const LIGHT_FILL = '#202124'; // Light theme fill.
const DARK_FILL = '#f8f9fa'; // Dark theme fill.
const GRAY_FILL = '#808080'; // Disabled.

interface IconVariant {
  name: string; // Base name for output file, e.g., 'icon', 'icon-dark'
  stylesheet: string;
}

const VARIANTS: IconVariant[] = [
  // Normal Light
  {
    name: 'icon-light',
    stylesheet: `
      path { fill: ${LIGHT_FILL}; }
      #note { fill: ${ACCENT_COLOR}; }
    `,
  },
  // Normal Dark
  {
    name: 'icon-dark',
    stylesheet: `
      path { fill: ${DARK_FILL}; }
      #note { fill: ${ACCENT_COLOR}; }
    `,
  },
  // Disabled (Grayscale)
  {
    name: 'icon-gray',
    stylesheet: `
      path { fill: ${GRAY_FILL}; }
      #note { fill: ${GRAY_FILL}; }
    `,
  },
  // Empty Light
  {
    name: 'icon-empty-light',
    stylesheet: `
      path { fill: ${LIGHT_FILL}; }
      #note { display: none; }
    `,
  },
  // Empty Dark
  {
    name: 'icon-empty-dark',
    stylesheet: `
      path { fill: ${DARK_FILL}; }
      #note { display: none; }
    `,
  },
];

async function main() {
  await fs.access(INPUT_FILE);

  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const outputFilename = `${variant.name}-${size}.png`;
      const outputPath = path.resolve('public', outputFilename);
      console.log(`Generating ${outputFilename} (${size}x${size})...`);
      try {
        // Use high density for initial render, resizing will handle downscaling.
        // We use the `svg` option to inject the stylesheet.
        await sharp(INPUT_FILE, {
          density: 300,
          svg: { stylesheet: variant.stylesheet },
        })
          .resize(size, size)
          .toFile(outputPath);
      } catch (err) {
        console.error(`Failed to generate ${outputFilename}:`, err);
      }
    }
  }

  // Generate dynamic GitHub icon (SVG with theme support)
  const ghIconPath = path.resolve('.github/icon.svg');
  try {
    const svgContent = await fs.readFile(INPUT_FILE, 'utf-8');
    const styleBlock = `
  <style>
    :root {
      --fill: ${LIGHT_FILL};
      --accent: ${ACCENT_COLOR};
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --fill: ${DARK_FILL};
      }
    }
    path { fill: var(--fill); }
    #note { fill: var(--accent); }
  </style>`;
    const updatedSvg = svgContent.replace(/(<svg[^>]*>)/, `$1${styleBlock}`);
    await fs.writeFile(ghIconPath, updatedSvg);
  } catch (err) {
    console.error('Failed to generate .github/icon.svg:', err);
  }
}

main().catch(console.error);

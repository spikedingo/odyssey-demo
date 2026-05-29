import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createApp } from './index';

const app = createApp();
const spec = app.getOpenAPIDocument({
  openapi: '3.0.0',
  info: {
    title: 'Odyssey Restaurant API',
    version: '1.0.0',
    description: 'Restaurant operations dashboard API',
  },
  servers: [{ url: 'http://localhost:8787', description: 'Local development' }],
});

const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../openapi.json');
writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`OpenAPI spec written to ${outputPath}`);

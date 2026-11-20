import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Photos are already resized client-side and served directly from the configured Supabase bucket.
    rules: { '@next/next/no-img-element': 'off' },
  },
  globalIgnores(['.next/**', 'node_modules/**']),
]);

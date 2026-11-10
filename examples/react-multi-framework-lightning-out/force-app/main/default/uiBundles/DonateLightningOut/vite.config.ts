import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import salesforce from '@salesforce/vite-plugin-ui-bundle';
import { resolve } from 'path';

// Code shared by all examples in this repo (Canopy page sections, brand CSS, Lightning Out helper).
const sharedDir = resolve(__dirname, '../../../../../../../shared');

export default defineConfig({
  base: './',
  plugins: [react(), salesforce()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@shared': sharedDir,
      // Files under /shared have no node_modules of their own: resolve React from this app.
      'react/jsx-runtime': resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      react: resolve(__dirname, 'node_modules/react'),
    },
  },
  server: {
    fs: { allow: [__dirname, sharedDir] },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    assetsDir: 'assets',
    sourcemap: false,
  },
});

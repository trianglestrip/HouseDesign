import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: false,
      outDir: 'dist',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HouseDesignCore',
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'es' ? 'housedesign-core.js' : 'housedesign-core.cjs',
    },
    rollupOptions: {
      external: ['fabric'],
      output: {
        globals: {
          fabric: 'fabric',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});

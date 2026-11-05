import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '.agents/teamwork/explorer_survey_1/dist_benchmark',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('exceljs')) return 'vendor-exceljs';
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('purify')) return 'vendor-pdf';
            if (id.includes('@sentry')) return 'vendor-sentry';
            if (id.includes('logrocket')) return 'vendor-logrocket';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-number-format')) return 'vendor-react-core';
            if (id.includes('date-fns') || id.includes('zod') || id.includes('axios')) return 'vendor-utils';
            return 'vendor-misc';
          }
        }
      }
    }
  }
});

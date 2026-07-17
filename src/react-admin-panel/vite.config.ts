import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    
    host: true, // permite conexiones externas
    cors: {
      origin: '*'
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        
        assetFileNames: (assetInfo) => {
          if (!assetInfo.names) return 'assets/[name]-[hash][extname]';

          const info = assetInfo.names;
          const ext = info[info.length - 1].toLowerCase();

          // Imágenes a assets/images
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }

          // CSS a assets/css (coincide con tu SpaConfig.php)
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }

          // Fuentes a assets/fonts (opcional)
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
             return `assets/fonts/[name]-[hash][extname]`;
          }

          // El resto se queda en assets/
          return `assets/[name]-[hash][extname]`;
        }
      }
    }
  }
})

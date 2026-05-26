import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'src/mockCodegen.ts'),
      'react-native-svg': path.resolve(__dirname, 'src/mockSvg.web.tsx'),
      'react-native': 'react-native-web',
    },
  },
});

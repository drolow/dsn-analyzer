import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// App 100% statique, deployable n'importe ou. base relative pour
// fonctionner aussi bien a la racine que dans un sous-chemin.
export default defineConfig({
  base: './',
  plugins: [react()],
});

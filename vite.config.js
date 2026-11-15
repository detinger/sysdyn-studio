import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Large libraries in their own long-lived chunks.
        advancedChunks: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'vendor-flow', test: /node_modules[\\/](reactflow|@reactflow|d3-[a-z]+|zustand)[\\/]/ },
            { name: 'vendor-charts', test: /node_modules[\\/](recharts|victory-vendor|@reduxjs|immer|reselect|es-toolkit|decimal\.js-light)[\\/]/ },
            { name: 'vendor-math', test: /node_modules[\\/](mathjs|fraction\.js|complex\.js|decimal\.js|typed-function|javascript-natural-sort|seedrandom|tiny-emitter|escape-latex)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.{js,jsx}'],
    environment: 'node',
  },
})

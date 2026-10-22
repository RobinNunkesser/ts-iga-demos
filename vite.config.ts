import { resolve } from "path";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  base: "./",
  plugins: [basicSsl()],
  server: {
    host: true, // Erreichbar im lokalen WLAN für Meta Quest 3
  },
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        reflection: resolve(__dirname, "demos/reflection/index.html"),
        juiciness: resolve(__dirname, "demos/juiciness/index.html"),
        transform: resolve(__dirname, "demos/transform/index.html"),
        threeScenegraph: resolve(__dirname, "demos/three-scenegraph/index.html"),
        threeMaterials: resolve(__dirname, "demos/three-materials/index.html"),
        babylonBasics: resolve(__dirname, "demos/babylon-basics/index.html"),
        babylonActionsGui: resolve(__dirname, "demos/babylon-actions-gui/index.html"),
        babylonPhysics: resolve(__dirname, "demos/babylon-physics/index.html"),
        babylonModels: resolve(__dirname, "demos/babylon-models/index.html"),
        babylonPetInspector: resolve(__dirname, "demos/babylon-pet-inspector/index.html"),
        babylonWebxrQuest: resolve(__dirname, "demos/babylon-webxr-quest/index.html"),
        hshlLogo3d: resolve(__dirname, "demos/hshl-logo-3d/index.html"),
        conceptVsMesh: resolve(__dirname, "demos/concept-vs-mesh/index.html"),
      },
    },
  },
});

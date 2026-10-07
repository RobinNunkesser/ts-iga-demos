import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
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
        hshlLogo3d: resolve(__dirname, "demos/hshl-logo-3d/index.html"),
      },
    },
  },
});

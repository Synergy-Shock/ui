// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "My Docs",
      logo: {
        dark: "./public/logo-dark.svg",
        light: "./public/logo-light.svg",
        replacesTitle: true,
      },
      customCss: ["./src/styles/global.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/synergy-shock/ui",
        },
      ],
      sidebar: [
        {
          label: "Components",
          autogenerate: { directory: "components" },
        },
        {
          label: "Guides",
          items: [{ label: "Example Guide", slug: "guides/example" }],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
    react(),
  ],

  server: {
    allowedHosts: ["ui.orb.local", "localhost"],
  },

  output: "static",

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Ensure Node.js built-ins resolve correctly for Cloudflare Workers
      conditions: ["workerd", "worker", "browser"],
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
plugins: [react()],
server: {
  host: true,
  // If HMR has trouble in Replit preview, also set in server/index.ts:
  // hmr: { protocol: "wss", clientPort: 443 },
},
});

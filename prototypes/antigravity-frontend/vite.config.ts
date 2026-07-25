import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Vite 빌드 및 개발 서버 설정
export default defineConfig({
  plugins: [react()],
  // 기존 root의 public 디렉터리를 정적 자산 경로로 공유
  publicDir: fileURLToPath(new URL("../../public", import.meta.url)),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

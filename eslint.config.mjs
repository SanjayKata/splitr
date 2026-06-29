import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier, // disable ESLint formatting rules that conflict with Prettier
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "supabase/functions/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

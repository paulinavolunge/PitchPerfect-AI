import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [
    "dist", 
    "node_modules", 
    "**/*.js", 
    "public/**",
    "supabase/functions/**/index.ts",
    "*.config.*",
    "playwright.config.ts",
    "capacitor.config.ts",
    "tailwind.config.ts"
  ] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // Console rules - allow in development
      "no-console": ["warn", { 
        allow: ["warn", "error", "info"] 
      }],
      
      // General JS rules
      "no-unused-vars": "off", // TypeScript handles this
      "prefer-const": "warn",
      "no-var": "error",
      
      // React specific
      "react-hooks/exhaustive-deps": "warn",
      
      // Disable problematic rules for this codebase
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  }
);

import js from "@eslint/js";
import html from "@html-eslint/eslint-plugin";
import htmlParser from "@html-eslint/parser";
import globals from "globals";
import tseslint from "typescript-eslint";

const strictRules = {
  eqeqeq: ["error", "always"],
  curly: ["error", "all"],
  "no-var": "error",
  "prefer-const": "error",
  "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  "no-console": ["warn", { allow: ["warn", "error"] }],
  "no-implicit-coercion": "error",
  "no-shadow": "error",
  "no-return-assign": "error",
  "object-shorthand": "error",
  "prefer-arrow-callback": "error",
  "no-undef-init": "error",
  "no-else-return": "error",
  "no-empty": ["error", { allowEmptyCatch: true }],
  "array-callback-return": "error",
  "no-promise-executor-return": "error",
  "no-self-compare": "error",
  "require-atomic-updates": "error",
  "no-param-reassign": "error"
};

const strictTsRules = {
  ...strictRules,
  "no-unused-vars": "off",
  "no-shadow": "off",
  "no-undef": "off",
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  "@typescript-eslint/no-shadow": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/no-unnecessary-condition": "off",
  "@typescript-eslint/restrict-template-expressions": "off",
  "@typescript-eslint/no-misused-promises": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-unnecessary-type-parameters": "off",
  "@typescript-eslint/non-nullable-type-assertion-style": "off",
  "@typescript-eslint/prefer-readonly": "error",
  "@typescript-eslint/no-unnecessary-type-assertion": "off"
};

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "output/**",
      "dist/**",
      "recovery-local-history/**",
      ".tsbuild/**",
      "tests/e2e/results/**",
      "scripts/app.js",
      ".github/skills/**/references/examples/**",
      ".github/skills/**/SKILL.md"
    ]
  },
  js.configs.recommended,
  {
    files: ["scripts/**/*.ts"],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: { ...globals.browser }
    },
    rules: strictTsRules
  },
  {
    files: [
      "scripts/build-runtime.mjs",
      "scripts/build-dist.mjs",
      "scripts/optimize-images.mjs",
      "tests/e2e/serve-static.mjs",
      "tests/unit/**/*.mjs"
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node }
    },
    rules: { ...strictRules, "no-console": "off" }
  },
  {
    files: ["tests/e2e/*.spec.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node, ...globals.browser }
    },
    rules: strictRules
  },
  {
    files: ["playwright.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node }
    },
    rules: strictRules
  },
  {
    files: ["index.html"],
    plugins: { "@html-eslint": html },
    languageOptions: {
      parser: htmlParser
    },
    rules: {
      ...html.configs["flat/recommended"].rules,
      "@html-eslint/require-meta-charset": "error",
      "@html-eslint/no-inline-styles": "error",
      "@html-eslint/require-button-type": "error",
      "@html-eslint/require-input-label": "error",
      "@html-eslint/no-target-blank": "error",
      "@html-eslint/no-positive-tabindex": "error",
      "@html-eslint/no-invalid-role": "error",
      "@html-eslint/no-abstract-roles": "error",
      "@html-eslint/no-redundant-role": "error",
      "@html-eslint/no-aria-hidden-body": "error",
      "@html-eslint/no-aria-hidden-on-focusable": "error",
      "@html-eslint/no-nested-interactive": "error",
      "@html-eslint/no-heading-inside-button": "error",
      "@html-eslint/no-accesskey-attrs": "error",
      "@html-eslint/no-duplicate-class": "error",
      "@html-eslint/require-meta-viewport": "error",
      "@html-eslint/no-non-scalable-viewport": "error",
      "@html-eslint/svg-require-viewbox": "error",
      "@html-eslint/prefer-https": "error",
      "@html-eslint/no-empty-headings": "error",
      "@html-eslint/no-whitespace-only-children": "error",
      "@html-eslint/no-script-style-type": "error",
      "@html-eslint/no-invalid-attr-value": "error",
      "@html-eslint/no-invalid-entity": "error",
      "@html-eslint/indent": "off",
      "@html-eslint/no-extra-spacing-attrs": "off",
      "@html-eslint/attrs-newline": "off",
      "@html-eslint/element-newline": "off",
      "@html-eslint/use-baseline": "off"
    }
  }
);


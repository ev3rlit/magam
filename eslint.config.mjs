import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import magamPlugin from './.eslint/magam-plugin.mjs';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            "**/dist",
            "**/build",
            "**/out-tsc",
            "**/.next",
            "**/node_modules",
            "**/coverage",
            "**/*.min.js"
        ]
    },
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        plugins: {
            magam: magamPlugin,
        },
        rules: {
            "magam/no-duplicate-ids": "error",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
        }
    }
);

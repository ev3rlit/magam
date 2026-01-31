import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            "**/dist",
            "**/out-tsc",
            "**/.next",
            "**/node_modules"
        ]
    },
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
        }
    }
);

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
    },
    {
        files: [
            "apps/web-demo/**/*.ts",
            "apps/web-demo/**/*.tsx",
            "apps/web-demo/**/*.js",
            "apps/web-demo/**/*.jsx",
            "apps/web-demo/**/*.mjs"
        ],
        rules: {
            "no-restricted-imports": ["error", {
                "paths": [
                    {
                        "name": "socket.io-client",
                        "message": "web-demo must stay chat-free and websocket-free."
                    },
                    {
                        "name": "ws",
                        "message": "web-demo must not depend on the local workspace websocket flow."
                    },
                    {
                        "name": "@magam/runtime",
                        "message": "web-demo reuse is limited to @magam/core and optionally @magam/shared."
                    },
                    {
                        "name": "@magam/cli",
                        "message": "web-demo must not depend on CLI/runtime packages."
                    }
                ],
                "patterns": [
                    {
                        "group": [
                            "app/**",
                            "../app/**",
                            "../../app/**",
                            "../../../app/**",
                            "../../../../app/**"
                        ],
                        "message": "web-demo must not import from the existing local workspace app."
                    }
                ]
            }]
        }
    },
    {
        files: ["scripts/check-web-demo-boundary.mjs"],
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly"
            }
        }
    }
);

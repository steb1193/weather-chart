import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
    includeIgnoreFile(gitignorePath),
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs.recommended,
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node }
        },
        rules: {
            'no-undef': 'off',
            indent: ['error', 4],
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-alert': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-arrow-callback': 'error',
            'arrow-spacing': 'error',
            'no-duplicate-imports': 'error',
            // TypeScript specific rules
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    args: 'after-used',
                    ignoreRestSiblings: true,
                    // Игнорируем параметры в интерфейсах и типах
                    argsIgnorePattern: '^(_|type|data|range|db|store|records|code|originalError)$'
                }
            ],
            'no-unused-vars': 'off', // Turn off base rule to avoid conflicts
            'no-unreachable': 'error',
            'no-constant-condition': 'error',
            'no-empty': 'error',
            'no-extra-semi': 'error',
            'no-func-assign': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'error',
            'no-obj-calls': 'error',
            'no-sparse-arrays': 'error',
            'no-unexpected-multiline': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',
            curly: ['error', 'all'],
            eqeqeq: ['error', 'always'],
            'no-caller': 'error',
            'no-else-return': 'error',
            'no-empty-function': 'error',
            'no-eq-null': 'error',
            'no-floating-decimal': 'error',
            'no-lone-blocks': 'error',
            'no-multi-spaces': 'error',
            'no-multi-str': 'error',
            'no-new': 'error',
            'no-new-wrappers': 'error',
            'no-octal': 'error',
            'no-octal-escape': 'error',
            'no-param-reassign': 'error',
            'no-proto': 'error',
            'no-return-assign': 'error',
            'no-script-url': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-throw-literal': 'error',
            'no-unused-expressions': 'error',
            'no-useless-call': 'error',
            'no-useless-concat': 'error',
            'no-void': 'error',
            radix: 'error',
            'wrap-iife': ['error', 'any'],
            yoda: 'error',
            strict: ['error', 'never'],
            'init-declarations': 'off',
            'no-catch-shadow': 'error',
            'no-delete-var': 'error',
            'no-label-var': 'error',
            'no-restricted-globals': 'error',
            'no-shadow': 'error',
            'no-shadow-restricted-names': 'error',
            'no-undef-init': 'error',
            'no-undefined': 'off',
            'no-use-before-define': ['error', { functions: false, classes: true }],
            'array-bracket-spacing': ['error', 'never'],
            'block-spacing': ['error', 'always'],
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            camelcase: ['error', { properties: 'never' }],
            'comma-dangle': ['error', 'never'],
            'comma-spacing': ['error', { before: false, after: true }],
            'comma-style': ['error', 'last'],
            'computed-property-spacing': ['error', 'never'],
            'func-call-spacing': ['error', 'never'],
            'key-spacing': ['error', { beforeColon: false, afterColon: true }],
            'keyword-spacing': ['error', { before: true, after: true }],
            'linebreak-style': ['error', 'unix'],
            'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
            'new-cap': ['error', { newIsCap: true, capIsNew: false }],
            'new-parens': 'error',
            'no-array-constructor': 'error',
            'no-continue': 'error',
            'no-lonely-if': 'error',
            'no-mixed-operators': 'error',
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
            'no-nested-ternary': 'error',
            'no-new-object': 'error',
            'no-trailing-spaces': 'error',
            'no-unneeded-ternary': 'error',
            'object-curly-spacing': ['error', 'always'],
            'one-var': ['error', 'never'],
            'operator-assignment': ['error', 'always'],
            'operator-linebreak': ['error', 'after'],
            'padded-blocks': ['error', 'never'],
            'quote-props': ['error', 'as-needed'],
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'semi-spacing': ['error', { before: false, after: true }],
            'space-before-blocks': ['error', 'always'],
            'space-before-function-paren': ['error', 'never'],
            'space-in-parens': ['error', 'never'],
            'space-infix-ops': 'error',
            'space-unary-ops': ['error', { words: true, nonwords: false }],
            'spaced-comment': ['error', 'always']
        }
    },
    {
        files: [
            '**/*.svelte',
            '**/*.svelte.ts',
            '**/*.svelte.js'
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: ['.svelte'],
                parser: ts.parser,
                svelteConfig
            }
        },
        rules: {
            'no-self-assign': 'off',
            'svelte/no-navigation-without-resolve': 'off',
            'no-undef-init': 'off'
        }
    }
);

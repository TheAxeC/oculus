// The linter, flat config. It runs over the three globs the code lives in, src/**/*.ts,
// src/**/*.svelte and tests/**/*.ts, with type information: typescript-eslint's projectService hands
// every rule the checker, which is what lets the strict set say anything about a value that came
// back as `unknown` from a parsed YAML file.
//
// The sets: @eslint/js recommended, typescript-eslint strictTypeChecked and stylisticTypeChecked,
// and eslint-plugin-svelte's recommended over the .svelte files, parsed by svelte-eslint-parser with
// typescript-eslint's parser inside the script blocks.
//
// Every rule tuned or turned off below names why. A rule is off only where the whole tree disagrees
// with it and the disagreement is the tree's design; a rule that is merely inconvenient at a site is
// on, and the site carries a disable comment naming the reason.

import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import ts from 'typescript-eslint';

export default ts.config(
    // Generated output, dependencies, the worktrees under .agents/ (each a whole checkout with its
    // own config, which eslint would otherwise lint as part of this one), and the one root file
    // that is build configuration rather than application code. The three globs below are the whole
    // of what is linted.
    {
        ignores: [
            '.agents/**',
            '.svelte-kit/**',
            'build/**',
            '.svelte-kit-app/**',
            'build-app/**',
            'node_modules/**',
            'eslint.config.js',
            'vite.config.ts'
        ]
    },
    {
        // A disable comment that no longer suppresses anything is a comment claiming a problem the
        // code does not have, so an unused one fails the lint rather than warning.
        linterOptions: { reportUnusedDisableDirectives: 'error' }
    },
    {
        files: ['src/**/*.ts', 'src/**/*.svelte', 'tests/**/*.ts'],
        extends: [
            js.configs.recommended,
            ts.configs.strictTypeChecked,
            ts.configs.stylisticTypeChecked
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: ['.svelte']
            },
            globals: { ...globals.browser, ...globals.node }
        },
        rules: {
            // Tuned to what the codebase already is.
            //
            // `var` is what a `declare global` block needs, and core `no-var` does not report one
            // inside such a block; the rule holds everywhere else.
            'no-var': 'error',
            // Every shape in the tree is declared with `type`, unions and aliases beside object
            // shapes, so the rule holds that form rather than the default `interface`. The two
            // interfaces of src/app.d.ts merge into SvelteKit's own `App` namespace, which only an
            // interface does, and each carries a disable comment saying so.
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            // A count in a message is a number, and `${n}` of a number is what the catalog's own
            // formatter does.
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
            // `onclick={() => (adding = !adding)}` is the shape every control in the tree is wired
            // with. A void expression anywhere else is still an error; a `{@render}` tag is one the
            // rule has no valid position to offer, and each of those carries a disable comment.
            '@typescript-eslint/no-confusing-void-expression': [
                'error',
                { ignoreArrowShorthand: true }
            ],
            // An async handler on a control is how a write is started from the page, and the DOM
            // ignores what it returns. The rule's other checks stay.
            '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
            // `{#each { length: n } as _, at (at)}` needs the positional binding it does not read,
            // and a test parameter is named `_name` where the case does not read it.
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ]
        }
    },
    {
        files: ['src/**/*.svelte'],
        extends: [svelte.configs['flat/recommended']],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: ts.parser,
                projectService: true,
                extraFileExtensions: ['.svelte']
            }
        },
        rules: {
            // `let x = $state(...)` and `let x = $derived(...)` are never reassigned by hand and
            // still may not be `const`: a rune declaration is a `let` by construction, and the core
            // rule reports every one of them. svelte/prefer-const is the same rule taught the runes,
            // so it replaces the core rule here and reports a real missed `const`.
            'prefer-const': 'off',
            'svelte/prefer-const': ['error', { excludedRunes: ['$derived', '$props', '$state'] }],
            // A disable comment in markup is a comment of the plugin's own, so the plugin is what
            // reports one that suppresses nothing; linterOptions above does not see it.
            'svelte/comment-directive': ['error', { reportUnusedDisableDirectives: true }]
        }
    },
    {
        // Every control a reader presses in a view is a ui/ primitive, which is what gives it the
        // theme's look, its focus ring and its keys. The primitives themselves and the shell draw
        // the raw elements, so the rule holds under views/ alone.
        files: ['src/lib/views/**/*.svelte'],
        rules: {
            'svelte/no-restricted-html-elements': [
                'error',
                {
                    elements: ['button', 'input', 'select', 'textarea'],
                    message:
                        'A view draws its controls with ui/ primitives (ToolButton, RowButton, Chip, the ui/forms inputs), never a raw element.'
                }
            ]
        }
    }
);

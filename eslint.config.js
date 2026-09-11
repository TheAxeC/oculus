// The linter, flat config. It runs over the three globs the code lives in, src/**/*.ts,
// src/**/*.svelte and tests/**/*.ts, with type information: typescript-eslint's projectService hands
// every rule the checker, which is what lets the strict set say anything about a value that came
// back as `unknown` from a parsed YAML file.
//
// The sets: @eslint/js recommended, typescript-eslint strictTypeChecked and stylisticTypeChecked,
// and eslint-plugin-svelte's recommended over the .svelte files, parsed by svelte-eslint-parser with
// typescript-eslint's parser inside the script blocks.
//
// Every rule tuned or turned off below names why and how many places it covered when Q1 measured it
// (`npx eslint . --format json`, 2026-09-11, 839 problems before this block and none after). A rule
// is off here only where making it pass would mean rewriting working code, which is not what this
// package does; the report lists every one of them as relaxed rather than satisfied.

import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import ts from 'typescript-eslint';

export default ts.config(
    // Generated output, dependencies, and the two root files that are build configuration rather
    // than application code. The three globs below are the whole of what is linted.
    {
        ignores: [
            '.svelte-kit/**',
            'build/**',
            'node_modules/**',
            'eslint.config.js',
            'vite.config.ts',
            // Beside vite.config.ts for the same two reasons: it is build configuration rather than
            // application code, and the generated .svelte-kit/tsconfig.json includes src/ and
            // tests/ and the root vite config and nothing else, so a type-aware rule over a root
            // file the project service does not hold is a parse error rather than a lint result.
            // The specs under tests/browser/ are linted by the tests/**/*.ts glob below.
            'playwright.config.ts'
        ]
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
            // The four `eslint-disable-next-line no-var` comments in the tree name this rule, and a
            // rule nothing enables is a rule those comments cannot be about. `var` is what a
            // `declare global` block needs, which is the whole of why the four are there.
            'no-var': 'error',
            // Every shape in the tree is declared with `type`, unions and aliases beside object
            // shapes, so the rule holds that form rather than the default `interface`: 286 sites
            // under the default, 4 under this option, and those 4 are excepted below.
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            // A count in a message is a number, and `${n}` of a number is what the catalog's own
            // formatter does. 128 sites, all of them a number.
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
            // `onclick={() => (adding = !adding)}` is the shape every control in the tree is wired
            // with. 183 sites, all arrow shorthand; a void expression anywhere else is still an
            // error, and the .svelte block below says what it does with the remaining 75.
            '@typescript-eslint/no-confusing-void-expression': [
                'error',
                { ignoreArrowShorthand: true }
            ],
            // An async handler on a control is how a write is started from the page, and the DOM
            // ignores what it returns. 6 sites, all of them a handler; the rule's other checks stay.
            '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
            // `{#each { length: n } as _, at (at)}` needs the positional binding it does not read.
            // 1 site, plus one test parameter renamed to `_name`.
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ],

            // Off. Each line is a rule this package relaxed rather than satisfied, with the count it
            // reported on 2026-09-11 and why making it pass is not a no-behaviour-change edit.
            //
            // 126 sites. The reader types a parsed YAML file optimistically and then checks it
            // anyway, which is the tree's whole defence against a hand-edited manifest; the checker
            // calls every one of those checks unnecessary because the type says so.
            '@typescript-eslint/no-unnecessary-condition': 'off',
            // 54, 50, 46, 35 and 22 sites. `any` reaches the tree from the untyped surfaces it does
            // not own: the xterm and ws types, a DOM event payload, and JSON.parse.
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            // 33 sites. A no-op callback in a test double and a no-op `close()` are deliberate.
            '@typescript-eslint/no-empty-function': 'off',
            // 21 sites. `String(value)` over a value the checker has already narrowed to a string is
            // the same defensive coercion as above, one line further in.
            '@typescript-eslint/no-unnecessary-type-conversion': 'off',
            // 20 sites. `delete record[key]` is how compact() drops the undefined keys of a record
            // before it is serialised.
            '@typescript-eslint/no-dynamic-delete': 'off',
            // 17 sites. Rewriting a chain of guards into `?.` changes the shape of code that reads
            // the way the tree reads everywhere else.
            '@typescript-eslint/prefer-optional-chain': 'off',
            // 15 sites, all `value ?? ''` over a value the type says could be an object. The reader
            // has already refused anything that is not a scalar by the time it reaches the template.
            '@typescript-eslint/no-base-to-string': 'off',
            // 14 and 11 sites. Both want an assertion rewritten or dropped where the checker and the
            // file disagree about what a parsed value is.
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/non-nullable-type-assertion-style': 'off',
            // 6 sites of `Array<T>`, 5 of them in the tmux reader and its test.
            '@typescript-eslint/array-type': 'off',
            // 4 sites of `x = x ?? y` rather than `x ??= y`.
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            // 3 sites of an index check rather than startsWith or endsWith.
            '@typescript-eslint/prefer-string-starts-ends-with': 'off',
            // 3 sites. A value assigned and then overwritten before it is read; a real finding, and
            // the fix is a statement moved, not a rule satisfied. The report names the three.
            'no-useless-assignment': 'off',
            // 3 sites, all an `async` test callback with nothing to await.
            '@typescript-eslint/require-await': 'off',
            // 2 sites, both a method of the node child_process module passed by name.
            '@typescript-eslint/unbound-method': 'off',
            // 2 sites of a non-null assertion in a test.
            '@typescript-eslint/no-non-null-assertion': 'off',
            // 1 site each.
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
            '@typescript-eslint/prefer-regexp-exec': 'off',
            '@typescript-eslint/no-this-alias': 'off'
        }
    },
    {
        // SvelteKit's `App` namespace is augmented by declaration merging, which only an interface
        // does, and data/model.ts's three raw records carry an index signature beside named fields
        // for the same reason. 4 sites, the whole of what the `type` option above could not cover.
        files: ['src/app.d.ts', 'src/lib/data/model.ts'],
        rules: { '@typescript-eslint/consistent-type-definitions': 'off' }
    },
    {
        // The four `eslint-disable-next-line no-var` comments the brief keeps as they are. Core
        // `no-var` does not report a `var` inside a `declare global` block, so the four directives
        // are inert and would each be reported as unused. They stay; the report of them does not.
        files: [
            'src/lib/server/auth.ts',
            'src/lib/server/pty/channel.ts',
            'src/lib/server/sessions/hooks.ts',
            'src/lib/server/watch/git.ts'
        ],
        linterOptions: { reportUnusedDisableDirectives: 'off' }
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
            // still may not be `const`: a rune declaration is a `let` by construction. The core rule
            // reported 195 of them. svelte/prefer-const is the same rule taught the runes, with
            // `$state` added to the runes it excludes, which is the remaining 3.
            'prefer-const': 'off',
            'svelte/prefer-const': ['error', { excludedRunes: ['$derived', '$props', '$state'] }],
            // 189 reports over 20 comments. The tree writes `<!-- svelte-ignore a11y_x <why> -->`,
            // the reason beside the code; the rule reads every word of the reason as another code
            // and reports each one as unused. Svelte's own compiler does not.
            'svelte/no-unused-svelte-ignore': 'off',
            // 5 sites. The Markdown rendered with {@html} is the owner's own file off the owner's
            // own disk, which is what api/docs and the two views that draw it say at length.
            'svelte/no-at-html-tags': 'off',
            // 2 sites. A Set and a Map held as a plain local that nothing renders from.
            'svelte/prefer-svelte-reactivity': 'off',
            // 2 sites, both an href to api/file rather than a route of this application.
            'svelte/no-navigation-without-resolve': 'off',
            // 75 sites, every one of them a `{@render snippet()}` tag. A render tag is a void call
            // that svelte-eslint-parser presents to the rule as an expression inside a template
            // node, and there is no statement to move it to. The rule stays on for every .ts file.
            '@typescript-eslint/no-confusing-void-expression': 'off'
        }
    }
);

// Layer 3, primitive. The editor's languages: the Shiki grammar each of the highlighter's names is
// coloured with. The editor takes oculus's name for a language, the one the status bar shows, the
// code window paints with and the map of config/sources.yml gives a file, and a model's Monaco
// language is the Shiki id this table answers, so the tokens provider `shikiToMonaco` sets finds
// the language registered under that same id.
//
// Five names are spelt otherwise in Shiki (bash, fortran, fortran-fixed, lisp, makefile); the rest
// are Shiki's own, and rite is the one id Shiki does not bundle: its grammar is carried in
// kit/rite/rite.ts. Plaintext is Monaco's own language and loads no grammar, and a name outside
// the table is plaintext as well.
//
// Two lists split the grammars by when they load. The eighteen of `FIRST_LANGUAGES` load with the
// first editor of the page. The others load when the first model of their language is made, set or
// picked (kit/load.ts's `ensureLanguage`), so a page that opens no Lua file never fetches Lua's
// grammar. Shiki's Svelte and Jinja grammars embed others: Svelte brings javascript, typescript,
// css and postcss, and Jinja brings javascript, css, html and jinja-html; Shiki's SCSS grammar
// brings css. Once one of them has loaded, Shiki's tokens colour those embedded languages' models
// too, in place of Monaco's own.

/** Oculus's name for a language to the Shiki grammar that colours it. */
const SHIKI_IDS: Record<string, string> = {
    bash: 'shellscript',
    c: 'c',
    cmake: 'cmake',
    cpp: 'cpp',
    css: 'css',
    dart: 'dart',
    diff: 'diff',
    fortran: 'fortran-free-form',
    'fortran-fixed': 'fortran-fixed-form',
    ini: 'ini',
    java: 'java',
    javascript: 'javascript',
    jinja: 'jinja',
    json: 'json',
    julia: 'julia',
    latex: 'latex',
    lisp: 'common-lisp',
    lua: 'lua',
    makefile: 'make',
    markdown: 'markdown',
    matlab: 'matlab',
    ocaml: 'ocaml',
    python: 'python',
    r: 'r',
    rite: 'rite',
    ruby: 'ruby',
    scss: 'scss',
    svelte: 'svelte',
    typescript: 'typescript',
    xml: 'xml',
    yaml: 'yaml'
};

/** The names of the eighteen languages whose grammars load with the first editor. */
const FIRST_NAMES: readonly string[] = [
    'bash',
    'css',
    'diff',
    'ini',
    'javascript',
    'json',
    'julia',
    'latex',
    'lisp',
    'makefile',
    'markdown',
    'matlab',
    'ocaml',
    'python',
    'r',
    'typescript',
    'xml',
    'yaml'
];

/** The language Monaco draws uncoloured text in, which needs no grammar. */
export const PLAINTEXT = 'plaintext';

/** Every name of oculus's the editor colours, plaintext apart. */
export const SHIKI_NAMES: readonly string[] = Object.keys(SHIKI_IDS);

/** Every grammar the editor can load, by its Shiki id. */
export const SHIKI_LANGUAGES: readonly string[] = Object.values(SHIKI_IDS);

/** The grammars the first editor of the page loads. */
export const FIRST_LANGUAGES: readonly string[] = FIRST_NAMES.map((name) => SHIKI_IDS[name]);

/** The Shiki id, and the editor's language id, of one of oculus's language names. */
export function shikiId(name: string): string {
    return Object.hasOwn(SHIKI_IDS, name) ? SHIKI_IDS[name] : PLAINTEXT;
}

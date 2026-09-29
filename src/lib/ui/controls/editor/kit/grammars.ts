// Layer 3, primitive. The editor's languages: the Shiki grammar each of the highlighter's names is
// coloured with. The editor takes oculus's name for a language, the one the status bar shows and
// the code window paints with, and a model's Monaco language is the Shiki id this table answers, so
// the tokens provider `shikiToMonaco` sets finds the language registered under that same id.
//
// Three names are spelt otherwise in Shiki; the rest are Shiki's own. Plaintext is Monaco's own
// language and loads no grammar, and a name outside the table is plaintext as well.

/** Oculus's name for a language to the Shiki grammar that colours it. */
const SHIKI_IDS: Record<string, string> = {
    bash: 'shellscript',
    css: 'css',
    diff: 'diff',
    ini: 'ini',
    javascript: 'javascript',
    json: 'json',
    julia: 'julia',
    latex: 'latex',
    lisp: 'common-lisp',
    makefile: 'make',
    markdown: 'markdown',
    matlab: 'matlab',
    ocaml: 'ocaml',
    python: 'python',
    r: 'r',
    typescript: 'typescript',
    xml: 'xml',
    yaml: 'yaml'
};

/** The language Monaco draws uncoloured text in, which needs no grammar. */
export const PLAINTEXT = 'plaintext';

/** Every grammar the page's one highlighter loads. */
export const SHIKI_LANGUAGES: readonly string[] = Object.values(SHIKI_IDS);

/** The Shiki id, and the editor's language id, of one of oculus's language names. */
export function shikiId(name: string): string {
    return Object.hasOwn(SHIKI_IDS, name) ? SHIKI_IDS[name] : PLAINTEXT;
}

// Layer 2, types. highlight.js ships types for its core build and none for its language modules, so
// the subpath is declared here as what it is: a module whose default export is a language
// definition.

declare module 'highlight.js/lib/languages/*' {
    import type { LanguageFn } from 'highlight.js';
    const language: LanguageFn;
    export default language;
}

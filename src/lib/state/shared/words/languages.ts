// Layer 2, client state. The page layers' way in to the highlighter, which lives in the data layer
// (data/prose/languages.ts) because the server paints the code of a document and a transcript turn
// with it too. The state row of the layer table lets state import that one data module, and a view
// imports state, so the state and view modules that paint or name a language import it from here.

export {
    PLAIN,
    codeHtml,
    languageNamed,
    lineNumbers,
    registered
} from '../../../data/prose/languages.ts';

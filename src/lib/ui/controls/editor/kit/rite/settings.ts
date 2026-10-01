// Layer 3, primitive. The language settings Monaco is given for the languages it has none of: the
// comment, the brackets and the auto-closing pairs of rite, CMake, both forms of Fortran, Jinja and
// Svelte, so that Cmd+/ toggles a comment, a bracket closes and a pair matches in each. The
// languages Monaco registers itself (C, C++, Lua, Ruby, SCSS, Java, Dart) keep its own settings.
// The ids are the ones the editor registers (kit/grammars.ts's `shikiId`), which is Shiki's.

import type * as Monaco from 'monaco-editor';
import { RITE_CONFIGURATION } from './rite';

/** What registering settings needs of Monaco. */
type Registry = { languages: Pick<typeof Monaco.languages, 'setLanguageConfiguration'> };

/** The three bracket pairs every one of these languages has. */
const BRACKETS: Monaco.languages.CharacterPair[] = [
    ['(', ')'],
    ['[', ']'],
    ['{', '}']
];

/** The settings of a language that comments with `comments` and has the three bracket pairs. */
function bracketed(comments: Monaco.languages.CommentRule): Monaco.languages.LanguageConfiguration {
    return {
        comments,
        brackets: BRACKETS,
        autoClosingPairs: BRACKETS.map(([open, close]) => ({ open, close }))
    };
}

/** Give Monaco the settings of rite and of the languages it does not know. */
export function registerSettings(monaco: Registry): void {
    const { languages } = monaco;
    // Monaco reads a surrounding pair as an object; the file gives it as a two-element array.
    const surroundingPairs = RITE_CONFIGURATION.surroundingPairs.map(([open, close]) => ({
        open,
        close
    }));
    languages.setLanguageConfiguration('rite', { ...RITE_CONFIGURATION, surroundingPairs });
    languages.setLanguageConfiguration('cmake', bracketed({ lineComment: '#' }));
    languages.setLanguageConfiguration('fortran-free-form', bracketed({ lineComment: '!' }));
    languages.setLanguageConfiguration('fortran-fixed-form', bracketed({ lineComment: '!' }));
    languages.setLanguageConfiguration('jinja', bracketed({ blockComment: ['{#', '#}'] }));
    languages.setLanguageConfiguration('svelte', bracketed({ blockComment: ['<!--', '-->'] }));
}

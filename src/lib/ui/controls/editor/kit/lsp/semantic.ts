// Layer 3, primitive. The semantic tokens of a served C or C++ model. The relay offers Monaco's
// client no semantic tokens provider, so the client's own (which asks a server's delta and cannot
// be refreshed) is never made, and the host registers this one per language instead. It asks the
// server for the model's tokens through the transport, and keeps from the answer only the tokens
// whose type has a row in `SEMANTIC_ROWS` and whose colour the theme in force gives (a rule of
// kit/theme/semantic.ts): a token of any other type, and a token of a row the theme does not
// colour, keeps Shiki's colour, as the TextMate colour is kept in VS Code.
//
// What is kept is written in the legend this module owns, not the server's: the type is the row's
// type and the modifiers are `defaultLibrary` and `readonly` alone, the two VS Code's defaults
// style, so Monaco's lookup string is `<type>`, `<type>.defaultLibrary`, `<type>.readonly` or
// `<type>.defaultLibrary.readonly`. The relative positions of the kept tokens are written again
// over the tokens that were dropped.

import type * as Monaco from 'monaco-editor';
import { SEMANTIC_MODIFIERS, SEMANTIC_TYPES } from '../theme/semantic';
import { Signal } from './signal';

/** The token types and modifiers a server answers its tokens in. */
export type Legend = { types: readonly string[]; modifiers: readonly string[] };

/** The legend the provider offers Monaco. */
const LEGEND: Monaco.languages.SemanticTokensLegend = {
    tokenTypes: [...SEMANTIC_TYPES],
    tokenModifiers: [...SEMANTIC_MODIFIERS]
};

/** Whether a rule of the theme covers a lookup string: the string or a prefix of it by segments. */
function covered(lookup: string, ruled: ReadonlySet<string>): boolean {
    const parts = lookup.split('.');
    for (let length = parts.length; length > 0; length -= 1) {
        if (ruled.has(parts.slice(0, length).join('.'))) return true;
    }
    return false;
}

/**
 * The tokens of a server's answer written for Monaco: the five integers of each token are the line
 * and character it moves from the one before, its length, its type and its modifier bits.
 */
function remapTokens(
    data: readonly number[],
    legend: Legend,
    ruled: ReadonlySet<string>
): Uint32Array {
    const kept: number[] = [];
    let line = 0;
    let character = 0;
    let lastLine = 0;
    let lastCharacter = 0;
    for (let at = 0; at + 4 < data.length; at += 5) {
        line += data[at];
        character = data[at] === 0 ? character + data[at + 1] : data[at + 1];
        const type = SEMANTIC_TYPES.indexOf(legend.types[data[at + 3]] ?? '');
        if (type < 0) continue;
        let bits = 0;
        for (const [bit, name] of SEMANTIC_MODIFIERS.entries()) {
            const held = legend.modifiers.indexOf(name);
            if (held >= 0 && (data[at + 4] & (1 << held)) !== 0) bits |= 1 << bit;
        }
        const lookup = [
            SEMANTIC_TYPES[type],
            ...SEMANTIC_MODIFIERS.filter((_, bit) => (bits & (1 << bit)) !== 0)
        ].join('.');
        if (!covered(lookup, ruled)) continue;
        const moved = line - lastLine;
        kept.push(
            moved,
            moved === 0 ? character - lastCharacter : character,
            data[at + 2],
            type,
            bits
        );
        lastLine = line;
        lastCharacter = character;
    }
    return new Uint32Array(kept);
}

/** What the provider reads of the page. */
export type SemanticSource = {
    /** The server's tokens of a model, null while it has none to give. */
    tokens(model: Monaco.editor.ITextModel): Promise<readonly number[] | null>;
    /** The legend the server of a model answers in, null before it is ready. */
    legend(model: Monaco.editor.ITextModel): Legend | null;
    /** The lookup strings the theme in force has a rule for. */
    ruled(): ReadonlySet<string>;
};

/** The provider of one language, and the call that makes Monaco ask again for every model. */
export function semanticProvider(source: SemanticSource): {
    provider: Monaco.languages.DocumentSemanticTokensProvider;
    refresh: () => void;
} {
    const changed = new Signal();
    return {
        refresh: () => changed.fire(),
        provider: {
            onDidChange: changed.event,
            getLegend: () => LEGEND,
            releaseDocumentSemanticTokens: () => undefined,
            provideDocumentSemanticTokens: async (model) => {
                const legend = source.legend(model);
                const data = legend === null ? null : await source.tokens(model);
                if (legend === null || data === null) return null;
                return { data: remapTokens(data, legend, source.ruled()) };
            }
        }
    };
}

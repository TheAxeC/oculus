// Layer 3, primitive. The TextMate grammars of the acting apps, as the registrations Shiki loads. A
// grammar that names a language is that language's grammar, registered under the language's id so
// the tokens provider Shiki's bridge sets lands on the language Monaco has. The grammars its
// `embeddedLanguages` name come with it, loaded first in the same call: another app's grammar by
// its registration, a shipped language by its Shiki id. A grammar that names no language, with
// `injectTo`, is loaded on its own into every highlighter (`injectionsOf`), and a failure of one
// leaves the others. A grammar that names a language oculus ships a grammar for is not used: the
// shipped grammar is kept for it, and its `injectTo` grammar still injects. The grammar's own
// `name` is the human name TextMate files carry; Shiki's name for it is the language id (or the
// scope name for an injection).

import type { LanguageRegistration } from 'shiki';
import type {
    AppEditorGrammar,
    AppLanguageKit
} from '$lib/data/helpers/files/apps/tools/language-kit';
import { PLAINTEXT, bundledId } from './grammars';

/** What Shiki loads a grammar from: a bundled id, or a registration. */
export type Loadable = string | LanguageRegistration;

/** The registration of a grammar under a name. */
function registration(grammar: AppEditorGrammar, name: string): LanguageRegistration {
    return {
        ...(grammar.grammar as Record<string, unknown>),
        name,
        scopeName: grammar.scopeName,
        ...(grammar.injectTo.length === 0 ? {} : { injectTo: grammar.injectTo })
    } as LanguageRegistration;
}

/** The grammar an app brings for a language no shipped grammar covers. */
function ownGrammar(kit: AppLanguageKit, id: string): AppEditorGrammar | undefined {
    if (bundledId(id) !== null || id === PLAINTEXT) return undefined;
    return kit.grammars.find((one) => one.language === id);
}

/**
 * What a language's grammar is loaded from: the grammars it embeds and then its own, or nothing
 * when no app brings a grammar for the language.
 */
export function grammarsOf(kit: AppLanguageKit, id: string): Loadable[] {
    const own = ownGrammar(kit, id);
    if (own === undefined) return [];
    const out: Loadable[] = [];
    const seen = new Set<string>([id]);
    const visit = (grammar: AppEditorGrammar): void => {
        for (const target of Object.values(grammar.embeddedLanguages)) {
            if (seen.has(target)) continue;
            seen.add(target);
            const app = ownGrammar(kit, target);
            if (app !== undefined) {
                visit(app);
                out.push(registration(app, target));
                continue;
            }
            const bundled = bundledId(target);
            if (bundled !== null) out.push(bundled);
        }
    };
    visit(own);
    out.push(registration(own, id));
    return out;
}

/** The grammars that only inject into others, each as the list it is loaded from. */
export function injectionsOf(kit: AppLanguageKit): LanguageRegistration[] {
    return kit.grammars
        .filter(
            (one) =>
                one.injectTo.length > 0 && (one.language === '' || bundledId(one.language) !== null)
        )
        .map((one) => registration(one, one.scopeName));
}

/** Whether an app brings a grammar for this language id. */
export function hasGrammar(kit: AppLanguageKit, id: string): boolean {
    return ownGrammar(kit, id) !== undefined;
}

// Layer 3, primitive. What the acting apps give the editor, held for the kit: the page hands it the
// value state computes (`set`, from the shell), and the kit reads it where it registers languages,
// grammars, snippets and schemas, and where it asks which languages a server serves. The editor
// holds no state, so the value arrives as a parameter of the kit and not as a read of the stores.
//
// A change is announced to the listeners the kit registers (`onChange`), once for each `set` that
// changes the value. `version` is a reactive counter that grows with each change, which an effect
// that asks for a language's id (`shikiId`) reads, so a model's language is set again when an app
// adds the language it is drawn in.

import { SERVED_LANGUAGES } from '$lib/data/prose/lsp-servers';
import type { AppLanguageKit } from '$lib/data/helpers/files/apps/tools/language-kit';
import { Signal } from '../lsp/signal';

/** The kit before any app gave anything: the languages the shipped servers serve. */
const NONE: AppLanguageKit = {
    languages: [],
    grammars: [],
    snippets: [],
    semantic: { types: [], modifiers: [], scopes: [] },
    schemas: [],
    served: [...SERVED_LANGUAGES]
};

let held: AppLanguageKit = NONE;
let signature = JSON.stringify(NONE);
let version = $state(0);
const changed = new Signal();

/** What the acting apps give the editor now. */
export function appKit(): AppLanguageKit {
    return held;
}

/** Hear every change of it; the call it answers stops hearing. */
export function onAppKit(listener: () => void): { dispose(): void } {
    return changed.event(listener);
}

/** The reactive counter of changes. */
export function appKitVersion(): number {
    return version;
}

/** Take a new value, doing nothing when it equals the one held. */
export function setAppKit(next: AppLanguageKit): void {
    const text = JSON.stringify(next);
    if (text === signature) return;
    signature = text;
    held = next;
    version += 1;
    changed.fire();
}

/** Whether an app added a language of this id. */
export function appLanguage(id: string): boolean {
    void appKitVersion();
    return held.languages.some((one) => one.id === id);
}

/** The ids of the languages a language server serves. */
export function servedLanguages(): readonly string[] {
    return held.served;
}

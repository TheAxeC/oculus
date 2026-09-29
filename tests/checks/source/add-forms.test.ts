// Layer 4, test. One add form per collection in a view, which is what the drafts keep room for.
//
// A form's typed values are kept under the collection and the entry's id, or null for the form that
// adds one (`formKey` of state/forms/form-drafts.svelte.ts), so two add forms of one collection in
// one view instance would be one draft: each would show what was typed into the other, and a save
// from one would take the other's values. No view draws two today, and this is what says so the day
// one is written.
//
// An add form is an `<EntryForm` whose `entry` is `null` or absent; a card's edit form passes the
// entry it edits and is one form per entry, so a list of them is no clash.

import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fileCode } from './code.ts';
import { treeFiles } from '../walk.ts';

const ENGINE = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/** Every component under a folder, as paths relative to the engine. */
function components(dir: string): string[] {
    return treeFiles(dir)
        .filter((rel) => rel.endsWith('.svelte'))
        .map((rel) => join(dir, rel));
}

/**
 * The props of every `<EntryForm` a component draws, each the text between the tag and its end.
 */
export function entryForms(text: string): string[] {
    const found: string[] = [];
    const bare = fileCode('one.svelte', text);
    for (let at = bare.indexOf('<EntryForm'); at !== -1; at = bare.indexOf('<EntryForm', at + 1)) {
        const end = bare.indexOf('/>', at);
        found.push(bare.slice(at + '<EntryForm'.length, end === -1 ? bare.length : end));
    }
    return found;
}

/**
 * Whether a form's props say it adds an entry rather than editing one: it names no entry at all, by
 * either spelling, or names `null`.
 */
export function addsEntry(props: string): boolean {
    if (/\{\s*entry\s*\}/.test(props)) return false;
    const held = /entry=\{([^}]*)\}/.exec(props);
    return held === null || held[1].trim() === 'null';
}

/** Every component drawing more than one add form, which would be two forms over one draft. */
export function twoAddForms(root: string): string[] {
    return components(root)
        .filter((file) => entryForms(readFileSync(file, 'utf8')).filter(addsEntry).length > 1)
        .map((file) => `${relative(ENGINE, file)} draws two add forms`)
        .sort();
}

describe('an add form', () => {
    it('audits that no view draws a second one, which would type into its draft', () => {
        expect(twoAddForms(join(ENGINE, 'src', 'lib', 'views'))).toEqual([]);
        expect(twoAddForms(join(ENGINE, 'src', 'lib', 'shell'))).toEqual([]);
    });

    it('audits that it reads a form the source draws, and an edit form as no add form', () => {
        const drawn = `<EntryForm collection={key} {schema} entry={null} onclose={close} />
            <EntryForm collection="data" {schema} {entry} onclose={close} />
            <EntryForm collection="venues" {schema} onclose={close} />`;
        expect(entryForms(drawn).map(addsEntry)).toEqual([true, false, true]);
        // A form named in a string or a comment is neither.
        expect(
            entryForms('<script>\n    const drawn = "<EntryForm entry={null} />";\n</script>')
        ).toEqual([]);
    });
});

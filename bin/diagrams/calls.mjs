// Layer 4, tool. How the write reader reads the calls of one function's text: where each call by a
// bare name is written and the arguments it passes, the parameters a function declares, and the
// aliases a text binds, a name given another name or one member of one.
//
// Everything here reads text whose comments code.mjs's codeOf() already blanked, one function at
// a time, so a call named in a comment is not a call and a name is looked up in the text it is
// written in. An alias is only what the text itself says a name holds: a `const` given a name or a
// member of one, a destructuring of a name, and a `let` or `var` given one and never assigned
// again. A name whose value is decided by a branch, a later assignment or a call is no alias, since
// only a run says which function it holds.

import { KEYWORDS } from './source.mjs';

/** A name as the source writes one. */
const NAME = '[A-Za-z_$][\\w$]*';

/** Exactly one name, which is what an argument has to be for a function passed by name. */
export const BARE = new RegExp(`^${NAME}$`);

/** A name as a pattern of its own, its `$` escaped. */
function literal(/** @type {string} */ name) {
    return name.replace(/\$/g, '\\$');
}

/** The function names a text calls, a property call left out. */
export function callsIn(/** @type {string} */ text) {
    const found = new Set();
    for (const site of callSites(text)) found.add(site.name);
    return found;
}

/**
 * Every call a text makes by a bare name: the name, where the call is written, and where its
 * opening parenthesis is. A call through a member (`a.b(`) is not one of them.
 *
 * @param {string} text
 * @returns {{ name: string, at: number, open: number }[]}
 */
export function callSites(text) {
    const found = [];
    for (const match of text.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
        if (KEYWORDS.has(match[1])) continue;
        found.push({ name: match[1], at: match.index, open: match.index + match[0].length - 1 });
    }
    return found;
}

/**
 * The comma-separated parts of the bracketed list that opens at `open`, trimmed, a trailing empty
 * part left out. A comma inside a nested bracket or a string is part of its item; with `types`, so
 * is one inside a type's angle brackets (`Map<string, number>`), where an arrow's `>` is not one.
 *
 * @param {string} text
 * @param {number} open
 * @param {boolean} [types]
 * @returns {string[]}
 */
export function listAt(text, open, types = false) {
    const parts = [];
    let depth = 0;
    let start = open + 1;
    let quote = '';
    for (let at = open; at < text.length; at += 1) {
        const char = text[at];
        if (quote !== '') {
            if (char === '\\') at += 1;
            else if (char === quote) quote = '';
            continue;
        }
        if (char === "'" || char === '"' || char === '`') quote = char;
        else if ('([{'.includes(char) || (types && char === '<')) depth += 1;
        else if (')]}'.includes(char) || (types && char === '>' && text[at - 1] !== '=')) {
            depth -= 1;
            if (depth === 0) {
                parts.push(text.slice(start, at));
                break;
            }
        } else if (char === ',' && depth === 1) {
            parts.push(text.slice(start, at));
            start = at + 1;
        }
    }
    const trimmed = parts.map((part) => part.trim());
    if (trimmed.at(-1) === '') trimmed.pop();
    return trimmed;
}

/**
 * The parameter names of the function `name` a declaration's text declares, by position; a
 * destructured parameter has no name and is ''. A declaration that declares no function has none.
 *
 * @param {string} text
 * @param {string} name
 * @returns {string[]}
 */
export function parametersOf(text, name) {
    const own = literal(name);
    const listed = new RegExp(
        `(?:function\\s*\\*?\\s*${own}\\s*(?:<[^(]*>)?\\s*\\(|(?<![\\w$.])${own}\\s*(?::[^=]+)?=\\s*(?:async\\s+)?(?:function\\s*\\*?\\s*(?:${NAME})?\\s*)?\\()`
    ).exec(text);
    if (listed !== null) {
        return listAt(text, listed.index + listed[0].length - 1, true).map((part) => {
            const found = new RegExp(`^(?:\\.\\.\\.)?\\s*(${NAME})`).exec(part);
            return found === null ? '' : found[1];
        });
    }
    const single = new RegExp(`(?<![\\w$.])${own}\\s*=\\s*(?:async\\s+)?(${NAME})\\s*=>`).exec(
        text
    );
    return single === null ? [] : [single[1]];
}

/** Whether `name` is assigned again in a text after the index its declaration ends at. */
function assignedAgain(/** @type {string} */ text, /** @type {string} */ name, from = 0) {
    return new RegExp(`(?<![\\w$.])${literal(name)}\\s*=(?![=>])`).test(text.slice(from));
}

/**
 * The aliases a text binds, each with what it names: a name, or a name and one of its members
 * (`fs.writeFileSync`).
 *
 * @param {string} text
 * @returns {Map<string, string>}
 */
export function aliasesIn(text) {
    const found = new Map();
    const single = new RegExp(
        `\\b(const|let|var)\\s+(${NAME})\\s*(?::[^=;]+)?=\\s*(${NAME}(?:\\.${NAME})?)\\s*;`,
        'g'
    );
    for (const match of text.matchAll(single)) {
        const [, kind, name, target] = match;
        const end = match.index + match[0].length;
        if (kind !== 'const' && assignedAgain(text, name, end)) continue;
        found.set(name, target);
    }
    const destructured = new RegExp(
        `\\b(const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*(${NAME})\\s*;`,
        'g'
    );
    for (const match of text.matchAll(destructured)) {
        const end = match.index + match[0].length;
        for (const part of match[2].split(',')) {
            const bound = new RegExp(`^\\s*(${NAME})\\s*(?::\\s*(${NAME}))?\\s*$`).exec(part);
            if (bound === null) continue;
            const name = bound[2] ?? bound[1];
            if (match[1] !== 'const' && assignedAgain(text, name, end)) continue;
            found.set(name, `${match[3]}.${bound[1]}`);
        }
    }
    return found;
}

/**
 * The alias a top-level declaration is when it is nothing else, `export const save = writeFile;`,
 * or undefined.
 */
export function moduleAlias(/** @type {string} */ name, /** @type {string} */ declaration) {
    const whole = new RegExp(
        `^(?:export\\s+)?(?:const|let|var)\\s+${literal(name)}\\s*(?::[^=;]+)?=\\s*(${NAME}(?:\\.${NAME})?)\\s*;$`
    ).exec(declaration.trim());
    return whole === null ? undefined : whole[1];
}

/** What a name stands for once every alias it goes through is followed. */
export function unalias(/** @type {string} */ name, /** @type {Map<string, string>} */ aliases) {
    let at = name;
    for (let hop = 0; hop < 8; hop += 1) {
        const next = aliases.get(at);
        if (next === undefined || next === at) break;
        at = next;
        if (at.includes('.')) break;
    }
    return at;
}

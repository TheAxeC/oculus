// Layer 1, data. What replacing a match writes: the groups of a match read out of ripgrep's own
// replacement, and the replace text turned into the text one match is replaced with, by the rules
// of VS Code's Search view.
//
// The page and the server both call it. The page draws the preview of a hit from it as the replace
// text is typed, and the server computes what it writes from it, so a preview and a write cannot
// disagree about what a replace text means. Nothing here runs a process or touches a file.
//
// ripgrep finds the matches and reports the text of every group of the pattern through a template
// (`replaceTemplate`): each group is written as a private-use marker, the group's key, a second
// marker and the group's text, and `groupsFrom` splits ripgrep's replacement back into a map by
// group number and by group name, group 0 being the match. `replacementOf` then reads the replace
// text over those groups the way VS Code reads it for a match:
//
// - In regular-expression mode `\\`, `\n` and `\t` become a backslash, a line feed and a tab, and
//   `$0` becomes `$&`. The text is read as holding parameters only when it holds `$0`, `$1` to
//   `$99`, `` $` `` or `$'`; without one it is written as it stands, so `$&` and `$$` alone are
//   written as typed. With parameters the text is substituted as JavaScript's `String.prototype.
//   replace` substitutes it, and `` $` `` and `$'` are the empty text because the text replaced is
//   the match alone.
// - A run of `\u`, `\U`, `\l` and `\L` directly before `$N` upper-cases or lower-cases the group's
//   text one character per operation, `\U` and `\L` taking the rest of the text.
// - Preserve Case copies the case of the match onto the replace text before anything else.
// - In literal mode the text is written as typed, a backslash included.
//
// The rules are those of VS Code's `ReplacePattern` (src/vs/workbench/services/search/common/
// replace.ts) and `buildReplaceStringWithCasePreserved` (src/vs/base/common/search.ts), written
// again here in this module's own words.
//
// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License, which
// is the source these rules follow.

/** The marker that opens a group's key in a template. */
const KEY_OPEN = '\ue002';

/** The marker that closes a group's key, after which the group's text follows. */
const KEY_CLOSE = '\ue003';

/** Whether a text holds one of the four private-use characters this module writes with. */
export function hasMarker(text: string): boolean {
    return /[\ue000-\ue003]/.test(text);
}

/** The text of every group of one match: its number or its name, group 0 being the match. */
export type MatchGroups = Record<string, string>;

/** How a replace text is read: the search mode, Preserve Case and the file's line end. */
type ReplaceOptions = {
    /** The search pattern was a regular expression, which is what makes the text a template. */
    regex: boolean;
    preserveCase: boolean;
    /** The file ends its lines with CRLF, so a line feed the text writes is written as CRLF. */
    crlf: boolean;
};

/** The capture groups of a pattern under ripgrep's syntax: how many, and the names given. */
type PatternGroups = { count: number; names: string[] };

/** The index after the character class that opens at `from`, nested classes and escapes read. */
function classEnd(pattern: string, from: number): number {
    let depth = 0;
    let at = from;
    while (at < pattern.length) {
        const here = pattern[at];
        if (here === '\\') {
            at += 2;
            continue;
        }
        if (here === '[') {
            depth += 1;
            at += 1;
            // A `^` and then a `]` directly after the opening bracket are members of the class.
            if (pattern[at] === '^') at += 1;
            if (pattern[at] === ']') at += 1;
            continue;
        }
        at += 1;
        if (here === ']') {
            depth -= 1;
            if (depth === 0) return at;
        }
    }
    return pattern.length;
}

/** The name a group opening at `from` is given, or null when it is not a named group. */
function groupName(pattern: string, from: number): string | null {
    const named = /^\(\?P?<([A-Za-z_][A-Za-z0-9_.[\]]*)>/.exec(pattern.slice(from, from + 80));
    return named === null ? null : named[1];
}

/**
 * The groups of a pattern. An unescaped `(` outside a character class opens a group when it is
 * not followed by `?`, or is followed by `?P<` or `?<` and a name; every other `(?` is a group
 * that does not capture.
 */
function groupsIn(pattern: string): PatternGroups {
    const names: string[] = [];
    let count = 0;
    let at = 0;
    while (at < pattern.length) {
        const here = pattern[at];
        if (here === '\\') {
            at += 2;
        } else if (here === '[') {
            at = classEnd(pattern, at);
        } else {
            if (here === '(') {
                if (pattern[at + 1] !== '?') {
                    count += 1;
                } else {
                    const name = groupName(pattern, at);
                    if (name !== null) {
                        count += 1;
                        names.push(name);
                    }
                }
            }
            at += 1;
        }
    }
    return { count, names };
}

/** The keys a template reports, in order: the numbers from 0 to the count, then each name. */
function keysOf(groups: PatternGroups): string[] {
    return [
        ...Array.from({ length: groups.count + 1 }, (_, number) => String(number)),
        ...groups.names
    ];
}

/**
 * The text ripgrep is given as its replacement, so that each match it reports carries the text of
 * every group of the pattern. The empty string for a pattern read as literal text, which has none.
 */
export function replaceTemplate(pattern: string, regex: boolean): string {
    if (!regex) return '';
    return keysOf(groupsIn(pattern))
        .map((key) => `${KEY_OPEN}${key}${KEY_CLOSE}\${${key}}`)
        .join('');
}

/**
 * The groups of one match out of the replacement ripgrep reported for it under `replaceTemplate`.
 * Null when the replacement is not what the template produces, which is what a group text holding
 * a marker character does to it.
 */
export function groupsFrom(replacement: string, pattern: string): MatchGroups | null {
    const keys = keysOf(groupsIn(pattern));
    const groups: MatchGroups = Object.create(null) as MatchGroups;
    let at = 0;
    for (const [index, key] of keys.entries()) {
        const head = `${KEY_OPEN}${key}${KEY_CLOSE}`;
        if (!replacement.startsWith(head, at)) return null;
        const from = at + head.length;
        const next = keys.at(index + 1);
        const to = next === undefined ? replacement.length : replacement.indexOf(KEY_OPEN, from);
        if (to < 0) return null;
        groups[key] = replacement.slice(from, to);
        at = to;
    }
    return at === replacement.length ? groups : null;
}

/** A replace text read as VS Code reads it, and whether it holds a parameter to substitute. */
type ParsedText = { text: string; parameters: boolean };

/** Whether `code` is a decimal digit from `low` to `high`. */
function digitFrom(char: string | undefined, low: string, high: string): boolean {
    return char !== undefined && char >= low && char <= high;
}

/**
 * The replace text with `\\`, `\n`, `\t` and `$0` converted, and whether it holds a parameter. A
 * `$` followed by a digit from 1 to 9 is a parameter, with a second digit read when there is one
 * and a third read and left alone: a text of `$` and three digits holds no parameter.
 */
function parsedText(text: string): ParsedText {
    let from = 0;
    let result = '';
    let parameters = false;
    for (let at = 0; at < text.length; at += 1) {
        const here = text[at];
        if (here === '\\') {
            at += 1;
            if (at >= text.length) break;
            const next = text[at];
            const written = next === '\\' ? '\\' : next === 'n' ? '\n' : next === 't' ? '\t' : null;
            if (written !== null) {
                result += text.slice(from, at - 1) + written;
                from = at + 1;
            }
        }
        if (here === '$') {
            at += 1;
            if (at >= text.length) break;
            const next = text[at];
            if (next === '0') {
                result += `${text.slice(from, at - 1)}$&`;
                from = at + 1;
                parameters = true;
            } else if (next === '`' || next === "'") {
                parameters = true;
            } else if (digitFrom(next, '1', '9')) {
                if (at === text.length - 1) {
                    parameters = true;
                    break;
                }
                at += 1;
                if (!digitFrom(text[at], '0', '9')) {
                    parameters = true;
                    at -= 1;
                    continue;
                }
                if (at === text.length - 1) {
                    parameters = true;
                    break;
                }
                at += 1;
                if (!digitFrom(text[at], '0', '9')) {
                    parameters = true;
                    at -= 1;
                }
            }
        }
    }
    return { text: from === 0 ? text : result + text.slice(from), parameters };
}

/**
 * Whether `char` is changed by upper-casing, which is what makes it a capital letter's opposite.
 */
function isUpper(char: string): boolean {
    return char.toLowerCase() !== char;
}

/** Whether a match and a replace text both hold `separator` and split into as many parts. */
function splitsAlike(matched: string, text: string, separator: string): boolean {
    return (
        matched.includes(separator) &&
        text.includes(separator) &&
        matched.split(separator).length === text.split(separator).length
    );
}

/**
 * The replace text in the case of the match it replaces. A match and a text that both hold `-`
 * (or both `_`, and not the other) are cased part by part; otherwise a match in capitals gives the
 * text in capitals, a match in lower case the text in lower case, and a match opening with a
 * capital or with a lower-case letter gives the text's first letter that case.
 */
function casePreserved(matched: string, text: string): string {
    if (matched === '') return text;
    const hyphens = splitsAlike(matched, text, '-');
    const underscores = splitsAlike(matched, text, '_');
    if (hyphens !== underscores) {
        const separator = hyphens ? '-' : '_';
        const matchParts = matched.split(separator);
        return text
            .split(separator)
            .map((part, index) => casePreserved(matchParts[index], part))
            .join(separator);
    }
    if (matched.toUpperCase() === matched) return text.toUpperCase();
    if (matched.toLowerCase() === matched) return text.toLowerCase();
    if (isUpper(matched[0]) && text.length > 0) return text[0].toUpperCase() + text.slice(1);
    if (matched[0].toUpperCase() !== matched[0] && text.length > 0) {
        return text[0].toLowerCase() + text.slice(1);
    }
    return text;
}

/**
 * The text of the group a run of case operations names, cased: `u` and `l` change the character at
 * their place in the run, `U` and `L` change everything from theirs, and what the run does not
 * reach is kept.
 */
function casedGroup(operations: string, group: string): string {
    let result = '';
    for (let at = 0; at < operations.length; at += 1) {
        const operation = operations[at];
        if (operation === 'U') return result + group.slice(at).toUpperCase();
        if (operation === 'L') return result + group.slice(at).toLowerCase();
        const character = group[at] ?? '';
        result += operation === 'u' ? character.toUpperCase() : character.toLowerCase();
    }
    return result + group.slice(operations.length);
}

/** The text of one group the match carries, and undefined for a key the match lacks. */
function groupAt(groups: MatchGroups, key: string): string | undefined {
    return Object.hasOwn(groups, key) ? groups[key] : undefined;
}

/**
 * The text with each `$N` that a run of `\u`, `\U`, `\l` or `\L` directly precedes replaced by the
 * group's cased text. A group with no text, or one the match lacks, leaves the run and its `$N` as
 * typed for the substitution after it.
 */
function caseOperated(text: string, groups: MatchGroups): string {
    if (!/\\[uUlL]/.test(text)) return text;
    const scan = /([\s\S]*?)((?:\\[uUlL])+?|)(\$[0-9]+)([\s\S]*?)/g;
    let result = '';
    let last = 0;
    for (let found = scan.exec(text); found !== null; found = scan.exec(text)) {
        const [whole, before, operations, parameter] = found;
        last = found.index + whole.length;
        const group = groupAt(groups, String(Number.parseInt(parameter.slice(1), 10)));
        if (operations === '' || group === undefined || group === '') {
            result += whole;
        } else {
            result += before + casedGroup(operations.replaceAll('\\', ''), group);
        }
    }
    return result + text.slice(last);
}

/** The number of the highest numbered group the match carries. */
function groupCount(groups: MatchGroups): number {
    let count = 0;
    for (const key of Object.keys(groups)) {
        if (/^[0-9]+$/.test(key)) count = Math.max(count, Number(key));
    }
    return count;
}

/**
 * The text with its parameters substituted as JavaScript's `String.prototype.replace` does for the
 * match: `$$`, `$&`, `$N` and `$NN`, `` $` `` and `$'` as the empty text, and `$<name>` when the
 * pattern has named groups. A number past the group count reads as one digit and the rest literal,
 * and a group number the pattern lacks stays as typed.
 */
function substituted(text: string, groups: MatchGroups): string {
    const count = groupCount(groups);
    const named = Object.keys(groups).some((key) => !/^[0-9]+$/.test(key));
    let result = '';
    let at = 0;
    while (at < text.length) {
        const here = text[at];
        const next = text.charAt(at + 1);
        if (here !== '$' || next === '') {
            result += here;
            at += 1;
        } else if (next === '$') {
            result += '$';
            at += 2;
        } else if (next === '&') {
            result += groupAt(groups, '0') ?? '';
            at += 2;
        } else if (next === '`' || next === "'") {
            at += 2;
        } else if (digitFrom(next, '0', '9')) {
            let width = digitFrom(text[at + 2], '0', '9') ? 2 : 1;
            let index = Number(text.slice(at + 1, at + 1 + width));
            if (width === 2 && index > count) {
                width = 1;
                index = Number(next);
            }
            result +=
                index >= 1 && index <= count
                    ? (groupAt(groups, String(index)) ?? '')
                    : text.slice(at, at + 1 + width);
            at += 1 + width;
        } else if (next === '<' && named) {
            const close = text.indexOf('>', at + 2);
            if (close < 0) {
                result += '$<';
                at += 2;
            } else {
                result += groupAt(groups, text.slice(at + 2, close)) ?? '';
                at = close + 1;
            }
        } else {
            result += '$';
            at += 1;
        }
    }
    return result;
}

/**
 * The text one match is replaced with. `groups` carries at least group 0, the match itself; the
 * numbered and named groups are read only in regular-expression mode, and only for a text that
 * holds a parameter.
 */
export function replacementOf(text: string, groups: MatchGroups, options: ReplaceOptions): string {
    const read = options.regex ? parsedText(text) : { text, parameters: false };
    const cased = options.preserveCase
        ? casePreserved(groupAt(groups, '0') ?? '', read.text)
        : read.text;
    const written = read.parameters ? substituted(caseOperated(cased, groups), groups) : cased;
    return options.crlf ? written.replace(/\r?\n/g, '\r\n') : written;
}

// Layer 1, data tests. The replace text read as VS Code's Search view reads it: the group template
// ripgrep reports every group through, the groups split back out of ripgrep's replacement, and the
// text one match is replaced with. The page and the server both call these, so a preview and a
// write agree.
//
// Every expected text below is what VS Code's own `ReplacePattern.getReplaceString` returns for the
// same pattern, match and replace text.

import { describe, expect, it } from 'vitest';
import {
    groupsFrom,
    hasMarker,
    replaceTemplate,
    replacementOf,
    type MatchGroups
} from '../../../src/lib/data/helpers/search/replace.ts';

/** A group that did not take part in the match is undefined at run time, whatever the type says. */
function orEmpty(value: string | undefined): string {
    return value ?? '';
}

/**
 * The groups of a match of `pattern` in `text`, the way ripgrep reports them through the template.
 */
function groupsOf(pattern: string, text: string): MatchGroups {
    const found = new RegExp(pattern, 'u').exec(text);
    if (found === null) throw new Error(`${pattern} does not match ${text}`);
    const groups: MatchGroups = Object.create(null) as MatchGroups;
    for (const [at, value] of found.entries()) groups[String(at)] = orEmpty(value);
    for (const [name, value] of Object.entries(found.groups ?? {})) groups[name] = orEmpty(value);
    return groups;
}

/** The replacement of the first match of `pattern` in `text` by `replace`, in regex mode. */
function regexReplaced(
    pattern: string,
    text: string,
    replace: string,
    preserveCase = false
): string {
    return replacementOf(replace, groupsOf(pattern, text), {
        regex: true,
        preserveCase,
        crlf: false
    });
}

/** The replacement of a literal match by `replace`. */
function literalReplaced(matched: string, replace: string, preserveCase = false): string {
    return replacementOf(replace, { '0': matched }, { regex: false, preserveCase, crlf: false });
}

describe('the group template', () => {
    it('writes every group of the pattern, number 0 and each name, between private-use markers', () => {
        expect(replaceTemplate('(a)(?:b)(?P<n>c)[(]', true)).toBe(
            '\ue0020\ue003${0}\ue0021\ue003${1}\ue0022\ue003${2}\ue002n\ue003${n}'
        );
    });

    it('counts a group of each form ripgrep names: plain, ?P<name> and ?<name>', () => {
        expect(replaceTemplate('(a)(?P<x>b)(?<y>c)', true)).toBe(
            '\ue0020\ue003${0}\ue0021\ue003${1}\ue0022\ue003${2}\ue0023\ue003${3}' +
                '\ue002x\ue003${x}\ue002y\ue003${y}'
        );
    });

    it.each([
        ['an escaped bracket and a class', '\\(a\\)[(]', '\ue0020\ue003${0}'],
        ['a nested class', '[[:alpha:](]x', '\ue0020\ue003${0}'],
        ['a class that starts with a bracket', '[^]()]', '\ue0020\ue003${0}'],
        ['a non-capturing group and a flag group', '(?:a)(?i)b', '\ue0020\ue003${0}'],
        ['a group after an escaped backslash', '\\\\(a)', '\ue0020\ue003${0}\ue0021\ue003${1}']
    ])('counts %s as the groups it holds', (_row, pattern, template) => {
        expect(replaceTemplate(pattern, true)).toBe(template);
    });

    it('is empty for a pattern searched as text', () => {
        expect(replaceTemplate('(a)', false)).toBe('');
    });
});

describe('the groups split back out of ripgrep replacement', () => {
    const pattern = '(a)(?P<n>c)';

    it('reads each group by number and by name, group 0 being the match', () => {
        const replacement = '\ue0020\ue003ac\ue0021\ue003a\ue0022\ue003c\ue002n\ue003c';
        expect(groupsFrom(replacement, pattern)).toEqual({ '0': 'ac', '1': 'a', '2': 'c', n: 'c' });
    });

    it('reads an empty group as the empty text', () => {
        const replacement = '\ue0020\ue003a\ue0021\ue003a\ue0022\ue003\ue002n\ue003';
        expect(groupsFrom(replacement, pattern)).toEqual({ '0': 'a', '1': 'a', '2': '', n: '' });
    });

    it.each([
        ['plain text', 'plain'],
        ['a replacement missing groups', '\ue0020\ue003a']
    ])('refuses %s, which is not what the template makes', (_row, replacement) => {
        expect(groupsFrom(replacement, pattern)).toBeNull();
    });

    it('holds no key a group of the pattern did not make', () => {
        const groups = groupsFrom('\ue0020\ue003x', 'x');
        expect(groups !== null && Object.hasOwn(groups, 'constructor')).toBe(false);
    });
});

describe('the markers', () => {
    it.each([
        ['U+E000', 'a\ue000b', true],
        ['U+E001', 'a\ue001b', true],
        ['U+E002', 'a\ue002b', true],
        ['U+E003', 'a\ue003b', true],
        ['the next private-use character', '\ue004 plain', false]
    ])('finds %s in a text', (_row, text, found) => {
        expect(hasMarker(text)).toBe(found);
    });
});

describe('a regular expression replace', () => {
    it.each([
        ['[$1]', '[o]'],
        ['$1a', 'oa'],
        ['$0!', 'foo!'],
        ['$&$1', 'fooo'],
        ['$&', '$&'],
        ['$$', '$$'],
        ['$$$1', '$o'],
        ['$2', '$2'],
        ['$10', 'o0'],
        ["$`|$'", '|']
    ])('writes %j for f(o)o over foo as %j', (replace, written) => {
        expect(regexReplaced('f(o)o', 'foo', replace)).toBe(written);
    });

    it.each([
        ['a named group the pattern has', '(?<n>a)(b)', 'ab', '[$<n>]-$2', '[a]-b'],
        ['a named group the pattern lacks', '(a)(b)', 'ab', '[$<n>]-$2', '[$<n>]-b'],
        ['a name that is not a group', '(?<n>a)(b)', 'ab', '$<missing>|$1', '|a'],
        ['$12 over two groups', '(a)(b)', 'ab', '$12', 'a2'],
        ['$23 over two groups', '(a)(b)', 'ab', '$23', 'b3'],
        ['$3 over one group', '(a)', 'a', '$3', '$3'],
        ['$0 as the match', '(\\w+)', 'abc', '<$0>', '<abc>'],
        ['$& beside a group reference', '(\\w+)', 'abc', '$&$1', 'abcabc'],
        ['a backslash n as a newline', '(\\w+)', 'ab', 'a\\nb', 'a\nb'],
        ['two backslashes as one', '(\\w+)', 'ab', 'a\\\\nb', 'a\\nb'],
        ['a backslash t as a tab', '(\\w+)', 'ab', 'a\\tb', 'a\tb'],
        ['a backslash x as typed', '(\\w+)', 'ab', 'a\\xb', 'a\\xb'],
        ['a trailing backslash as typed', '(\\w+)', 'ab', 'tail\\', 'tail\\'],
        ['an empty replace text', '(\\w+)', 'ab', '', ''],
        ['a group the match did not take', '(a)(b)?(c)', 'ac', '[$2]', '[]']
    ])('reads %s', (_row, pattern, text, replace, written) => {
        expect(regexReplaced(pattern, text, replace)).toBe(written);
    });
});

describe('the case operations', () => {
    it.each([
        ['\\U$1', 'ab', 'AB'],
        ['\\u$1', 'ab', 'Ab'],
        ['\\u\\L$1', 'aBC', 'Abc'],
        ['\\Ux', 'ab', '\\Ux'],
        ['\\U$&', 'ab', '\\U$&'],
        ['\\L$1', 'AB', 'ab'],
        ['\\l$1', 'AB', 'aB'],
        ['x\\u$1y', 'ab', 'xAby'],
        ['\\U$1 and \\L$1', 'aB', 'AB and ab']
    ])('writes %j over the match %j as %j', (replace, matched, written) => {
        expect(regexReplaced('(\\w+)', matched, replace)).toBe(written);
    });

    it.each([
        ['a group with no text', '(a)(b)?', 'a', '\\U$2', '\\U'],
        ['two operations over one group', '(\\w+)', 'abc', '\\u\\u$1', 'ABc']
    ])('reads %s', (_row, pattern, text, replace, written) => {
        expect(regexReplaced(pattern, text, replace)).toBe(written);
    });
});

describe('Preserve Case', () => {
    it.each([
        ['FOO', 'bar', 'BAR'],
        ['foo', 'bar', 'bar'],
        ['Foo', 'bar', 'Bar'],
        ['FooBar', 'baz', 'Baz'],
        ['fOO', 'Baz', 'baz'],
        ['foo-Bar', 'baz-qux', 'baz-Qux'],
        ['a-b_c', 'X-Y_Z', 'x-y_z'],
        ['foo_Bar', 'baz_qux', 'baz_Qux'],
        ['', 'bar', 'bar']
    ])('writes %j replaced by %j as %j', (matched, replace, written) => {
        expect(literalReplaced(matched, replace, true)).toBe(written);
    });

    it('is applied to the text before the groups are substituted', () => {
        expect(regexReplaced('(F)oo', 'Foo', '$1bar', true)).toBe('Fbar');
    });
});

describe('a replace of text searched as text', () => {
    it.each([
        ['a backslash and a $1', '$1\\n', '$1\\n'],
        ['a $& and a $$', '$&$$', '$&$$'],
        ['an empty replace text', '', '']
    ])('writes %s as typed', (_row, replace, written) => {
        expect(literalReplaced('foo', replace)).toBe(written);
    });
});

describe('a file with CRLF line ends', () => {
    it('writes the line feed a text holds as CRLF and leaves an existing CRLF as one', () => {
        const options = { regex: true, preserveCase: false, crlf: true };
        expect(replacementOf('a\\nb', { '0': 'foo' }, options)).toBe('a\r\nb');
        expect(replacementOf('a\\r\\nb', { '0': 'foo' }, options)).toBe('a\\r\r\nb');
    });
});

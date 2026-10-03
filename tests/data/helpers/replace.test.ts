// The replace text read as VS Code's Search view reads it: the group template ripgrep reports every
// group through, the groups split back out of ripgrep's replacement, and the text one match is
// replaced with. The page and the server both call these, so a preview and a write agree.
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

    it('does not count an escaped bracket, a class, a nested class or a non-capturing group', () => {
        expect(replaceTemplate('\\(a\\)[(]', true)).toBe('\ue0020\ue003${0}');
        expect(replaceTemplate('[[:alpha:](]x', true)).toBe('\ue0020\ue003${0}');
        expect(replaceTemplate('[^]()]', true)).toBe('\ue0020\ue003${0}');
        expect(replaceTemplate('(?:a)(?i)b', true)).toBe('\ue0020\ue003${0}');
        expect(replaceTemplate('\\\\(a)', true)).toBe('\ue0020\ue003${0}\ue0021\ue003${1}');
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

    it('refuses a replacement that is not what the template makes', () => {
        expect(groupsFrom('plain', pattern)).toBeNull();
        expect(groupsFrom('\ue0020\ue003a', pattern)).toBeNull();
    });

    it('holds no key a group of the pattern did not make', () => {
        const groups = groupsFrom('\ue0020\ue003x', 'x');
        expect(groups !== null && Object.hasOwn(groups, 'constructor')).toBe(false);
    });
});

describe('the markers', () => {
    it('are the four private-use characters from U+E000', () => {
        for (const marker of ['\ue000', '\ue001', '\ue002', '\ue003']) {
            expect(hasMarker(`a${marker}b`)).toBe(true);
        }
        expect(hasMarker('\ue004 plain')).toBe(false);
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

    it('reads a named group as $<name> only when the pattern has one', () => {
        expect(regexReplaced('(?<n>a)(b)', 'ab', '[$<n>]-$2')).toBe('[a]-b');
        expect(regexReplaced('(a)(b)', 'ab', '[$<n>]-$2')).toBe('[$<n>]-b');
        expect(regexReplaced('(?<n>a)(b)', 'ab', '$<missing>|$1')).toBe('|a');
    });

    it('reads a number past the group count as one digit and the rest as typed', () => {
        expect(regexReplaced('(a)(b)', 'ab', '$12')).toBe('a2');
        expect(regexReplaced('(a)(b)', 'ab', '$23')).toBe('b3');
        expect(regexReplaced('(a)', 'a', '$3')).toBe('$3');
    });

    it('reads $0 as the match and $& with a group reference beside it', () => {
        expect(regexReplaced('(\\w+)', 'abc', '<$0>')).toBe('<abc>');
        expect(regexReplaced('(\\w+)', 'abc', '$&$1')).toBe('abcabc');
    });

    it('turns \\n, \\t and \\\\ into a newline, a tab and one backslash', () => {
        expect(regexReplaced('(\\w+)', 'ab', 'a\\nb')).toBe('a\nb');
        expect(regexReplaced('(\\w+)', 'ab', 'a\\\\nb')).toBe('a\\nb');
        expect(regexReplaced('(\\w+)', 'ab', 'a\\tb')).toBe('a\tb');
        expect(regexReplaced('(\\w+)', 'ab', 'a\\xb')).toBe('a\\xb');
        expect(regexReplaced('(\\w+)', 'ab', 'tail\\')).toBe('tail\\');
    });

    it('writes an empty replace text as the empty text', () => {
        expect(regexReplaced('(\\w+)', 'ab', '')).toBe('');
    });

    it('reads a group the match did not take as the empty text', () => {
        expect(regexReplaced('(a)(b)?(c)', 'ac', '[$2]')).toBe('[]');
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

    it('leaves the run and its $N as typed for a group with no text', () => {
        expect(regexReplaced('(a)(b)?', 'a', '\\U$2')).toBe('\\U');
    });

    it('keeps the characters past the operations of a group', () => {
        expect(regexReplaced('(\\w+)', 'abc', '\\u\\u$1')).toBe('ABc');
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
    it('writes the replace text as typed, a backslash and a $1 included', () => {
        expect(literalReplaced('foo', '$1\\n')).toBe('$1\\n');
        expect(literalReplaced('foo', '$&$$')).toBe('$&$$');
    });

    it('deletes the match for an empty replace text', () => {
        expect(literalReplaced('foo', '')).toBe('');
    });
});

describe('a file with CRLF line ends', () => {
    it('writes the line feed a text holds as CRLF and leaves an existing CRLF as one', () => {
        const options = { regex: true, preserveCase: false, crlf: true };
        expect(replacementOf('a\\nb', { '0': 'foo' }, options)).toBe('a\r\nb');
        expect(replacementOf('a\\r\\nb', { '0': 'foo' }, options)).toBe('a\\r\r\nb');
    });
});

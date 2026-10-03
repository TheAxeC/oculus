// Layer 4, test. The derived colour tokens of themes/derive.ts: the WCAG ratio and the black or
// white a filled colour takes, and every token derived for every theme the picker offers, held at
// captured values.
//
// The derived tokens are held as one SHA-256 per theme over the sorted `name:value` lines rather
// than as the 3125 values themselves (13 themes of 181 and 4 of 193, the four with a panel lighter
// than the ink also deriving the 12 Seti colours): a changed token changes its theme's digest, and
// the case names the theme. The digests and counts below are the tokens each theme
// derives with the WCAG 2 relative luminance and contrast ratio, the measure culori's
// wcagLuminance and wcagContrast compute.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { converter } from 'culori';
import { SETI_RATIO, contrastOn, ratio } from '../../src/lib/themes/derive.ts';
import { NAMES, themeTokens } from '../checks/look/themes.ts';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

/** Every theme's derived token count and the digest of its sorted `name:value` lines. */
const CAPTURED: [string, number, string][] = [
    ['light', 193, 'f417cbe17ed20306ed575e8be4975c43de2a2662e89275b3a2788335994a9caa'],
    ['dark', 181, '2830217e0e9df05b24d7168376b8fb85cc5f93a8c92609aa3ba71e6539a4049c'],
    ['vscode-dark-modern', 181, '58c3105c1329e63448915c6d73b695a2ad989a024205c55879f15954bc73f4d6'],
    [
        'vscode-light-modern',
        193,
        'b7540673f5b06a28ef2d8e2f47a12a811985005b57d75571c5088b07e2545faf'
    ],
    ['mocha', 181, '5d5de89737ef211859ec68b7cab354b48f9e2d817a2c83121d7585a4f4ce061f'],
    ['gruvbox', 181, 'b7a6374545c5efda341f971b7a4c1e36a5e9146f292dc355d9731d547d886e9b'],
    ['nord', 181, '88774cd019fa03b426ddd7309f5ef657f94595d9339e48d86a6a9e11a20d3f40'],
    ['synthwave', 181, '385e9d247720a214737871e36ae18e7f77d4809a4b7c1babe62b1d12bf1c17e4'],
    ['tokyoneon', 181, '91ba35f64dcc9422216ac1c8a0dac9b2dfedfc090517bfdcd570c008187c2f91'],
    ['tokyonight', 181, 'f0aa919feb5dfe44fa2146eeab0330f51bef14a8fa2510331e88527a931e32a7'],
    ['rosepine', 181, '78e1489c4d0bfb771d8a43cb6e3b3de2d4899e5196f9421ac0d29fc9f332699a'],
    ['everforest', 181, '666b75af36b2389ae5829ade67e1f9f0babc615bad2ea0a8c18c60adc3243192'],
    ['dracula', 181, '2e5972b955de00fac2918cc2770e66e6877b84f0e90f54be9b4412e20a736fc1'],
    ['kanagawa', 181, '2b598af4c83560d70be5a307ff357339679480a8ab4d75b3e27dc7430a1d694f'],
    ['solarized', 181, '21afef07c12d0c71876c76f0e6b07a4becd4485da263908d23a46f2252557a7b'],
    ['latte', 193, '4778991fbaba32926962fa43dbc1243baf0b4d726fcbd62805691e6d6a57a55e'],
    ['gruvboxlight', 193, '6482f49803ea0267a79b4e84f24417415ce8faa9a39df734fa6bdd226b805937']
];

/** One theme's derived tokens as the digest CAPTURED holds, with their count. */
function digest(name: string): [string, number, string] {
    const { derived } = themeTokens(name);
    const keys = Object.keys(derived).sort();
    const lines = keys.map((key) => `${key}:${derived[key]}`).join('\n');
    return [name, keys.length, createHash('sha256').update(lines).digest('hex')];
}

describe('the WCAG measure', () => {
    it('gives 21 for black on white and 1 for a colour on itself', () => {
        expect(ratio('#000000', '#ffffff')).toBe(21);
        expect(ratio('#777777', '#777777')).toBe(1);
    });

    it('puts the light ink on a dark colour, the dark ink on a light one and on a name', () => {
        expect(contrastOn('#0a0a0a')).toBe('#ffffff');
        expect(contrastOn('#f5f5f5')).toBe('#000000');
        expect(contrastOn('red')).toBe('#ffffff');
    });
});

describe('the derived tokens', () => {
    it('are the captured tokens of every theme, one digest a theme', () => {
        expect(NAMES.map(digest)).toEqual(CAPTURED);
    });

    // Revert: drop the `--seti-` loop of deriveTokens; no light theme derives a Seti colour then.
    it('darken each Seti colour to 3:1 on the panel of a theme whose panel is lighter than its ink', () => {
        const hsl = converter('hsl');
        const light = NAMES.filter((name) => {
            const { theme } = themeTokens(name);
            return ratio(theme['--panel'], '#ffffff') < ratio(theme['--ink'], '#ffffff');
        });
        expect(light.length).toBeGreaterThan(0);
        for (const name of light) {
            const { theme, derived } = themeTokens(name);
            const seti = Object.keys(theme).filter((key) => key.startsWith('--seti-'));
            expect(seti).toHaveLength(12);
            for (const key of seti) {
                expect(
                    ratio(derived[key], theme['--panel']),
                    `${name} ${key}`
                ).toBeGreaterThanOrEqual(SETI_RATIO);
                const was = hsl(theme[key]);
                const now = hsl(derived[key]);
                // The same hue: a grey has none, and a hex byte moves a hue by a few degrees.
                if (was?.h !== undefined && now?.h !== undefined && was.s > 0.15) {
                    const gap = Math.abs(was.h - now.h);
                    expect(Math.min(gap, 360 - gap), `${name} ${key}`).toBeLessThan(12);
                }
            }
        }
    });

    it('keep seti-ui values on a theme whose panel is darker than its ink', () => {
        const dark = NAMES.filter(
            (name) =>
                !Object.keys(themeTokens(name).derived).some((key) => key.startsWith('--seti-'))
        );
        expect(dark.length).toBe(NAMES.length - 4);
        for (const name of dark) {
            const { theme, derived } = themeTokens(name);
            expect(derived['--seti-ignore'], name).toBeUndefined();
            expect(theme['--seti-ignore'], name).toBe('#41535b');
            expect(theme['--seti-grey'], name).toBe('#4d5a5e');
        }
    });

    // An audit, a read of the source text: red while a hand WCAG or CIEDE2000 function is left in
    // derive.ts or the lane distance test, or while either or the editor theme does not import
    // culori.
    it('measure through culori and keep no hand WCAG or CIEDE2000 formula', () => {
        const files = [
            join(SRC, 'lib', 'themes', 'derive.ts'),
            join(SRC, '..', 'tests', 'checks', 'look', 'lane-distance.test.ts'),
            join(SRC, 'lib', 'ui', 'controls', 'editor', 'kit', 'theme.ts')
        ];
        const hand = /function (?:luminance|ratio|lab|ciede2000|hueAngle)\b/;
        for (const file of files) {
            const text = readFileSync(file, 'utf8');
            expect(hand.test(text), file).toBe(false);
            expect(text.match(/from 'culori'/g) ?? [], file).toHaveLength(1);
        }
    });
});

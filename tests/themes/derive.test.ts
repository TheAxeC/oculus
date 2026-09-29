// Layer 4, test. The derived colour tokens of themes/derive.ts: the WCAG ratio and the black or
// white a filled colour takes, and every token derived for every theme the picker offers, held at
// captured values.
//
// The derived tokens are held as one SHA-256 per theme over the sorted `name:value` lines rather
// than as the 3009 values themselves (17 themes of 177): a changed token changes its theme's
// digest, and the case names the theme. The digests and counts below are the tokens each theme
// derives with the WCAG 2 relative luminance and contrast ratio, the measure culori's
// wcagLuminance and wcagContrast compute.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastOn, ratio } from '../../src/lib/themes/derive.ts';
import { NAMES, themeTokens } from '../checks/look/themes.ts';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

/** Every theme's derived token count and the digest of its sorted `name:value` lines. */
const CAPTURED: [string, number, string][] = [
    ['light', 177, '64363cd7faaad608235ef3e42645d0526bd2d71efb6876d75b4c792d1c632d25'],
    ['dark', 177, 'b10c89d6decfa21babeebf788078f58998c8544c1d9f535f7b8b7975f7f6e179'],
    ['vscode-dark-modern', 177, '19ea02761845da33e227669fd4eccc5093579c54f90c082ff4322a4563c5bdf4'],
    [
        'vscode-light-modern',
        177,
        'cf0392a6aeee8d1592e3b47f81033c109fecad956c3c492fb3a62e701e1be211'
    ],
    ['mocha', 177, 'ac0b54c818f1c5d8d34da1050ede8786abb47c73ef6dea5fbec3300793278b66'],
    ['gruvbox', 177, '436e0d6482ac40c9c3a1c835574de64d0dda19164146c807ad77914caa880c05'],
    ['nord', 177, '5b06aace21a256b57ea63bd0a3b2fe193de49cbdead8cd04d12e33fef765dab9'],
    ['synthwave', 177, '4735a2bd555938550873531288469534179508ab01b615f56368723661f1407d'],
    ['tokyoneon', 177, 'da34682d76ed7054034fdb265490a6cea4ddb72e2fe91dc6f35b7f923ee2b202'],
    ['tokyonight', 177, '10a607288289f0dd575d930939ee1a828da9c900ebe06d8ca4fcdd7755a87dce'],
    ['rosepine', 177, '114a274a259e3e2778b9b833478dfec0008f7eda6acbe6a9338b52727cb187d4'],
    ['everforest', 177, 'd74fe0c281bfeb78932757334b737e1d898860841628cd82167bf68b77c00736'],
    ['dracula', 177, '17802e65c25b1c4e06586bdeab738d4ca2cb09958e02c81b72027972d0f4c668'],
    ['kanagawa', 177, '1df48ef542db7f50b52b4165c433c2990980ffec7a0a5dbad08a92d961bdf82c'],
    ['solarized', 177, '39a41b9fdf214d35050c54f0e08988e4432a1a62f142fac6dfd62c648499257d'],
    ['latte', 177, 'f59f21751199bbfaf3ed38c950401ffa07158807db1023b65b8985f8cd204426'],
    ['gruvboxlight', 177, '9c36d52c0263fdb70b33cea8653c8f9d131eb17252f0a4f81569bf452ea56f7f']
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

    // An audit, a read of the source text: red while a hand WCAG or CIEDE2000 function is left in
    // derive.ts or the lane distance test, or while either or the editor theme does not import
    // culori.
    it('measure through culori and keep no hand WCAG or CIEDE2000 formula', () => {
        const files = [
            join(SRC, 'lib', 'themes', 'derive.ts'),
            join(SRC, '..', 'tests', 'checks', 'look', 'lane-distance.test.ts'),
            join(SRC, 'lib', 'ui', 'controls', 'editor', 'theme.ts')
        ];
        const hand = /function (?:luminance|ratio|lab|ciede2000|hueAngle)\b/;
        for (const file of files) {
            const text = readFileSync(file, 'utf8');
            expect(hand.test(text), file).toBe(false);
            expect(text.match(/from 'culori'/g) ?? [], file).toHaveLength(1);
        }
    });
});

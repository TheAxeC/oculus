// The derived colour tokens. tokens.css and themes.css hold the colours an author picked; the ones a
// component actually paints text with are computed from them, because a single foreground cannot be
// readable on a dark green and a light gold at once. Two families:
//
//   --on-<token>    black or white, whichever scores higher ON that colour: text on a filled chip.
//   --<token>-txt   the token's own hue, nudged in lightness until it clears 4.5:1 on every surface
//                   it can land on (its own tint first, then the chip, the panel, the page).
//
// Beside them the two colours a scrollbar is drawn in, `--scroll-thumb` and `--scroll-track`, taken
// from the theme's own chrome so a dark theme never draws the browser's light bar: the track is the
// panel a scrolling view sits on, and the thumb starts halfway between the muted text and the
// hairline and is nudged in lightness until it clears 3:1 on the track, so it reads as a control
// without competing with the text beside it. And `--accent-bg`, the
// surface a pressed toggle fills with: a fifth of the accent in the page's colour, so the pressed
// state reads as a filled box in the accent's hue under every theme without the solid accent block.
// And for every hue `--c-<hue>-lane`, half the hue in the panel, the surface the header of a
// Focus lane fills with, beside `--c-<hue>-lane-txt`, the hue's text colour made readable on that
// surface, which the header's name and count are drawn in, so every other hue text is left as it is.
//
// The numbers come from the cockpit's build-time tools/cockpit/src/cockpit/contrast.py: the same WCAG
// relative luminance, the same 0.02 lightness step, the same 50-step bound, the same order of grounds.
// Nothing here touches the document; ui/theme.ts sets the theme class and applies these tokens.
// Pure functions, no imports, so the contrast test can run them over every theme in a plain node run.

/** True black. A near-black scores lower and loses ties it should win. */
const DARK_INK = '#000000';
const LIGHT_INK = '#ffffff';

/** A colour these functions can work with: three or six hex digits. */
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** The hex form a stylesheet declaration may carry, which is what a derived token is computed from. */
const HEX_VALUE = /^#[0-9a-fA-F]{3,6}$/;

/** The tokens a derived token is computed from: the palette hues and the chrome colours. */
const COLOUR_TOKEN = /^--(?:c-[a-z0-9-]+|accent|muted|ink|line|chip|card|panel|bg)$/;

/** The contrast a scrollbar's thumb keeps against its track: what a control's edge needs to be seen. */
export const SCROLL_THUMB_RATIO = 3;

/** How much of the accent the pressed-toggle surface carries, the rest being the page. */
const ACCENT_SHARE = 0.2;

/**
 * How much of a hue a lane header's surface carries, the rest being the panel. At half, with every
 * Focus cluster open and every band column drawn, the headers drawn next to each other, stacked in
 * a column and beside the full-width Ideas lane stay a CIEDE2000 of 10 apart under every theme in
 * the colours config/vocab.yml gives them, which tests/lane-distance.test.ts holds. A smaller share
 * folds those neighbours into one colour in a theme that gives two hues near values.
 */
const LANE_SHARE = 0.5;

const ONE_THIRD = 1 / 3;
const ONE_SIXTH = 1 / 6;
const TWO_THIRD = 2 / 3;

function channels(hex: string): [number, number, number] {
    let body = hex.slice(1);
    if (body.length === 3)
        body = body
            .split('')
            .map((c) => c + c)
            .join('');
    return [
        parseInt(body.slice(0, 2), 16),
        parseInt(body.slice(2, 4), 16),
        parseInt(body.slice(4, 6), 16)
    ];
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
    const [r, g, b] = channels(hex).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours: 1 is identical, 21 is black on white. */
export function ratio(a: string, b: string): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * The readable foreground for text placed ON this colour: whichever of black and white scores the
 * higher ratio. A brightness cutoff mis-picks every mid-dark colour, so both are measured.
 */
export function contrastOn(hex: string): string {
    if (!HEX.test(hex)) return LIGHT_INK;
    return ratio(hex, DARK_INK) >= ratio(hex, LIGHT_INK) ? DARK_INK : LIGHT_INK;
}

/** Python's colorsys.rgb_to_hls, on channels already scaled to 0..1. */
function rgbToHls(r: number, g: number, b: number): [number, number, number] {
    const high = Math.max(r, g, b);
    const low = Math.min(r, g, b);
    const sum = high + low;
    const span = high - low;
    const l = sum / 2;
    if (low === high) return [0, l, 0];
    const s = l <= 0.5 ? span / sum : span / (2 - high - low);
    const rc = (high - r) / span;
    const gc = (high - g) / span;
    const bc = (high - b) / span;
    let h: number;
    if (r === high) h = bc - gc;
    else if (g === high) h = 2 + rc - bc;
    else h = 4 + gc - rc;
    h = (((h / 6) % 1) + 1) % 1;
    return [h, l, s];
}

/** Python's colorsys._v. */
function channel(m1: number, m2: number, hue: number): number {
    const h = ((hue % 1) + 1) % 1;
    if (h < ONE_SIXTH) return m1 + (m2 - m1) * h * 6;
    if (h < 0.5) return m2;
    if (h < TWO_THIRD) return m1 + (m2 - m1) * (TWO_THIRD - h) * 6;
    return m1;
}

/** Python's colorsys.hls_to_rgb. */
function hlsToRgb(h: number, l: number, s: number): [number, number, number] {
    if (s === 0) return [l, l, l];
    const m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s;
    const m1 = 2 * l - m2;
    return [channel(m1, m2, h + ONE_THIRD), channel(m1, m2, h), channel(m1, m2, h - ONE_THIRD)];
}

/** Two colours mixed channel by channel, `share` of the first: 0.5 is halfway between them. */
function mix(first: string, second: string, share: number): string {
    const a = channels(first);
    const b = channels(second);
    const at = (index: number): number => (a[index] * share + b[index] * (1 - share)) / 255;
    return hex(at(0), at(1), at(2));
}

function hex(r: number, g: number, b: number): string {
    const byte = (v: number): string =>
        Math.trunc(v * 255)
            .toString(16)
            .padStart(2, '0');
    return `#${byte(r)}${byte(g)}${byte(b)}`;
}

/**
 * `fg` nudged in lightness, hue and saturation kept, until it clears `minimum` against `bg`. The
 * original comes back when it already passes, otherwise the best value reached. Lightness moves away
 * from the background first, in 0.02 steps, up to 50 of them per direction. Keeping the hue is the
 * point: swapping in black or white would throw the palette away.
 */
export function readable(fg: string, bg: string, minimum = 4.5): string {
    if (!(HEX.test(fg) && HEX.test(bg))) return fg;
    if (ratio(fg, bg) >= minimum) return fg;

    const [r, g, b] = channels(fg).map((v) => v / 255);
    const [hue, lightness, saturation] = rgbToHls(r, g, b);
    let best = fg;
    let bestRatio = ratio(fg, bg);
    const darkBackground = luminance(bg) < 0.4;

    for (const direction of darkBackground ? [1, -1] : [-1, 1]) {
        let step = lightness;
        for (let i = 0; i < 50; i += 1) {
            step = Math.min(1, Math.max(0, step + direction * 0.02));
            const [rr, gg, bb] = hlsToRgb(hue, step, saturation);
            const candidate = hex(rr, gg, bb);
            const candidateRatio = ratio(candidate, bg);
            if (candidateRatio > bestRatio) {
                best = candidate;
                bestRatio = candidateRatio;
            }
            if (candidateRatio >= minimum) return candidate;
        }
    }
    return best;
}

/**
 * The derived tokens for one resolved theme: the theme's own block merged over `:root`.
 *
 * Returns `--on-<token>` for every colour token the theme defines, and the `-txt` family for the
 * three chrome colours that carry text (`--muted`, `--accent`, `--ink`) and for every palette hue.
 * A hue's `-txt` is made readable on its own `--c-<hue>-bg` first when it has one, then on `--chip`,
 * `--card`, `--panel` and `--bg` in turn, so it clears on every surface it can land on rather than only on the
 * tinted pill it was measured against. Hues that are themselves a tint (`-bg`), a derived value
 * (`-txt`, `-on`), a lane surface (`-lane`) or the on-chip ink (`--c-on`) are skipped, since nothing places text on them.
 * The two scrollbar colours, `--scroll-thumb` and `--scroll-track`, come with them, and so does
 * `--accent-bg`, the accent mixed into the page, with its `--on-accent-bg` and `--accent-bg-txt`,
 * the accent made readable on that surface before the others. Every hue also gets its lane header
 * surface, `--c-<hue>-lane`, the hue mixed into the panel, and `--c-<hue>-lane-txt`, the hue's own
 * `-txt` nudged until it clears on that surface; a theme with no panel and no page gets neither.
 *
 * The input is the whole token map; anything that is not a colour token with a hex value is ignored,
 * so the caller can hand over the theme exactly as parse.ts read it.
 */
export function deriveTokens(theme: Record<string, string>): Record<string, string> {
    const effective: Record<string, string> = {};
    for (const [key, value] of Object.entries(theme)) {
        if (COLOUR_TOKEN.test(key) && HEX_VALUE.test(value)) effective[key] = value;
    }
    const keys = Object.keys(effective).sort();

    const derived: Record<string, string> = {};
    for (const key of keys) derived[`--on-${key.slice(2)}`] = contrastOn(effective[key]);

    const chip = effective['--chip'] || effective['--panel'] || effective['--bg'];
    const card = effective['--card'] || effective['--panel'] || effective['--bg'];
    const panel = effective['--panel'] || effective['--bg'];
    const page = effective['--bg'];
    const grounds = [chip, card, panel, page].filter((ground) => Boolean(ground));

    const everywhere = (colour: string, own?: string): string => {
        let out = colour;
        for (const ground of own ? [own, ...grounds] : grounds) out = readable(out, ground);
        return out;
    };

    if (effective['--muted'] && chip) derived['--muted-txt'] = everywhere(effective['--muted']);
    if (effective['--accent'] && chip) derived['--accent-txt'] = everywhere(effective['--accent']);

    // The surface a pressed toggle in the rail fills with: the accent mixed into the page the rail
    // is drawn on. Its glyph and name take a text colour of their own, readable on that surface
    // first, as a hue's is on its own tint, so the accent text everywhere else is left as it is.
    if (effective['--accent'] && page && chip) {
        const tint = mix(effective['--accent'], page, ACCENT_SHARE);
        derived['--accent-bg'] = tint;
        derived['--on-accent-bg'] = contrastOn(tint);
        derived['--accent-bg-txt'] = everywhere(effective['--accent'], tint);
    }
    if (effective['--ink'] && chip) derived['--ink-txt'] = everywhere(effective['--ink']);

    if (effective['--muted'] && effective['--line'] && panel) {
        const thumb = mix(effective['--muted'], effective['--line'], 0.5);
        derived['--scroll-thumb'] = readable(thumb, panel, SCROLL_THUMB_RATIO);
        derived['--scroll-track'] = panel;
    }

    for (const key of keys) {
        if (!key.startsWith('--c-')) continue;
        const hue = key.slice(4);
        if (hue === 'on' || hue.startsWith('on')) continue;
        if (hue.endsWith('-bg') || hue.endsWith('-txt') || hue.endsWith('-on')) continue;
        if (hue.endsWith('-lane')) continue;
        if (effective[key] && chip) {
            const text = everywhere(effective[key], effective[`--c-${hue}-bg`]);
            derived[`--c-${hue}-txt`] = text;
            if (panel) {
                const lane = mix(effective[key], panel, LANE_SHARE);
                derived[`--c-${hue}-lane`] = lane;
                derived[`--c-${hue}-lane-txt`] = readable(text, lane);
            }
        }
    }
    return derived;
}

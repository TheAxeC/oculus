// Layer 1, data. The rich project slide: the front matter of a `kind: project` slide read into the
// slide the view draws, with each figure of its panels resolved against the deck's folder.
//
// The keys are `tag`, `title`, `sub`, `hook`, `eli5`, `equation`, `specs`, `panels`, `method` and
// `results`, plus `mechanism` and `headline`, which a summary of another deck reads. A key that is
// of the wrong shape is read as absent and nothing here throws. A figure that is not in the folder
// is marked so the view draws the gap and not a dead image, and it is a finding; so is an
// `equation:` that names an image, which is not kept, since a slide's equation is LaTeX.

import { z } from 'zod';
import { str, strings } from '../../helpers/guards.ts';
import { optionalTextShape, readOr, rowsShape, wordShape } from '../../shapes/shapes.ts';
import type {
    PresentEli5,
    PresentPanel,
    PresentSlide,
    PresentSpec,
    PresentTag
} from '../../model/index.ts';
import type { Raise } from './spec.ts';

/** The suffixes that make an `equation:` the name of an image file, which a slide does not take. */
const IMAGE_SUFFIXES = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

/** Whether an `equation:` names an image file: its trimmed text ends in an image suffix. */
function equationIsImage(equation: string): boolean {
    const lowered = equation.trim().toLowerCase();
    return IMAGE_SUFFIXES.some((suffix) => lowered.endsWith(suffix));
}

/** How a deck resolves a figure name: the address of a file that is there, or why it is not. */
export type Figures = (name: string) => { src: string } | { error: 'outside' | 'missing' };

/** The `tag:` map: its `class` and `text` when they are texts, nothing when it holds neither. */
const tagShape = z
    .object({ class: optionalTextShape, text: optionalTextShape })
    .transform((value): PresentTag | undefined => {
        const held: PresentTag = {};
        if (value.class !== undefined) held.class = value.class;
        if (value.text !== undefined) held.text = value.text;
        return Object.keys(held).length === 0 ? undefined : held;
    });

/** The `eli5:` callout: its `purpose` and `plain` when they are texts, and nothing when neither. */
const eli5Shape = z
    .object({ purpose: optionalTextShape, plain: optionalTextShape })
    .transform((value): PresentEli5 | undefined => {
        const held: PresentEli5 = {};
        if (value.purpose !== undefined) held.purpose = value.purpose;
        if (value.plain !== undefined) held.plain = value.plain;
        return Object.keys(held).length === 0 ? undefined : held;
    });

/** One `specs:` chip. A half that is missing or is not a text is the empty string. */
const specShape = z.object({ label: wordShape, value: wordShape }) satisfies z.ZodType<PresentSpec>;

/** One `panels:` visual as the file writes it. */
type PanelRow = {
    figure?: string;
    diagram_html?: string;
    caption?: string;
    explain?: string;
};

/** One `panels:` entry, kept when it carries any of its four texts. */
const panelShape = z
    .object({
        figure: optionalTextShape,
        diagram_html: optionalTextShape,
        caption: optionalTextShape,
        explain: optionalTextShape
    })
    .refine((panel) =>
        [panel.figure, panel.diagram_html, panel.caption, panel.explain].some(
            (one) => typeof one === 'string'
        )
    ) as z.ZodType<PanelRow>;

const specsShape = rowsShape(specShape);
const panelsShape = rowsShape(panelShape);

/** The panels, each figure resolved: its address when it is there, the gap marked when not. */
function panelsOf(
    value: unknown,
    figures: Figures,
    raise: Raise,
    key: string,
    folder: string
): PresentPanel[] {
    return readOr(panelsShape, value, []).map((row) => {
        const panel: PresentPanel = {};
        if (row.figure !== undefined) {
            panel.figure = row.figure;
            const found = figures(row.figure);
            if ('src' in found) panel.src = found.src;
            else {
                panel.missing = true;
                raise(
                    key,
                    found.error === 'outside'
                        ? 'findings.deck.path_outside'
                        : 'findings.deck.figure_missing',
                    row.figure,
                    folder
                );
            }
        }
        if (row.diagram_html !== undefined) panel.diagramHtml = row.diagram_html;
        if (row.caption !== undefined) panel.caption = row.caption;
        if (row.explain !== undefined) panel.explain = row.explain;
        return panel;
    });
}

/**
 * The slide one `kind: project` front matter and its body make. `folder` names the deck's folder
 * in the finding of a missing figure, and `key` names the slide.
 */
export function projectSlide(
    meta: Record<string, unknown>,
    body: string,
    figures: Figures,
    raise: Raise,
    key: string,
    folder: string
): PresentSlide {
    const slide: PresentSlide = {
        specs: readOr(specsShape, meta.specs, []),
        panels: panelsOf(meta.panels, figures, raise, key, folder),
        method: strings(meta.method),
        results: strings(meta.results)
    };
    const tag = readOr(tagShape, meta.tag, undefined);
    const eli5 = readOr(eli5Shape, meta.eli5, undefined);
    const text = (name: string): string | undefined => {
        const held = str(meta[name]);
        return held === undefined || held.trim() === '' ? undefined : held;
    };
    if (tag !== undefined) slide.tag = tag;
    if (eli5 !== undefined) slide.eli5 = eli5;
    for (const name of ['title', 'sub', 'hook', 'mechanism', 'headline'] as const) {
        const held = text(name);
        if (held !== undefined) slide[name] = held;
    }
    const equation = text('equation');
    if (equation !== undefined) {
        if (equationIsImage(equation)) {
            raise(key, 'findings.deck.equation_image', equation.trim());
        } else slide.equation = equation;
    }
    if (body.trim() !== '') slide.body = body;
    return slide;
}

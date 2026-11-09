// Layer 2, server. The three files the website is written with, built from the hub (papers.ts,
// cv.ts) under the paths `website.files` gives and written as text, and the comparison of one with
// the file on disk. Each file opens with a comment line saying it is generated and how to change
// it. A text that another YAML reader would read as another type is quoted (the `compat` tags of
// YAML 1.1, which the website's CV programs read with), but for a timestamp: an award's day is
// written plain, as the website writes it. Its offset has no colon, so it matches no YAML 1.1
// timestamp, and PyYAML and a YAML 1.2 reader both read it as the text the website's own file
// gives.
//
// Two files are the same when they parse to the same value. The order of the keys of a map counts
// for the file's own sections and for a map under the key of the row of `website.paper_fields`
// whose `from` is `links_with_code`, whose names the website prints in order; the order inside an
// entry does not, since nothing the website prints depends on it.

import { Document, parse, Schema } from 'yaml';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { PaperField, WebsiteFiles } from '../../../../data/sources/config/settings/files.ts';
import { built, cvFile, industryFile, type CvInput } from './cv.ts';
import { papersFile, type PapersInput } from './papers.ts';
import type { Problem } from './site.ts';

/** The tag of a YAML 1.1 timestamp, left out of the quoting so an award's day is written plain. */
const TIMESTAMP = 'tag:yaml.org,2002:timestamp';

/**
 * The YAML 1.1 tags a text is quoted against, so it reads as a text there too; the timestamp is
 * left out.
 */
const COMPAT = new Schema({ schema: 'yaml-1.1' }).tags.filter((tag) => tag.tag !== TIMESTAMP);

/**
 * What the three files are built from, the paths `website.files` writes them at and the comment
 * line `website.file_header` opens each with.
 */
export type WebsiteInput = PapersInput & CvInput & { paths: WebsiteFiles; fileHeader: string };

/** One generated file: its path in the website's folder and its text. */
export type GeneratedFile = { name: string; text: string };

/** A value as the text of a generated file, its comment line first when the setting holds one. */
function fileText(value: unknown, header: string): string {
    const doc = new Document(value, { compat: COMPAT });
    if (header !== '') doc.commentBefore = ` ${header}`;
    return doc.toString({ lineWidth: 0 });
}

/**
 * The three files the hub gives and the problems found building them; none while the user is not
 * known, since the CV and the authors' places are the user's.
 */
export function websiteFiles(input: WebsiteInput): { files: GeneratedFile[]; problems: Problem[] } {
    if (input.self.size === 0) {
        return {
            files: [],
            problems: [{ about: null, key: 'audit.msg_site_no_person', args: [] }]
        };
    }
    const papers = papersFile(input);
    const cv = built(input);
    const files: GeneratedFile[] = [
        { name: input.paths.cv, text: fileText(cvFile(input, cv), input.fileHeader) },
        { name: input.paths.papers, text: fileText(papers.value, input.fileHeader) },
        { name: input.paths.industry, text: fileText(industryFile(input, cv), input.fileHeader) }
    ];
    return { files, problems: [...papers.problems, ...cv.problems] };
}

/** A place in a file, its keys and list indices joined by dots; empty for the whole file. */
function placeOf(path: readonly (string | number)[]): string {
    return path.join('.');
}

/** Whether the order of a map's keys counts at this place: the file's sections and a links map. */
function ordered(path: readonly (string | number)[], links: ReadonlySet<string | number>): boolean {
    return path.length === 0 || links.has(path[path.length - 1]);
}

/** One place at which a generated file and the file on disk differ, with each one's value there. */
export type Difference = { place: string; generated: unknown; onDisk: unknown };

/**
 * The first key of a map that the two sides hold at different places in the order that counts
 * there, comparing only the keys both hold; undefined when the order is the same.
 */
function outOfOrder(wanted: readonly string[], holds: readonly string[]): string | undefined {
    const generated = wanted.filter((key) => holds.includes(key));
    const onDisk = holds.filter((key) => wanted.includes(key));
    return generated.find((key, at) => onDisk[at] !== key);
}

/**
 * Every place at which two values differ, depth first in the order of `want`; a place that differs
 * as a whole (a key one side lacks, values of different kinds) is not looked inside. Keys out of
 * the order that counts at a map are one difference, at the first key out of its place, and the map
 * is not looked inside.
 */
function differs(
    want: unknown,
    held: unknown,
    path: (string | number)[],
    links: ReadonlySet<string | number>,
    out: Difference[]
) {
    if (Array.isArray(want) && Array.isArray(held)) {
        const length = Math.max(want.length, held.length);
        for (let at = 0; at < length; at += 1) {
            differs(want[at], held[at], [...path, at], links, out);
        }
        return;
    }
    if (isMap(want) && isMap(held)) {
        const holds = Object.keys(held);
        const wanted = Object.keys(want);
        const moved = ordered(path, links) ? outOfOrder(wanted, holds) : undefined;
        if (moved !== undefined) {
            out.push({ place: placeOf([...path, moved]), generated: want, onDisk: held });
            return;
        }
        for (const key of new Set([...wanted, ...holds])) {
            differs(want[key], held[key], [...path, key], links, out);
        }
        return;
    }
    if (!Object.is(want, held)) out.push({ place: placeOf(path), generated: want, onDisk: held });
}

/**
 * The places at which a generated file and the text on disk differ, in the generated file's order,
 * and none when they are the same; a text that does not parse differs as a whole. The rows are
 * those of `website.paper_fields`, whose `links_with_code` keys say where a map's order counts.
 */
export function differences(
    generated: string,
    onDisk: string,
    paperFields: readonly PaperField[]
): Difference[] {
    const want: unknown = parse(generated);
    let held: unknown;
    try {
        held = parse(onDisk);
    } catch {
        return [{ place: placeOf([]), generated: want, onDisk: undefined }];
    }
    const out: Difference[] = [];
    const links = new Set(
        paperFields.filter((row) => row.from === 'links_with_code').map(({ key }) => key)
    );
    differs(want, held, [], links, out);
    return out;
}

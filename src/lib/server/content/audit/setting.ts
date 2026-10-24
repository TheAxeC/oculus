// Layer 2, server. The reader of a hub's `audit:` setting, the conventions the audit holds the
// hub's projects to: the files a project must hold (`required_files`), the headings a file must
// hold while a manifest key has a value (`required_sections`), the folders a project at a stage is
// kept under (`stage_folders`) and the website's publications feed (`website`). Each is off unless
// the hub sets it.
//
// The value is read from the hub's own `.oculus/config.yml`, where the setting lives: the merge of
// the hub's file (data/sources/config/merge/hub-layer.ts) applies only the keys of the hub list, so
// a key of `audit:` the setting does not take never reaches the merged configuration, and the audit
// is to name it. The keys the hub list holds are read the same in both. Every part that is not of
// its shape is a problem named by its dotted key down to the field (`audit.required_files.0.file`):
// that part is off and the rest of the setting runs. The audit words each problem as a finding of
// the hub (projects.ts), so a hub other than the primary, whose settings no reader of the config
// channel checks, is covered.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { isMap } from '../../../data/helpers/guards.ts';
import { folderOf, HUB_FILE } from '../../../data/helpers/hub-names.ts';
import type { WordBlock } from '../../../data/shapes/boards/words.ts';
import { wordBlock } from '../../../data/shapes/catalog-files/vocab.ts';

/** A row of `required_files`: the file, and the stage, project folder and hub folders it needs. */
type RequiredFile = { file: string; stages?: WordBlock; folder?: string; folders?: string[] };

/** A row of `required_sections`: the file, the heading it holds, the manifest key asking for it. */
type RequiredSection = { file: string; heading: string; key: string; folders?: string[] };

/** A row of `stage_folders`: the stages, and the hub folders a project at them lies under. */
type StageFolders = { stages: WordBlock; folders: string[] };

/**
 * A row of `website.kinds`: the sections of the feed a project is expected in, and the stages and
 * forms the row holds to; a side the row leaves out holds to nothing.
 */
export type PublicationKind = { kind: string[]; stages?: string[]; forms?: string[] };

/** `website`: the feed, the key of each section's list, the key of a title and the kinds. */
export type Website = { file: string; list: string; title: string; kinds: PublicationKind[] };

/** A hub's `audit:` as read: the rows of each part that are of their shape, and the problems. */
export type AuditSetting = {
    requiredFiles: RequiredFile[];
    requiredSections: RequiredSection[];
    stageFolders: StageFolders[];
    /** The website check, null while the hub names no feed or names it not in its shape. */
    website: Website | null;
    /** The dotted key of every part of `audit:` that is not of its shape, in the file's order. */
    problems: string[];
};

/** The setting of a hub that names none of the checks, made anew for each caller. */
function noSetting(): AuditSetting {
    return {
        requiredFiles: [],
        requiredSections: [],
        stageFolders: [],
        website: null,
        problems: []
    };
}

/** The key the setting is written under in the hub's settings file. */
const AUDIT = 'audit';

/** The parts `audit:` takes. */
const PARTS = ['required_files', 'required_sections', 'stage_folders', 'website'];

/** A text with a character in it. */
const filledShape = z.string().min(1);

/** A list of texts, each with a character in it. */
const textsShape = z.array(filledShape);

/** A list of folders of the hub, as the scan writes a folder: no leading `./`, no trailing `/`. */
const foldersShape = textsShape.transform((all) => all.map(folderOf));

/** The fields of a row, as one row of a part reads them. */
type Fields = Record<string, z.ZodType>;

/**
 * The rows of one part, each kept only when every field it holds is of its shape and it holds the
 * fields it needs; every field that is not, and every field the part does not take, is a problem
 * of its own.
 */
function rowsOf(
    value: unknown,
    at: string,
    fields: Fields,
    needed: readonly string[],
    problems: string[]
): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
        problems.push(at);
        return [];
    }
    const kept: Record<string, unknown>[] = [];
    value.forEach((row: unknown, index) => {
        const place = `${at}.${index}`;
        if (!isMap(row)) {
            problems.push(place);
            return;
        }
        const read: Record<string, unknown> = {};
        let whole = true;
        for (const [name, held] of Object.entries(row)) {
            const shape = Object.hasOwn(fields, name) ? fields[name] : undefined;
            const parsed = shape?.safeParse(held);
            if (parsed?.success === true) read[name] = parsed.data;
            else {
                problems.push(`${place}.${name}`);
                whole = false;
            }
        }
        for (const name of needed) {
            if (Object.hasOwn(row, name)) continue;
            problems.push(`${place}.${name}`);
            whole = false;
        }
        if (whole) kept.push(read);
    });
    return kept;
}

/** The fields of a row of `required_files`. */
const FILE_FIELDS: Fields = {
    file: filledShape,
    stages: wordBlock,
    folder: filledShape.transform(folderOf),
    folders: foldersShape
};

/** The fields of a row of `required_sections`. */
const SECTION_FIELDS: Fields = {
    file: filledShape,
    heading: filledShape,
    key: filledShape,
    folders: foldersShape
};

/** The fields of a row of `stage_folders`. */
const STAGE_FIELDS: Fields = { stages: wordBlock, folders: foldersShape };

/** The fields of a row of `website.kinds`. */
const KIND_FIELDS: Fields = { kind: textsShape.min(1), stages: textsShape, forms: textsShape };

/** The keys `website` takes. */
const WEBSITE_KEYS = ['file', 'list', 'title', 'kinds'];

/**
 * `website`, or null while it names no feed. A feed named with a list key, a title key or kinds
 * missing or not of their shape is off, and each such key is a problem.
 */
function websiteOf(value: unknown, problems: string[]): Website | null {
    const at = `${AUDIT}.website`;
    if (!isMap(value)) {
        problems.push(at);
        return null;
    }
    for (const key of Object.keys(value)) {
        if (!WEBSITE_KEYS.includes(key)) problems.push(`${at}.${key}`);
    }
    const text = (key: string): string | null => {
        const read = z.string().safeParse(value[key]);
        return read.success ? read.data : null;
    };
    const file = Object.hasOwn(value, 'file') ? text('file') : '';
    if (file === null) {
        problems.push(`${at}.file`);
        return null;
    }
    if (file === '') return null;
    const before = problems.length;
    const list = text('list');
    const title = text('title');
    if (list === null || list === '') problems.push(`${at}.list`);
    if (title === null || title === '') problems.push(`${at}.title`);
    const rows = Object.hasOwn(value, 'kinds')
        ? rowsOf(value.kinds, `${at}.kinds`, KIND_FIELDS, ['kind'], problems)
        : null;
    if (rows === null || (Array.isArray(value.kinds) && value.kinds.length === 0)) {
        problems.push(`${at}.kinds`);
    }
    if (problems.length > before || list === null || title === null || rows === null) return null;
    return { file, list, title, kinds: rows as PublicationKind[] };
}

/** A hub's `audit:` value read into its checks, each part not of its shape named and left off. */
function auditSetting(value: unknown): AuditSetting {
    if (value === undefined) return noSetting();
    const problems: string[] = [];
    if (!isMap(value)) return { ...noSetting(), problems: [AUDIT] };
    for (const key of Object.keys(value)) {
        if (!PARTS.includes(key)) problems.push(`${AUDIT}.${key}`);
    }
    const part = <T>(key: string, fields: Fields, needed: string[]): T[] =>
        Object.hasOwn(value, key)
            ? (rowsOf(value[key], `${AUDIT}.${key}`, fields, needed, problems) as T[])
            : [];
    const requiredFiles = part<RequiredFile>('required_files', FILE_FIELDS, ['file']);
    const requiredSections = part<RequiredSection>('required_sections', SECTION_FIELDS, [
        'file',
        'heading',
        'key'
    ]);
    const stageFolders = part<StageFolders>('stage_folders', STAGE_FIELDS, ['stages', 'folders']);
    const website = Object.hasOwn(value, 'website') ? websiteOf(value.website, problems) : null;
    return { requiredFiles, requiredSections, stageFolders, website, problems };
}

/**
 * The `audit:` value of the hub's own settings file, undefined when the file is not there, does not
 * parse, is no map or sets none; the merge of the file reports a file that does not read.
 */
function hubAuditValue(hub: string): unknown {
    let parsed: unknown;
    try {
        parsed = parse(readFileSync(join(hub, HUB_FILE), 'utf8'));
    } catch {
        return undefined;
    }
    return isMap(parsed) && Object.hasOwn(parsed, AUDIT) ? parsed[AUDIT] : undefined;
}

/** The setting of a hub, read from its own settings file. */
export function hubAuditSetting(hub: string): AuditSetting {
    return auditSetting(hubAuditValue(hub));
}

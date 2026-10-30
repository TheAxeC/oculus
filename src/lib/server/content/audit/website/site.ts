// Layer 2, server. What the website's own `_data/website.yml` gives the generated files, and the
// names they share: the research lines a paper may name (`programs:`), the titles of the sections
// of the CV and of the publications (`sections:`) and the website's parts of the CV's person block
// (`cv:`). The website keeps these, so the hub holds no word of the website's own and the generated
// files hold no word that is not the hub's or the website's.

import { join } from 'node:path';
import { z } from 'zod';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { Project } from '../../../../data/model/index.ts';

/** The website's own file, relative to its folder. */
export const SITE_FILE = '_data/website.yml';

/** The CV's file, relative to the website's folder. */
export const CV_FILE = '_data/data.yml';

/** The publications' file, relative to the website's folder. */
export const PAPERS_FILE = '_data/publications.yml';

/** The employer CVs' file, relative to the website's folder. */
export const INDUSTRY_FILE = '_data/industry.yml';

/** The files the hub's files are written into, in the order a write takes them. */
const GENERATED = [CV_FILE, PAPERS_FILE, INDUSTRY_FILE] as const;

/** One of the generated files. */
export type GeneratedName = (typeof GENERATED)[number];

/** What the website's own file gives the generated files. */
export type SiteFile = {
    /** The file's path relative to the website's folder, which a problem names it by. */
    path: string;
    /** The keys of `programs:`, the research lines a paper may name. */
    programs: string[];
    /** The title of each section of the CV and of the publications, by the section's key. */
    sections: Record<string, string>;
    /** The website's parts of the CV's person block, as the file holds them. */
    cv: Record<string, unknown>;
};

/** The catalog sentences a Problem is said with. */
type ProblemKey =
    | 'audit.msg_site_no_person'
    | 'audit.msg_site_stage'
    | 'audit.msg_site_no_kind'
    | 'audit.msg_site_no_self'
    | 'audit.msg_site_program'
    | 'audit.msg_cv_unknown_person'
    | 'audit.msg_cv_unknown_record'
    | 'audit.msg_cv_self_names'
    | 'audit.msg_cv_key_twice'
    | 'audit.msg_cv_empty_key';

/**
 * Something the hub's files give that the website cannot be written with: the manifest it is about
 * (null for the website or the career file), the catalog sentence that says it, and the audit
 * section it is listed in, the publications section unless it says `data`.
 */
export type Problem = {
    about: Project | null;
    key: ProblemKey;
    args: (string | number)[];
    kind?: 'data';
};

/** A map's texts, by key, the other values left out. */
const textsShape = z
    .record(z.string(), z.unknown())
    .transform((map) =>
        Object.fromEntries(
            Object.entries(map).flatMap(([key, value]) =>
                typeof value === 'string' ? [[key, value]] : []
            )
        )
    );

/** The website's own file read for what the generated files take from it. */
export function readSite(value: unknown): SiteFile {
    const map = isMap(value) ? value : {};
    const sections = textsShape.safeParse(map.sections);
    return {
        path: SITE_FILE,
        programs: isMap(map.programs) ? Object.keys(map.programs) : [],
        sections: sections.success ? sections.data : {},
        cv: isMap(map.cv) ? map.cv : {}
    };
}

/**
 * The website's folder on disk, the primary hub's folder and the setting's folder joined, and the
 * empty text while the setting names none.
 */
export function websiteDir(hub: string, folder: string): string {
    return folder === '' ? '' : join(hub, folder);
}

/** The files the audit reads in the website's folder, absolute: its own and the three generated. */
export function siteFiles(dir: string): string[] {
    return dir === '' ? [] : [SITE_FILE, ...GENERATED].map((name) => join(dir, name));
}

/** The title the website's file gives a section, absent when it gives none. */
export function titleOf(site: SiteFile, key: string): string | undefined {
    return Object.hasOwn(site.sections, key) ? site.sections[key] : undefined;
}

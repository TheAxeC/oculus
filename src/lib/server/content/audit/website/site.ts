// Layer 2, server. What the website's own file gives the generated files, the research lines a
// paper may name (`programs:`), and the one check of the paths of `website.files`, which every
// reader of the four files goes through. The website's own words (the titles of its sections and
// the parts of the CV's person block) stay in its own file, read by its templates, so the hub holds
// no word of the website's and the generated files hold only what the hub gives.
//
// A path of `website.files` is relative to the website's folder and is held to it by its real path,
// so a link out of the folder is caught.

import { basename, dirname, isAbsolute, join } from 'node:path';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { Project } from '../../../../data/model/index.ts';
import type { WebsiteFiles } from '../../../../data/sources/config/settings/files.ts';
import { seen } from '../../../core/git/run.ts';
import { below, foldsCase, realPath } from '../../../core/paths.ts';

/** What the website's own file gives the generated files. */
export type SiteFile = {
    /** The file's path relative to the website's folder, which a problem names it by. */
    path: string;
    /** The keys of `programs:`, the research lines a paper may name. */
    programs: string[];
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

/** The website's own file at `path` read for what the generated files take from it. */
export function readSite(value: unknown, path: string): SiteFile {
    return {
        path,
        programs: isMap(value) && isMap(value.programs) ? Object.keys(value.programs) : []
    };
}

/**
 * The website's folder on disk, the primary hub's folder and the setting's folder joined, and the
 * empty text while the setting names none.
 */
export function websiteDir(hub: string, folder: string): string {
    return folder === '' ? '' : join(hub, folder);
}

/**
 * Where a path comes to on disk: its real path, or for a file that is not there the real path of
 * the nearest folder that is, with the rest of the path after it. A link that leads nowhere comes
 * to no place, since nothing tells where a write through it would land.
 */
function placeOf(path: string): string | null {
    const real = realPath(path, true);
    if (real !== null) return real;
    if (seen(path)) return null;
    const parent = dirname(path);
    if (parent === path) return path;
    const place = placeOf(parent);
    return place === null ? null : join(place, basename(path));
}

/** A path of `website.files` that cannot be used: its dotted key and the value the key holds. */
type BadPath = { key: string; value: string };

/** The keys of `website.files`, in the order a finding names them. */
const FILE_KEYS = ['site', 'cv', 'papers', 'industry'] as const;

/**
 * The paths of `website.files` that cannot be used, checked together: a path that is empty, is
 * absolute or comes to no place under the website's folder, and every path of two keys that name
 * one file.
 */
export function badPaths(dir: string, files: WebsiteFiles): BadPath[] {
    const real = placeOf(dir);
    const folds = real !== null && foldsCase(real);
    const spelled = (place: string | null): string | null =>
        folds ? (place?.toLowerCase() ?? null) : place;
    const root = spelled(real);
    const places = FILE_KEYS.map((key) => {
        const value = files[key];
        const place = value === '' || isAbsolute(value) ? null : placeOf(join(dir, value));
        return { key, value, place: spelled(place) };
    });
    return places
        .filter(
            ({ place }, at) =>
                place === null ||
                root === null ||
                !below(place, root) ||
                places.some((other, there) => there !== at && other.place === place)
        )
        .map(({ key, value }) => ({ key: `website.files.${key}`, value }));
}

/**
 * The files the audit reads in the website's folder, absolute: its own and the three generated,
 * without a path that cannot be used.
 */
export function siteFiles(dir: string, files: WebsiteFiles): string[] {
    if (dir === '') return [];
    const bad = badPaths(dir, files).map((one) => one.value);
    return FILE_KEYS.map((key) => files[key])
        .filter((path) => !bad.includes(path))
        .map((path) => join(dir, path));
}

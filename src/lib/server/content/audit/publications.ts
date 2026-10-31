// Layer 2, server. The audit's publications section: the website's three generated files, built in
// memory from the primary hub's files (website/files.ts), against the files on disk at the paths
// `website.files` gives. A file that differs is one finding naming the file and the first place it
// differs at, and the finding offers Write the website. A manifest, a career row or a research line
// the website cannot be written with is a finding of its own, a research line in the Missing data
// section, the rest here. The section runs for the primary hub alone, whose `website.folder` names
// the website: an empty folder checks nothing, a folder that is not there is one finding naming it,
// and a path of `website.files` that cannot be used is one finding naming its key, with none of the
// four files read.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Career, Person } from '../../../data/model/index.ts';
import type { WebsiteSettings } from '../../../data/sources/config/settings/files.ts';
import {
    fileIn,
    fileOf,
    isFolder,
    type AuditInput,
    type Raised,
    sentence,
    scopeOf,
    slurp
} from './rules.ts';
import { differences, websiteFiles } from './website/files.ts';
import { badPaths, readSite, type Problem, type SiteFile } from './website/site.ts';

/**
 * What the section checks besides the hub's records: the website's setting, its folder on disk (the
 * empty text when the setting names none), the people and the career file the CV is built from.
 */
export type WebsiteCheck = {
    setting: WebsiteSettings;
    dir: string;
    people: readonly Person[];
    career: Career | null;
};

/** The scope a finding about the website itself is filed under. */
const WEBSITE = 'website';

/** The website's own file at `at` in its folder, read; a problem when it does not parse. */
function siteOf(dir: string, at: string): SiteFile | { unreadable: string } {
    const path = join(dir, at);
    if (!existsSync(path)) return readSite(undefined, at);
    try {
        return readSite(parse(slurp(path)), at);
    } catch (error) {
        return {
            unreadable: error instanceof Error ? error.message.split('\n')[0] : String(error)
        };
    }
}

/** The manifest's key a finding about a manifest's record names. */
const RECORD = 'publication';

/** A problem of the build as a finding: of its manifest when it names one, else of the website. */
function raised(input: AuditInput, problem: Problem, where: string): Raised {
    const { about } = problem;
    return {
        scope: about === null ? WEBSITE : scopeOf(about),
        where: about === null ? where : RECORD,
        kind: problem.kind ?? 'publink',
        ...(about === null ? { file: '' } : fileIn(input.hub, about, about.file)),
        ...sentence(problem.key, ...problem.args)
    };
}

/** The website's generated files against the files on disk, for the primary hub alone. */
export function publications(input: AuditInput, add: (f: Raised) => void): void {
    const check = input.website;
    if (check === null || check.setting.folder === '') return;
    const where = check.setting.folder;
    if (!isFolder(check.dir)) {
        add({
            scope: WEBSITE,
            where,
            kind: 'publink',
            file: '',
            ...sentence('audit.msg_site_no_folder', where)
        });
        return;
    }
    const { files } = check.setting;
    const bad = badPaths(check.dir, files).at(0);
    if (bad !== undefined) {
        add({
            scope: WEBSITE,
            where: bad.key,
            kind: 'publink',
            file: '',
            ...sentence('audit.msg_site_bad_path', bad.key, bad.value)
        });
        return;
    }
    const site = siteOf(check.dir, files.site);
    if ('unreadable' in site) {
        add({
            scope: WEBSITE,
            where: files.site,
            kind: 'publink',
            file: fileOf(input.hub, join(check.dir, files.site)),
            ...sentence('audit.msg_site_unreadable', files.site, site.unreadable)
        });
        return;
    }
    const built = websiteFiles({
        projects: input.projects,
        collections: input.collections,
        people: check.people,
        career: check.career,
        self: input.self,
        kinds: check.setting.kinds,
        rules: input.rules,
        site,
        paths: files
    });
    for (const problem of built.problems) add(raised(input, problem, where));
    for (const file of built.files) {
        const path = join(check.dir, file.name);
        const found = differences(file.text, slurp(path));
        if (found.length === 0) continue;
        const place = found[0].place;
        add({
            scope: WEBSITE,
            where: file.name,
            kind: 'publink',
            file: fileOf(input.hub, path),
            action: 'website',
            ...(place === ''
                ? sentence('audit.msg_site_differs_whole', file.name)
                : sentence('audit.msg_site_differs', file.name, place))
        });
    }
}

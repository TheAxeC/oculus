// Layer 1, data. Reads the four generated feed files into the counts and run dates the command
// center shows. Server side only: it reads the filesystem and no client module may import it.
//
// It summarises and does not carry. The Inbox, Lit Watch, Position Leads and LinkedIn views
// read these files for themselves; what is here is the handful of numbers the Focus board needs, so
// that a board rebuild does not pull several thousand lines of feed entries over the socket.
//
// A file or folder that is not there is null for that feed and no finding: the feeds are generated
// by the hand-run cockpit tasks, so a hub that has never run one legitimately has none. A file that
// is there and does not parse is a finding, like every other broken file.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Feeds, FeedFiles, Finding, Lead, RawFeeds } from '../model.ts';
// `str` here is the shared `text`: this file's reading of a missing or mistyped value has always
// been the empty string rather than undefined, and the alias keeps that reading at every call it
// makes. The lead's status is the one value it does not read for itself, since the rule that closes
// a lead reads it in data/leads.ts.
import { isMap, text as str } from '../guards.ts';
import { isLeadClosed } from '../leads.ts';

/** An ISO date anywhere inside a string; the leads feed writes prose around its dates. */
const DATE = /\d{4}-\d{2}-\d{2}/;

/** A `meta.log` line of the leads feed that records a scout run, and the date it ran on. */
const SCOUT_RUN = /^\s*(\d{4}-\d{2}-\d{2})\b.*?scout/i;

/** A `date:` line of a LinkedIn post's front matter. */
const FRONT_DATE = /^date:\s*["']?(\d{4}-\d{2}-\d{2})/m;

/** The `meta:` map of a feed file, and an empty map for a file that has none. */
function metaOf(data: Record<string, unknown>): Record<string, unknown> {
    return isMap(data.meta) ? data.meta : {};
}

/** The `entries:` list of a feed file, and an empty list for a file that has none. */
function entriesOf(data: Record<string, unknown>): Record<string, unknown>[] {
    if (!Array.isArray(data.entries)) return [];
    return data.entries.filter(isMap);
}

/**
 * Read and parse one feed file. A file that is not there is null with no finding, which is what
 * separates this from sources/registries.ts: a registry is part of the hub and a feed is generated.
 */
function readFeed(file: string, findings: Finding[]): Record<string, unknown> | null {
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch {
        return null;
    }
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        findings.push({ file, key: '', message: `does not parse: ${message}` });
        return null;
    }
    if (!isMap(parsed)) {
        findings.push({ file, key: '', message: 'is not a map of keys' });
        return null;
    }
    return parsed;
}

/**
 * The inbox: when it was last triaged, and how many threads are still waiting on an answer. A
 * thread counts when it is untriaged and its `kind` asks for a reply or an action; an informational
 * one is read and not acted on.
 */
function inbox(file: string, findings: Finding[]): Feeds['inbox'] {
    const data = readFeed(file, findings);
    if (data === null) return null;
    const run = str(metaOf(data).run);
    const actionable = entriesOf(data).filter(
        (entry) => entry.triaged !== true && ['reply', 'action'].includes(str(entry.kind))
    ).length;
    return { run: run === '' ? null : run, actionable };
}

/** One lead of the feed, with the ISO date its `deadline:` text holds. */
function lead(entry: Record<string, unknown>): Lead {
    const date = DATE.exec(str(entry.deadline));
    const fit = str(entry.fit);
    return {
        title: str(entry.title),
        deadline: date === null ? null : date[0],
        status: str(entry.status),
        fit: fit === '' ? null : fit
    };
}

/**
 * The leads file answers two of the five feeds: the live leads themselves, and the position
 * scout's own run date, which the file records as the leading date of a `meta.log` line rather
 * than as a run field of its own.
 */
function leads(
    file: string,
    findings: Finding[]
): { leads: Feeds['leads']; scout: Feeds['scout'] } {
    const data = readFeed(file, findings);
    if (data === null) return { leads: null, scout: null };
    const live = entriesOf(data)
        .filter((entry) => !isLeadClosed(entry.status))
        .map(lead);
    const log = metaOf(data).log;
    const runs = (Array.isArray(log) ? log : [])
        .map((line) => SCOUT_RUN.exec(str(line)))
        .filter((found): found is RegExpExecArray => found !== null)
        .map((found) => found[1]);
    const newest = runs.sort().at(-1);
    return { leads: live, scout: { lastRun: newest ?? null } };
}

/** The Lit Watch radar: the day the last sweep ran. */
function radar(file: string, findings: Finding[]): Feeds['radar'] {
    const data = readFeed(file, findings);
    if (data === null) return null;
    const run = str(metaOf(data).last_run);
    return { lastRun: run === '' ? null : run };
}

/**
 * The LinkedIn pipeline: the newest `date:` among the posted files. A file whose name starts `xx`
 * is an unposted idea and carries no date that counts. The folder lives in the website repository
 * beside the hub, which is a separate checkout, so an absent folder is the ordinary case.
 */
function linkedin(dir: string, findings: Finding[]): Feeds['linkedin'] {
    let names: string[];
    try {
        if (!statSync(dir).isDirectory()) return null;
        names = readdirSync(dir);
    } catch {
        return null;
    }
    const dates: string[] = [];
    for (const name of names.sort()) {
        if (!name.endsWith('.md') || name.startsWith('xx')) continue;
        let text: string;
        try {
            text = readFileSync(join(dir, name), 'utf8');
        } catch (error) {
            const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
            findings.push({
                file: join(dir, name),
                key: '',
                message: `cannot be read: ${message}`
            });
            continue;
        }
        const found = FRONT_DATE.exec(text);
        if (found !== null) dates.push(found[1]);
    }
    const newest = dates.sort().at(-1);
    return { lastPost: newest ?? null };
}

/**
 * Read the four feed sources. Each is independent: a broken inbox costs the inbox line and nothing
 * else. Nothing here throws and no value is repaired.
 */
export function readFeeds(hub: string, files: FeedFiles): { feeds: RawFeeds; findings: Finding[] } {
    const findings: Finding[] = [];
    const both = leads(join(hub, files.leads), findings);
    const feeds: RawFeeds = {
        inbox: inbox(join(hub, files.inbox), findings),
        leads: both.leads,
        radar: radar(join(hub, files.radar), findings),
        scout: both.scout,
        linkedin: linkedin(join(hub, files.linkedin), findings)
    };
    return { feeds, findings };
}

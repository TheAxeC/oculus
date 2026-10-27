// Layer 2, server. The audit's rules and bookkeeping: the thresholds and vocabularies read out of
// the merged configuration, the muted signatures, a finding's signature, the collector a section
// hands its findings to, and the small readers of the disk and of a field every section shares.

import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { relative } from 'node:path';
import { z } from 'zod';
import { findingText } from '../../../data/helpers/finding-text.ts';
import { byKey, focusSetting, isMap, scalar } from '../../../data/helpers/guards.ts';
import { filledText } from '../../../data/shapes/shapes.ts';
import { skippedTiers, wordsWith } from '../../../data/shapes/vocab-keys.ts';
import { rolesOf, type Role } from '../../../data/shapes/boards/roles.ts';
import { boardsTaking, takeContext } from '../../../data/shapes/boards/takes.ts';
import type { Holders } from '../../../data/helpers/hub-names.ts';
import type { AuditFinding, Collection, Domain, Id, Project } from '../../../data/model/index.ts';
import { below, realPath } from '../../core/paths.ts';
import type { AuditSetting } from './setting.ts';

/** The thresholds and vocabularies the rules read, out of the merged configuration. */
export type AuditRules = {
    /** The soft character limits per manifest field, `read_limits` of the merged config. */
    readLimits: Record<string, number>;
    /** Whole days a document may be ahead of its own manifest before the manifest is behind. */
    staleLagDays: number;
    /**
     * The domains a project is expected to name a dataset in, by the ids of the merged portfolio:
     * the entries of the hubs' domains registries marked `expects_datasets: true`.
     */
    dataDomains: Set<string>;
    /**
     * The collection-entry statuses that wait on someone else, so a date is asked for: the words
     * of `statuses` carrying `waiting`.
     */
    waitingStatus: Set<string>;
    /**
     * The stages of work in flight, asked for results and a dataset: the stages carrying `live`.
     */
    liveStages: Set<string>;
    /** The stages that should carry a venue, the stages carrying `placed`. */
    placedStages: Set<string>;
    /**
     * The words a finding names a stage by: the `label` of its row of `stages:` when that is a text
     * that is not empty, and the stage word itself otherwise.
     */
    stageLabel: (stage: string) => string;
    /**
     * The merged config's `stages:` map, which a word block of the hub's `audit:` setting is held
     * against (`blockHolds`).
     */
    stages: unknown;
    /** The tiers the research rules leave alone, `research_audit.skip_tiers`. */
    skipTiers: Set<string>;
    /** The stages of done or closed work, the stages carrying `terminal`. */
    terminalStages: Set<string>;
    /**
     * The chips that put a project on a chip lane of the Focus board, the `chips` of the rows of
     * `focus_lanes`, which a project at a terminal stage does not carry.
     */
    laneChips: Set<string>;
    /** The rows of `roles:`, highest first, which a project's role is read by. */
    roles: Role[];
    /**
     * The ids of the boards of `boards:` that take a project, in the file's order, with the ids
     * of the user, the person the key `self` of the primary hub's `local.yml` names.
     */
    boardsOf: (project: Project, self: ReadonlySet<Id>) => string[];
    /** The stages that should have a public entry on the website, the stages carrying `public`. */
    publicStages: Set<string>;
    /** The stages of private negative results, the stages carrying `negative`. */
    negativeStages: Set<string>;
    /** The stages of dead ends, the stages carrying `dead_end`. */
    deadEndStages: Set<string>;
};

/** A list written `['a', 'b']`, the form an audit message quotes a list in. */
export function printed(items: string[]): string {
    return `[${items.map((item) => `'${item}'`).join(', ')}]`;
}

/**
 * The items of a list that a shape accepts, in the order the list holds them. A value that is no
 * list is refused.
 */
function keeping<T>(shape: z.ZodType<T>) {
    return z.array(z.unknown()).transform((all) =>
        all.flatMap((one) => {
            const kept = shape.safeParse(one);
            return kept.success ? [kept.data] : [];
        })
    );
}

/** A word of a configured list: text with a character in it. */
const wordShape = z.string().min(1);

/** The strings of a configured list, in the order the file writes them. */
const wordListShape = keeping(wordShape);

/** A field that is one name or a list of names: the names in it, and none for anything else. */
export const namesShape = z
    .union([wordListShape, wordShape.transform((one) => [one])])
    .catch(() => []);

/** A map of any content, answered as it came; `read_limits` is read from its own keys. */
const readLimitsShape = z.custom<Record<string, unknown>>(isMap);

/** A scalar field as the text it reads as, by the shared `scalar`; an absent field reads as ''. */
export const scalarShape = z
    .unknown()
    .optional()
    .transform((value) => scalar(value));

/** A soft limit of `read_limits`: a number. */
const readLimitShape = z.number();

/** One row of `focus_lanes`, for the chips it lists; a row listing none, or no row, lists none. */
const laneChipsShape = z.object({ chips: wordListShape.catch(() => []) }).catch({ chips: [] });

/** The chips the rows of `focus_lanes` list, each once. */
function laneChipsOf(lanes: unknown): Set<string> {
    const rows: unknown[] = Array.isArray(lanes) ? lanes : [];
    return new Set(rows.flatMap((row) => laneChipsShape.parse(row).chips));
}

/** The words a stage is named by, read from the rows of the merged config's `stages:` map. */
function stageLabelOf(config: Record<string, unknown>): (stage: string) => string {
    const stages = byKey(config, 'stages');
    const rows = isMap(stages) ? stages : {};
    return (stage) => {
        const row = byKey(rows, stage);
        return (isMap(row) ? filledText(row.label) : undefined) ?? stage;
    };
}

/**
 * The rules the scan runs under, read out of the merged configuration, and the domains of the
 * portfolio, whose `expectsDatasets` say where a dataset is expected.
 */
export function auditRules(
    config: Record<string, unknown>,
    domains: readonly Domain[] = []
): AuditRules {
    const limits = readLimitsShape.safeParse(config.read_limits);
    const readLimits: Record<string, number> = {};
    for (const [key, value] of Object.entries(limits.success ? limits.data : {})) {
        const limit = readLimitShape.safeParse(value);
        if (limit.success) readLimits[key] = limit.data;
    }
    const flagged = (key: string, flag: string): Set<string> =>
        new Set(wordsWith(config, key, flag));
    return {
        readLimits,
        staleLagDays: focusSetting(config, 'stale_lag_days') ?? 1,
        dataDomains: new Set(
            domains.filter((one) => one.expectsDatasets === true).map((one) => one.id)
        ),
        waitingStatus: flagged('statuses', 'waiting'),
        liveStages: flagged('stages', 'live'),
        placedStages: flagged('stages', 'placed'),
        stageLabel: stageLabelOf(config),
        stages: config.stages,
        skipTiers: new Set(skippedTiers(config)),
        terminalStages: flagged('stages', 'terminal'),
        laneChips: laneChipsOf(config.focus_lanes),
        roles: rolesOf(config),
        boardsOf: (project, self) => boardsTaking(project, takeContext(config, self)),
        publicStages: flagged('stages', 'public'),
        negativeStages: flagged('stages', 'negative'),
        deadEndStages: flagged('stages', 'dead_end')
    };
}

/** What a signature looks like, which is what the write accepts and what the config may hold. */
export const SIGNATURE = /^[0-9a-f]{12}$/;

/** The signatures of a configured list, in the order the file lists them. */
const signatureListShape = keeping(z.string().regex(SIGNATURE));

/** The signatures the merged config's `audit_ignore:` holds, in the order the list holds them. */
export function mutedSignatures(config: Record<string, unknown>): string[] {
    const held = signatureListShape.safeParse(config.audit_ignore);
    return held.success ? held.data : [];
}

/**
 * One finding's stable short key: sha1 over the scope, the place, the kind, the catalog key of its
 * message and the arguments the rule filled the message with, twelve hex characters of it. The key
 * and the arguments are in it so two gaps on one file are two findings and a changed marker count
 * comes back as a new one; the rendered sentence is not, so rewording a message in the catalog
 * keeps every mute.
 */
export function signatureOf(
    scope: string,
    where: string,
    kind: string,
    key: string,
    args: readonly (string | number)[]
): string {
    const raw = [scope, where, kind, key, ...args.map(String)].join('\u001f');
    return createHash('sha1').update(raw, 'utf8').digest('hex').slice(0, 12);
}

/**
 * What the scan is run over: the hub on disk, its name `root` and whether it is the workspace's
 * primary, its records of the merged snapshot, whose references are resolved across the hubs, the
 * hubs that hold each project key (`held`), which an entry's `related` key resolves against, the
 * ids of the user, the person the key `self` of the primary hub's `local.yml` names, which a
 * project's role and its boards are read with, the rules, the hub's own `audit:` setting
 * (setting.ts) and the words. Each hub is held to its own setting, its website feed included.
 */
export type AuditInput = {
    hub: string;
    root: string;
    primary: boolean;
    projects: Project[];
    collections: Collection[];
    held: Holders;
    self: ReadonlySet<Id>;
    rules: AuditRules;
    setting: AuditSetting;
    catalog: Record<string, string>;
};

/** The catalog sentence a finding is worded by: its key and the arguments that fill it. */
type Sentence = { key: string; args: readonly (string | number)[] };

/** A rule names its sentence by key, so the key and the arguments are what the signature reads. */
export function sentence(key: string, ...args: (string | number)[]): Sentence {
    return { key, args };
}

/**
 * What a rule hands the collector: where the finding is and which catalog sentence says it.
 * `signed` are the arguments the signature reads when they differ from the sentence's, as when a
 * word of the catalog stands in for a value the record lacks, so rewording that word keeps a mute.
 */
export type Raised = Omit<AuditFinding, 'signature' | 'message' | 'hub'> &
    Sentence & { signed?: readonly (string | number)[] };

/**
 * A collector, so a rule adds a finding without knowing how one is keyed or worded. Every finding
 * is marked with the hub `root` it is of, and its file is under that hub's root unless the rule
 * named a repository's. The scope it carries is the rule's own, with no hub in it; the signature
 * reads the scope of a hub other than the `primary` with the hub's name and a colon in front, so a
 * finding of the same place in two hubs has two signatures and a stored mute keeps its hash.
 */
export function collector(
    catalog: Record<string, string>,
    root: string,
    primary: boolean
): {
    found: AuditFinding[];
    add: (f: Raised) => void;
} {
    const found: AuditFinding[] = [];
    return {
        found,
        add({ key, args, signed, ...finding }) {
            const scope = primary ? finding.scope : `${root}:${finding.scope}`;
            found.push({
                ...finding,
                hub: root,
                root: finding.root ?? root,
                message: findingText(catalog, key, ...args),
                signature: signatureOf(scope, finding.where, finding.kind, key, signed ?? args)
            });
        }
    };
}

/** The file of a finding that is about none. */
export const NO_FILE = '';

/**
 * The scope a finding about a project is filed under: the project's hub-relative folder, and the
 * key of its root for a project read from a repository. A repository's folder is an absolute path
 * of this machine, and a muted signature, which reads the scope, is written to the `audit_ignore:`
 * list of the open workspace file's `settings:`, a file that may be tracked and must hold no
 * machine path.
 */
export function scopeOf(project: Pick<Project, 'folder' | 'workspaceFolder'>): string {
    return project.workspaceFolder?.root ?? project.folder;
}

/**
 * Whether a project is of a tier `research_audit.skip_tiers` names (with oculus's own vocab.yml,
 * a personal project), which the research rules do not cover.
 */
export function isPersonal(project: Pick<Project, 'tier'>, rules: AuditRules): boolean {
    return project.tier !== undefined && rules.skipTiers.has(project.tier);
}

/**
 * The path of the file a finding is about, relative to `base`: the path given when it names a file
 * on disk whose real path, links followed, lies below the real path of `base`, and the empty text
 * for a folder, a missing path, a link that leaves `base` and anything outside it.
 */
function fileBelow(base: string, path: string): string {
    const real = realPath(path);
    const root = realPath(base);
    if (real === null || root === null || !below(real, root)) return NO_FILE;
    try {
        if (!statSync(real).isFile()) return NO_FILE;
    } catch {
        return NO_FILE;
    }
    return relative(base, path);
}

/** The hub-relative path of the file a finding is about, and the empty text when it names none. */
export function fileOf(hub: string, path: string): string {
    return fileBelow(hub, path);
}

/**
 * The file a finding about a project is about, as the finding carries it: for a project of the
 * hub, the hub-relative path and no `root`; for a project read from a repository, the path
 * relative to the repository and the key of the root that holds it, which the Audit view opens as
 * `{ root, path }`. A path outside the project's root is no file and carries no `root`.
 */
export function fileIn(
    hub: string,
    project: Pick<Project, 'workspaceFolder'>,
    path: string
): Pick<AuditFinding, 'file' | 'root'> {
    const { workspaceFolder } = project;
    if (workspaceFolder === undefined) return { file: fileOf(hub, path) };
    const file = fileBelow(workspaceFolder.dir, path);
    return file === NO_FILE ? { file } : { root: workspaceFolder.root, file };
}

/** One file's text, and the empty string for anything that cannot be read. */
export function slurp(path: string): string {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return '';
    }
}

/** Whether the path is a directory. */
export function isFolder(path: string): boolean {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

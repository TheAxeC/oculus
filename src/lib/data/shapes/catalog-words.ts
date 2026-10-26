// Layer 1, data. The words oculus's own YAML files are written in, held where both the readers of
// the files (data/sources) and the whole-file shapes the editor's schemas come from
// (data/shapes/catalog-files/) can import them: the controls, headings, sources and forms of the
// options files, and the agents and flags of agents.yml.

import type { AgentId } from '../model/index.ts';

/** The controls an option or a family field is set with, which decide what a value may be. */
export const CONTROLS = [
    'toggle',
    'number',
    'text',
    'long',
    'choice',
    'multi',
    'list',
    'glyph',
    'hue',
    'colour',
    'folder',
    'file',
    'path',
    'parked',
    'records',
    'words'
] as const;

/** One of the words of CONTROLS. */
export type Control = (typeof CONTROLS)[number];

/**
 * What a family's `holds:` may say: `lists`, a key/value family whose every key holds a list of
 * values (or one value), and `record`, a family field with no `key` field whose value is one record
 * of its fields, not a list of them.
 */
export const HOLDS = ['lists', 'record'] as const;

/** One of the words of HOLDS. */
export type Holds = (typeof HOLDS)[number];

/** The subject headings of the Settings view, in the order they are drawn. */
export const HEADINGS = [
    'appearance',
    'editor',
    'terminal',
    'sessions',
    'cluster',
    'boards',
    'rail',
    'presentation',
    'sources',
    'calendar',
    'apps'
] as const;

/** One of the words of HEADINGS. */
export type Heading = (typeof HEADINGS)[number];

/** The lists a choice, a multi or a suggestion box can be drawn from. */
export const SOURCES = [
    'domains',
    'clusters',
    'people',
    'models',
    'languages',
    'arrangements',
    'rail_pages',
    'catalogue_groups',
    'collections',
    'project_stages',
    'project_forms',
    'tiers',
    'roles',
    'stage_flags',
    'status_chips',
    'chip_flags',
    'entry_statuses',
    'ticker_categories',
    'slide_tags',
    'code_themes',
    'views',
    'theme_classes',
    'themes',
    'file_icon_themes',
    'usage_tiers',
    'bundle_ids'
] as const;

/** One of the words of SOURCES. */
export type Source = (typeof SOURCES)[number];

/**
 * The list of flags of each source whose words carry flags, from which a word block (the control
 * `words`) drawn from the source takes its `flags` and `not_flags`. A block drawn from any other
 * source takes no flag.
 */
export const FLAG_SOURCES: Partial<Record<Source, Source>> = {
    project_stages: 'stage_flags',
    status_chips: 'chip_flags'
};

/** The forms a text can be held to, which value-rule.ts says what each looks like. */
export const FORMS = ['program', 'extension', 'bundle_id'] as const;

/** One of the words of FORMS. */
export type Form = (typeof FORMS)[number];

/** The agents the file may name, in the order the composer offers them. */
export const AGENTS: AgentId[] = ['claude', 'codex'];

/**
 * The flags each agent's pickers may pass, from `claude --help` and `codex --help`. A picker that
 * names any other flag is refused, so the file cannot put an arbitrary option on a command line.
 */
export const AGENT_FLAGS: Record<AgentId, string[]> = {
    claude: ['--model', '--effort', '--permission-mode'],
    codex: ['-m', '-c', '-s', '-a']
};

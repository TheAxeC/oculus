// Layer 1, data. The words oculus's own YAML files are written in, held where both the readers of
// the files (data/sources) and the whole-file shapes the editor's schemas come from
// (data/shapes/catalog-files.ts) can import them: the controls, headings, sources and forms of the
// options catalog, and the agents and flags of agents.yml.

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
    'records'
] as const;

/** One of the words of CONTROLS. */
export type Control = (typeof CONTROLS)[number];

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
    'models',
    'languages',
    'arrangements',
    'rail_pages',
    'nav_groups',
    'collections',
    'project_types',
    'status_chips',
    'entry_statuses',
    'slide_tags',
    'code_themes',
    'views',
    'theme_classes',
    'wallpapers',
    'usage_tiers',
    'bundle_ids'
] as const;

/** One of the words of SOURCES. */
export type Source = (typeof SOURCES)[number];

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

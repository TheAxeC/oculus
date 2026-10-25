// Layer 1, data tests. The agents a workspace file's `settings:` lays over oculus's catalog of
// config/catalogs/agents.yml: an agent the workspace names replaces oculus's entry, and every
// question oculus asks before a start stays asked, while a value the workspace adds, or whose
// passed value or picker flag it changes, is asked about too. GET /api/agents answers the merged
// value. The workspace file is given as text, so no file is read for it.

import { describe, expect, it } from 'vitest';
import { localDefaults, engineDir } from '../../../../../src/lib/data/sources/config.ts';
import type { AgentChoices } from '../../../../../src/lib/data/model/model-agents.ts';
import {
    configAgents,
    handleAgents
} from '../../../../../src/lib/server/machine/pty/start/compose.ts';
import {
    OCULUS,
    WORKSPACE_FILE as FILE,
    findingLines,
    readerFindings,
    withSettings
} from './layers-fixture.ts';

/**
 * The merge of oculus's files and a workspace file setting Claude's picker `name` to `values`,
 * passed after `flag` with `fallback` as its default.
 */
function withPicker(name: string, flag: string, fallback: string, values: string[]) {
    const rows = values.map((row) => `                - ${row}\n`).join('');
    const text = [
        '  agents:',
        '    claude:',
        '      label: Claude',
        '      lists:',
        `        ${name}:`,
        '          label: Permissions',
        `          flag: ${flag}`,
        `          default: ${fallback}`,
        '          values:',
        ''
    ].join('\n');
    return withSettings(text + rows);
}

/** The merge of oculus's files and a workspace file setting Claude's picker `mode` to `values`. */
function withMode(values: string[]) {
    return withPicker('mode', '--permission-mode', 'manual', values);
}

/** Each value of Claude's picker `name` as `id:pass`, with `:asked` for one asked about first. */
function modeValues(agents: AgentChoices[], name = 'mode'): string[] {
    const claude = agents.find((one) => one.agent === 'claude');
    const mode = claude?.lists.find((list) => list.key === name);
    return (mode?.values ?? []).map(
        (one) => `${one.id}:${one.pass}${one.confirm === true ? ':asked' : ''}`
    );
}

/** The findings of the config's readers about the workspace file, as `file | key | message`. */
function readerSaid(read: ReturnType<typeof withSettings>): string[] {
    return findingLines(readerFindings(read).filter((one) => one.file === FILE));
}

describe("the agents a workspace lays over oculus's", () => {
    it('keeps oculus asking about a value the workspace writes without confirm', () => {
        const read = withMode([
            '{ id: manual, label: M, pass: manual }',
            '{ id: bypassPermissions, label: B, pass: bypassPermissions }'
        ]);
        expect(read.findings).toEqual([]);
        expect(modeValues(configAgents(read.config))).toEqual([
            'manual:manual',
            'bypassPermissions:bypassPermissions:asked'
        ]);
    });

    it('asks about a value oculus lacks and one whose passed value differs, and not about a new label', () => {
        const read = withMode([
            '{ id: manual, label: M, pass: manual }',
            '{ id: yolo, label: Yolo, pass: bypassPermissions }',
            '{ id: plan, label: Plan, pass: dontAsk }',
            '{ id: dontAsk, label: Never ask, pass: dontAsk }'
        ]);
        expect(read.findings).toEqual([]);
        expect(modeValues(configAgents(read.config))).toEqual([
            'manual:manual',
            'yolo:bypassPermissions:asked',
            'plan:dontAsk:asked',
            'dontAsk:dontAsk'
        ]);
    });

    it('asks about every value of a picker whose flag differs from oculus, one oculus lacks among them', () => {
        const read = withPicker('depth', '--effort', 'low', ['{ id: low, label: Low, pass: low }']);
        expect(read.findings).toEqual([]);
        expect(modeValues(configAgents(read.config), 'depth')).toEqual(['low:low:asked']);
    });

    it('leaves out a value its flag cannot pass, with a finding naming the workspace file', () => {
        const read = withMode([
            '{ id: manual, label: M, pass: manual }',
            '{ id: other, label: O, pass: other }'
        ]);
        expect(modeValues(configAgents(read.config))).toEqual(['manual:manual']);
        expect(readerSaid(read)).toEqual([
            `${FILE} | settings.agents.claude | settings.agents.claude: other cannot follow its flag; the value is left out`
        ]);
    });

    it('answers GET /api/agents with the merged value', async () => {
        const read = withMode([
            '{ id: manual, label: M, pass: manual }',
            '{ id: yolo, label: Yolo, pass: bypassPermissions }'
        ]);
        const response = handleAgents(
            new Request('http://127.0.0.1/api/agents'),
            engineDir(),
            localDefaults(),
            read.config
        );
        const answer = (await response.json()) as { agents: AgentChoices[] };
        expect(modeValues(answer.agents)).toEqual([
            'manual:manual',
            'yolo:bypassPermissions:asked'
        ]);
        const shipped = handleAgents(
            new Request('http://127.0.0.1/api/agents'),
            engineDir(),
            localDefaults(),
            OCULUS
        );
        const oculus = (await shipped.json()) as { agents: AgentChoices[] };
        expect(modeValues(oculus.agents)).toContain('bypassPermissions:bypassPermissions:asked');
        expect(modeValues(oculus.agents)).toContain('plan:plan');
    });
});

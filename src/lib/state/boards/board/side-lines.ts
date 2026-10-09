// Layer 2, client state. The ticker lines of the live side projects: a deadline, the follow-ups
// that are due and the pending subtasks, built from the same builders as a research project's
// lines. A side project is live when its status row does not carry `live: false`, and a project
// that is not live draws no line. Every line carries the side project's manifest, which is what a
// press on it opens, and a target whose id is the project's `side:<slug>` or `root:<key>` id, which
// is what its buttons write.

import type { Snapshot } from '../../../data/model/index.ts';
import { daysUntil } from './index.ts';
import { focusLabel, setting, snoozed } from '../focus.ts';
import { manifestTarget, sideLive } from './personal.ts';
import { GLYPHS, dueFollowups, item, subtaskLines, type TickerItem } from './ticker-lines.ts';

/**
 * The lines of the live side projects, split as the ticker needs them. `dated` holds the deadlines
 * inside the horizon, `overdue` the ones behind, `notes` every due follow-up with its days, and
 * `subtasks` every pending checklist line, dated or not. A line that is snoozed is on `asleep`.
 */
export type SideLines = {
    overdue: TickerItem[];
    dated: TickerItem[];
    notes: { days: number | null; line: TickerItem }[];
    subtasks: TickerItem[];
    asleep: TickerItem[];
};

/** The lines of every live side project of the snapshot. */
export function sideLines(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number
): SideLines {
    const horizon = setting(config, 'deadline_horizon_days', 90);
    const labelMode = config.focus_label_mode;
    const out: SideLines = { overdue: [], dated: [], notes: [], subtasks: [], asleep: [] };
    for (const project of Object.values(snapshot.entities.personal)) {
        if (!sideLive(project, config)) continue;
        const label = focusLabel(project, labelMode);
        const side = manifestTarget(project);

        const days = daysUntil(project.deadline ?? '', now);
        if (days !== null && days <= horizon) {
            const line = item('side', GLYPHS.side, label, days, {
                side,
                target: { kind: 'manifest', id: project.id }
            });
            if (snoozed(project.snooze, now)) out.asleep.push({ ...line, snoozed: true });
            else if (days < 0) out.overdue.push({ ...line, glyph: GLYPHS.overdue });
            else out.dated.push(line);
        }

        for (const { note, days: due } of dueFollowups(project.followups ?? [], now)) {
            out.notes.push({
                days: due,
                line: item('followup', GLYPHS.followup, `${label} - ${note.do}`, due, {
                    side,
                    target: { kind: 'followup', id: project.id }
                })
            });
        }

        for (const line of subtaskLines(
            project.subtasks ?? [],
            label,
            '',
            now,
            { side },
            { kind: 'manifest', id: project.id }
        )) {
            if (line.snoozed) out.asleep.push(line);
            else out.subtasks.push(line);
        }
    }
    return out;
}

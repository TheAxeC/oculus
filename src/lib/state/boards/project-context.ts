// Layer 2, client state. The plain-text project context copied from a card. It is pure over one
// project and one snapshot, so the clipboard action and its tests share the exact same assembly.

import type { Project, Snapshot } from '../../data/model.ts';

/** A venue's compact catalogue name, or nothing when the project names none the snapshot holds. */
function venue(project: Project, snapshot: Snapshot): string {
    const found =
        project.venueId === undefined ? undefined : snapshot.entities.venues[project.venueId];
    if (found === undefined) return project.venue ?? '';
    const short = found.short?.trim() ?? '';
    return short === '' ? found.name : short;
}

/** Add one scalar field only when it has content. */
function scalar(lines: string[], name: string, value: string | undefined): void {
    if (value !== undefined && value !== '') lines.push(`${name}: ${value}`);
}

/** Add one list field in the same Markdown form a project manifest uses. */
function list(lines: string[], name: string, values: string[]): void {
    if (values.length === 0) return;
    lines.push('', `${name}:`, ...values.map((value) => `- ${value}`));
}

/** The project fields a pasted chat needs, with absent fields omitted rather than invented. */
export function contextText(project: Project, snapshot: Snapshot): string {
    const lines = [`# ${project.title}`, `id: ${project.id}`];
    scalar(lines, 'type', project.type);
    if (project.chips.length > 0) scalar(lines, 'status', project.chips.join(', '));
    scalar(lines, 'venue', venue(project, snapshot));
    scalar(lines, 'deadline', project.deadline);
    scalar(lines, 'eli5', project.eli5);
    list(lines, 'results', project.results);
    scalar(lines, 'next', project.next);
    scalar(lines, 'latest', project.latest);
    scalar(lines, 'folder', project.folder);
    return lines.join('\n');
}

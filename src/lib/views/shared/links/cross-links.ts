// Layer 3, shared view support. Project cross-links gathered by the member's own project type,
// apart from the partial so the grouping can be read without a rendering.

import type { CrossGroup as Group } from '$lib/state/boards/collection';

/** One group's members by their own project type, in the order the members are in. */
export function byType(group: Group): { type: string; members: Group['members'] }[] {
    const held = new Map<string, Group['members']>();
    for (const member of group.members) {
        const found = held.get(member.type);
        if (found === undefined) held.set(member.type, [member]);
        else found.push(member);
    }
    return [...held].map(([type, members]) => ({ type, members }));
}

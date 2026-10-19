// Layer 3, primitive. Tab and Escape in the editor: Tab inserts indentation, as in VS Code, and an
// Escape the editor did not take (nothing of Monaco's was open to close) arms the next Tab or
// Shift+Tab to move the focus out of the editor as Tab does anywhere else, so the keyboard is
// never held there. Any other key disarms it; a modifier pressed on its own does not, since
// Shift+Tab starts with Shift.
//
// The editor reads each key twice: before Monaco (`armBefore`, `leaves`), where a Tab that leaves
// is kept from Monaco, and after it (`armAfter`), where an Escape Monaco left untaken arms. Monaco
// stops a key it took from going further, so an Escape it took is never read after it, and the
// read before it has already dropped the arm.

/** What these rules read of a key press. */
export type KeyFacts = {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    defaultPrevented: boolean;
};

/** Keys that are only modifiers, which leave the arm as it was. */
const MODIFIERS: readonly string[] = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'];

/** Whether a press, seen before the editor, moves the focus out: Tab or Shift+Tab while armed. */
export function leaves(armed: boolean, press: KeyFacts): boolean {
    return armed && press.key === 'Tab' && !press.ctrlKey && !press.metaKey && !press.altKey;
}

/** The arm after a press seen before the editor: kept by a modifier alone, dropped else. */
export function armBefore(armed: boolean, press: KeyFacts): boolean {
    return MODIFIERS.includes(press.key) && armed;
}

/** The arm after a press the editor has seen: an Escape it did not take arms it. */
export function armAfter(armed: boolean, press: KeyFacts): boolean {
    return press.key === 'Escape' ? !press.defaultPrevented : armed;
}

/** What these rules read of a key event. */
function factsOf(event: KeyboardEvent): KeyFacts {
    const { key, ctrlKey, metaKey, altKey, defaultPrevented } = event;
    return { key, ctrlKey, metaKey, altKey, defaultPrevented };
}

/** The two listeners an editor's host reads each key with, the arm held between them. */
export type TabOut = {
    /** A key before Monaco reads it: a Tab that leaves is kept from Monaco for the browser. */
    before: (event: KeyboardEvent) => void;
    /** A key Monaco let through: an Escape it did not take arms the next Tab. */
    after: (event: KeyboardEvent) => void;
};

/** The listeners of one editor, disarmed. */
export function tabOut(): TabOut {
    let armed = false;
    return {
        before(event) {
            const press = factsOf(event);
            if (leaves(armed, press)) {
                armed = false;
                event.stopPropagation();
                return;
            }
            armed = armBefore(armed, press);
        },
        after(event) {
            armed = armAfter(armed, factsOf(event));
        }
    };
}

// Layer 4, test helper. A press made while a component renders. A server rendering runs a component
// once, top to bottom, and never again, so a question a press opens (state the view keeps for its
// confirm dialog) is seen only by the parts drawn after the press. This wraps a control's render so
// that the one control a case names is pressed as it is drawn; the dialog, which the views draw
// after their controls, is then rendered holding the question, and the recorder around it keeps
// what it was given. It imports nothing of the modules it wraps, since a vi.mock() factory loads
// it while they are still being made.

import { vi } from 'vitest';

type Props = Record<string, unknown>;
type Draw = (renderer: unknown, props: Props) => unknown;

/**
 * Press the next control of `component` drawn whose props satisfy `match`, once, as it is drawn.
 * `component` is a recorded component; the press lives in the implementation this sets on it,
 * which `clear` and `fresh` of harness.ts put back to the real component before the next case.
 */
export function pressWhenDrawn(component: unknown, match: (props: Props) => boolean): void {
    const mocked = vi.mocked(component as Draw);
    const draw = mocked.getMockImplementation() as Draw;
    let waiting = true;
    mocked.mockImplementation((renderer: unknown, props: Props) => {
        if (waiting && match(props) && typeof props.onclick === 'function') {
            waiting = false;
            (props.onclick as (event: MouseEvent) => void)({} as MouseEvent);
        }
        return draw(renderer, props);
    });
}

/** The factory of a `vi.mock()` for a component whose drawn props a case reads back. */
export async function recorded(
    original: () => Promise<Record<string, unknown>>
): Promise<Record<string, unknown>> {
    const real = await original();
    return { ...real, default: vi.fn(real.default as (...args: unknown[]) => unknown) };
}

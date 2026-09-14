// Layer 4, test helper. The inert callbacks a case hands to a component, a fixture or a double when
// it asserts nothing about the call. They exist once here so a case says "nothing happens on this
// callback" in one word rather than writing an empty function at every prop.

/** A callback whose call the case does not read. */
export const noop = (): void => undefined;

/** The same where the caller awaits what the callback returns. */
export const noopAsync = (): Promise<void> => Promise.resolve();

// Layer 2, client state. The text catalog as the page received it, and the lookup every
// component uses. Nothing here touches the filesystem: the server reads config/text.yml,
// flattens it to dotted keys and ships it as the page's data, and O6 pushes later edits
// over the socket. The browser never fetches the YAML itself.

let catalog: Record<string, string> = {};

/** Install the catalog the page was given. Called once per load, again on every push. */
export function setCatalog(next: Record<string, string>): void {
  catalog = next;
}

/**
 * The string for a dotted key, with {0} and {1} replaced by the arguments.
 * A key that is not in the catalog throws, so a typo fails loudly instead of rendering blank.
 */
export function t(key: string, ...args: (string | number)[]): string {
  const template = catalog[key];
  if (template === undefined) throw new Error(`text key not in config/text.yml: ${key}`);
  return template.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
    const arg = args[Number(index)];
    return arg === undefined ? placeholder : String(arg);
  });
}

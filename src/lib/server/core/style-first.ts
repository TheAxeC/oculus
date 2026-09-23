// Layer 2, server. A Vite plugin that compiles a Svelte component before its style module is
// answered, in development.
//
// vite-plugin-svelte answers a component's style module (`?svelte&type=style&lang.css`) from the
// CSS it kept when it compiled the component. A style module asked for before the component has
// been compiled finds none, the plugin answers nothing, and vite then serves the component's raw
// source as the stylesheet and keeps that answer until the server stops, so the page draws
// unstyled. A page asks for the component first as a rule, but not always: a page reloaded over a
// server that has just started, or SvelteKit collecting a page's inline styles, can ask for the
// style module first.
//
// This plugin runs before the Svelte plugin and has the environment that asked transform the
// component the id names, which compiles it and keeps its CSS on the component's module; it then
// leaves the answer to the Svelte plugin, which now finds the CSS. It is the same on the client
// path and the SSR path, since each environment transforms the component in its own graph. A build
// has no transform request to make and compiles every component before its styles, so there the
// plugin does nothing.

import type { Plugin } from 'vite';

/** The query vite-plugin-svelte gives a component's style module, with or without `inline`. */
const STYLE_MODULE = /[?&]svelte&type=style&lang\.css$/;

/** The address a file is transformed at: its path under the root, or `/@fs` and the whole path. */
export function transformUrl(file: string, root: string): string {
    return file.startsWith(`${root}/`) ? file.slice(root.length) : `/@fs${file}`;
}

/** The plugin; it answers nothing itself, so every style module is still the Svelte plugin's. */
export function componentBeforeStyle(): Plugin {
    return {
        name: 'oculus:component-before-style',
        enforce: 'pre',
        async load(id) {
            if (!STYLE_MODULE.test(id)) return null;
            const environment = this.environment;
            if (!('transformRequest' in environment)) return null;
            const file = id.slice(0, id.indexOf('?'));
            await environment.transformRequest(transformUrl(file, environment.config.root));
            return null;
        }
    };
}

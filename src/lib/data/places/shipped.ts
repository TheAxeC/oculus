// Layer 1, data. The entries of the checkout a release app holds as they are: the package files,
// the one document and the folders the server and Electron run unbuilt. `npm run app:release`
// (src/desktop/release.ts) copies them into the app beside the build output and the production
// packages.

/** The files and folders of the checkout a release app holds, as paths from the checkout. */
export const SHIPPED_SOURCES = [
    'package.json',
    'package-lock.json',
    '.npmrc',
    'README.md',
    'LICENSE',
    'src',
    'config',
    'docs',
    'assets'
] as const;

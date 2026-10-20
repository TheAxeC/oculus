// Layer 2, server. What texlab is answered when it asks for its `texlab` section of
// `workspace/configuration`: the build folders of oculus's LaTeX settings in texlab's terms, and
// the switches that keep texlab from doing what oculus does itself. texlab never builds
// (`build.onSave` is off and no build is requested), never runs ChkTeX, and formats nothing: Format
// Document is the LaTeX formatter of `latex.formatter`.
//
// `latex.out_dir` and `latex.aux_dir` are paths with placeholders, resolved per main file by a
// build (server/content/latex/recipes.ts). texlab reads each folder relative to the folder of the
// root document it works for, which is the main file's folder, so a placeholder maps as follows:
// `%DIR%` is `.`, `%OUTDIR%` is the output folder's own value, and a compound value has each
// placeholder replaced and the result normalised, so `%DIR%/build` is `build`. A value that holds a
// placeholder of the main file itself (`%DOC%` and its kin) names a different folder for each main,
// which texlab cannot be told, so the key is left out and texlab keeps its default.

import { posix } from 'node:path';
import type { LatexBuilding } from '../../../../../data/sources/config/settings/latex.ts';

/** Where texlab reads the folders from: the two settings of the LaTeX building. */
type Folders = Pick<LatexBuilding, 'outDir' | 'auxDir'>;

/** The folders of texlab's `build` section; a key is absent when it keeps texlab's default. */
type Directories = { pdfDirectory?: string; auxDirectory?: string; logDirectory?: string };

/** Any placeholder still in a text after the ones this module replaces. */
const PLACEHOLDER = /%[A-Z_]+%/;

/** A folder setting as texlab reads it, or undefined when it differs per main file. */
function folderOf(value: string, out: string | undefined): string | undefined {
    const filled = value.replaceAll('%DIR%', '.').replaceAll('%OUTDIR%', out ?? '%OUTDIR%');
    if (PLACEHOLDER.test(filled)) return undefined;
    return posix.normalize(filled);
}

/** The build folders of texlab for the building's settings. */
function directoriesOf(building: Folders): Directories {
    const pdf = folderOf(building.outDir, undefined);
    const aux = folderOf(building.auxDir, pdf);
    return {
        ...(pdf === undefined ? {} : { pdfDirectory: pdf }),
        ...(aux === undefined ? {} : { auxDirectory: aux, logDirectory: aux })
    };
}

/** The answer to texlab's request for its `texlab` section. */
export function texlabSettings(building: Folders): Record<string, unknown> {
    return {
        chktex: { onOpenAndSave: false, onEdit: false },
        build: { onSave: false, ...directoriesOf(building) },
        latexFormatter: 'none',
        bibtexFormatter: 'none'
    };
}

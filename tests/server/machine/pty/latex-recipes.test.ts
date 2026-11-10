// Layer 2, server test. The recipe a LaTeX build of a main file runs
// (server/content/latex/recipes.ts `planOf`), as the settings `latex.literate_recipes` and
// `latex.program_recipes` pick it, and the program a Clean runs (`cleanStep`) as
// `latex.clean_path` names it. The settings are the shipped ones read by latexBuild with the
// recipes renamed, so a recipe name written in code instead of read from the settings fails a row.
// No program runs: every program counts as found.

import { describe, expect } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import {
    latexBuild,
    type LatexBuilding
} from '../../../../src/lib/data/sources/config/settings/writing/latex.ts';
import { cleanStep, planOf } from '../../../../src/lib/server/content/latex/recipes.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** The shipped settings with every recipe renamed and the two picks naming the new names. */
function renamed(): LatexBuilding {
    const shipped = latexBuild(loadConfig(engineDir()).config);
    return {
        ...shipped,
        recipes: shipped.recipes.map((one) => ({ ...one, name: `my ${one.name}` })),
        literateRecipes: new Map([['.rnw', 'my Compile Rnw files']]),
        programRecipes: new Map([['xelatex', 'my latexmk (xelatex)']])
    };
}

describe('the recipe a build runs and the program a Clean runs', () => {
    it('picks the recipe the literate and program settings name, by their new names (G13)', () => {
        const bound = scratchDir('oculus-latex-recipes-');
        const recipeOf = (main: string, text: string) => {
            const plan = planOf(renamed(), {
                main: `${bound}/${main}`,
                bound,
                text,
                ask: {},
                force: false,
                found: () => true
            });
            return 'recipe' in plan ? plan.recipe : plan.refused;
        };
        expect([
            recipeOf('a.Rnw', ''),
            recipeOf('b.tex', '% !TEX program = XeLaTeX\n'),
            recipeOf('c.tex', '% !TEX program = lualatex\n'),
            recipeOf('d.tex', '')
        ]).toEqual(['my Compile Rnw files', 'my latexmk (xelatex)', 'my latexmk', 'my latexmk']);
    });

    it('runs latexmk at latex.clean_path, and latexmk on PATH when it is empty (G13)', () => {
        const folders = { out: '/m/out', aux: '/m/aux' };
        expect(cleanStep('/m/main.tex', folders, '/opt/tex/latexmk').program).toBe(
            '/opt/tex/latexmk'
        );
        expect(cleanStep('/m/main.tex', folders, '').program).toBe('latexmk');
    });
});

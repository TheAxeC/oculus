<script lang="ts">
    // Layer 3, shell. The questions that wait on the reader and stand over the whole page, drawn in
    // one place: a project command's approval (CommandAsk), the debugger's (DebugAsk) and a LaTeX
    // build's (LatexAsk). Each draws nothing until its store holds a question.

    import CommandAsk from './CommandAsk.svelte';
    import DebugAsk from './DebugAsk.svelte';
    import LatexAsk from './LatexAsk.svelte';
</script>

<CommandAsk />
<DebugAsk />
<LatexAsk />

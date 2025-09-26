<script module lang="ts">
</script>

<script lang="ts">
    const { children } = $props();
</script>

<svelte:head>
    <title>Архив метеослужбы</title>
</svelte:head>

<div class="app">
    {@render children()}
</div>

<style>
    /* Подключаем CSS-переменные */
    @import '../shared/variables.css';

    :global(body) {
        margin: 0;
        padding: 0;
        font-family: var(--font-family-primary);
        background-color: var(--color-background-secondary);
        color: var(--color-text-primary);
        line-height: var(--line-height-normal);
    }

    .app {
        min-height: 100vh;
        background-color: var(--color-background-primary);
    }

    /* Глобальные стили для улучшения доступности */
    :global(*) {
        box-sizing: border-box;
    }

    :global(a) {
        color: var(--color-secondary);
        text-decoration: none;
        transition: color var(--transition-fast);
    }

    :global(a:hover) {
        color: var(--color-secondary-hover);
    }

    :global(button) {
        font-family: inherit;
        cursor: pointer;
        border: none;
        outline: none;
        transition: all var(--transition-normal);
    }

    :global(button:focus-visible) {
        box-shadow: var(--shadow-focus);
    }

    :global(input, select, textarea) {
        font-family: inherit;
        outline: none;
        transition: all var(--transition-normal);
    }

    :global(input:focus, select:focus, textarea:focus) {
        box-shadow: var(--shadow-focus);
    }

    /* Улучшенная типографика */
    :global(h1, h2, h3, h4, h5, h6) {
        margin: 0;
        font-weight: var(--font-weight-semibold);
        line-height: var(--line-height-tight);
        color: var(--color-text-primary);
    }

    :global(p) {
        margin: 0;
        line-height: var(--line-height-normal);
        color: var(--color-text-secondary);
    }

    /* Улучшенная доступность для скрин-ридеров */
    :global(.sr-only) {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
</style>

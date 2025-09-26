<script lang="ts">
    export let padding: 'sm' | 'md' | 'lg' = 'md';
    export let onClick: (() => void) | undefined = undefined;

    function handleClick(): void {
        if (onClick) {
            onClick();
        }
    }

    $: cardClasses = [
        'card',
        `card--padding-${padding}`
    ].join(' ');
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
    class={cardClasses}
    role={onClick ? 'button' : undefined}
    tabindex={onClick ? 0 : -1}
    on:click={handleClick}
    on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
    <div class="card__content">
        <slot />
    </div>
</div>

<style>
    .card {
        background-color: var(--color-background-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
    }

    .card--padding-sm {
        padding: var(--spacing-sm);
    }

    .card--padding-md {
        padding: var(--spacing-md);
    }

    .card--padding-lg {
        padding: var(--spacing-lg);
    }

    .card__content {
        width: 100%;
    }
</style>

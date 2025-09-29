<script lang="ts">
    import type { Snippet } from 'svelte';


    type CardPadding = 'sm' | 'md' | 'lg';

    interface Props {
        padding?: CardPadding;
        onClick?: () => void;
        children: Snippet;
    }

    const {
        padding = 'md',
        onClick,
        children
    }: Props = $props();

    function handleClick(): void {
        onClick?.();
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            handleClick();
        }
    }

    const cardClasses = $derived([
        'card',
        `card--padding-${padding}`
    ].join(' '));
</script>

<div
    class={cardClasses}
    role={onClick ? 'button' : undefined}
    onclick={handleClick}
    onkeydown={handleKeydown}
>
    <div class="card__content">
        {@render children()}
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

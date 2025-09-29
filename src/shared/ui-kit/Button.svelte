<script lang="ts">
    import type { Snippet } from 'svelte';

    type ButtonVariant = 'primary' | 'secondary';
    type ButtonSize = 'sm' | 'md' | 'lg';

    interface Props {
        href?: string;
        variant?: ButtonVariant;
        size?: ButtonSize;
        active?: boolean;
        disabled?: boolean;
        onClick?: () => void;
        children: Snippet;
    }

    const {
        href,
        variant = 'primary',
        size = 'md',
        active = false,
        disabled = false,
        onClick,
        children
    }: Props = $props();

    const isLink = $derived(href !== undefined);

    function handleClick(event: MouseEvent): void {
        if (disabled) {
            event.preventDefault();
            return;
        }

        onClick?.();
    }

    const buttonClasses = $derived([
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        disabled && 'btn--disabled',
        active && 'btn--active'
    ].filter(Boolean).join(' '));
</script>

{#if isLink}
    <a
        {href}
        class={buttonClasses}
        role="button"
        tabindex={disabled ? -1 : 0}
        onclick={handleClick}
    >
        {@render children()}
    </a>
{:else}
    <button
        type="button"
        class={buttonClasses}
        {disabled}
        onclick={handleClick}
    >
        {@render children()}
    </button>
{/if}

<style>
    .btn {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        text-align: left;
    }

    .btn:focus {
        outline: none;
        box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .btn--sm {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: var(--font-size-sm);
    }

    .btn--md {
        padding: var(--spacing-md) var(--spacing-xl);
        font-size: var(--font-size-md);
    }

    .btn--lg {
        padding: var(--spacing-lg) var(--spacing-2xl);
        font-size: var(--font-size-lg);
    }

    .btn--primary {
        background-color: var(--color-primary);
        color: var(--color-text-inverse);
    }

    .btn--primary:hover:not(.btn--disabled) {
        background-color: var(--color-primary-dark);
    }

    .btn--secondary {
        background-color: var(--color-background-secondary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-primary);
    }

    .btn--secondary:hover:not(.btn--disabled) {
        background-color: var(--color-background-tertiary);
    }

    .btn--disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn--active {
        background-color: var(--color-primary-dark);
        box-shadow: 0 0 0 2px var(--color-primary-light);
        font-weight: 600;
    }
</style>

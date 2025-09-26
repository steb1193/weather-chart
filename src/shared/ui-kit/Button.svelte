<script lang="ts">
    export let variant: 'primary' | 'secondary' = 'primary';
    export let size: 'sm' | 'md' | 'lg' = 'md';
    export let disabled: boolean = false;
    export let active: boolean = false;
    export let href: string | undefined = undefined;
    export let onClick: (() => void) | undefined = undefined;

    const isLink = href !== undefined;

    function handleClick(event: MouseEvent): void {
        if (disabled) {
            event.preventDefault();
            return;
        }

        if (onClick) {
            onClick();
        }
    }

    $: buttonClasses = [
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        disabled ? 'btn--disabled' : '',
        active ? 'btn--active' : ''
    ].filter(Boolean).join(' ');
</script>

{#if isLink}
    <a
        {href}
        class={buttonClasses}
        role="button"
        tabindex={disabled ? -1 : 0}
        on:click={handleClick}
    >
        <slot />
    </a>
{:else}
    <button
        type="button"
        class={buttonClasses}
        {disabled}
        on:click={handleClick}
    >
        <slot />
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

<script lang="ts">
    export let variant: 'success' | 'error' | 'warning' | 'info' = 'info';
    export let dismissible: boolean = true;
    export let title: string | undefined = undefined;

    let visible = true;

    function dismiss(): void {
        visible = false;
    }

    $: alertClasses = [
        'alert',
        `alert--${variant}`
    ].filter(Boolean).join(' ');

    $: alertIcon = {
        success: '✔',
        error: '✖',
        warning: '⚠',
        info: 'ℹ'
    }[variant];
</script>

{#if visible}
    <div class={alertClasses} role="alert" aria-live="polite">
        <div class="alert__content">
            <div class="alert__icon" aria-hidden="true">
                {alertIcon}
            </div>

            <div class="alert__body">
                {#if title}
                    <div class="alert__title">
                        {title}
                    </div>
                {/if}

                <div class="alert__message">
                    <slot />
                </div>
            </div>

            {#if dismissible}
                <button
                    type="button"
                    class="alert__dismiss"
                    aria-label="Закрыть уведомление"
                    on:click={dismiss}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            {/if}
        </div>
    </div>
{/if}

<style>
    .alert {
        display: flex;
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        font-size: var(--font-size-md);
        line-height: 1.5;
    }

    .alert__content {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-md);
        width: 100%;
    }

    .alert__icon {
        font-size: var(--font-size-xl);
        line-height: 1;
    }

    .alert__body {
        flex-grow: 1;
    }

    .alert__title {
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--spacing-xs);
    }

    .alert__dismiss {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        color: inherit;
        opacity: 0.7;
        transition: opacity var(--transition-fast);
    }

    .alert__dismiss:hover {
        opacity: 1;
    }

    .alert--success {
        background-color: var(--color-success-light);
        border: 1px solid var(--color-success);
        color: var(--color-success-dark);
    }

    .alert--error {
        background-color: var(--color-error-light);
        border: 1px solid var(--color-error);
        color: var(--color-error-dark);
    }

    .alert--warning {
        background-color: var(--color-warning-light);
        border: 1px solid var(--color-warning);
        color: var(--color-warning-dark);
    }

    .alert--info {
        background-color: var(--color-info-light);
        border: 1px solid var(--color-info);
        color: var(--color-info-dark);
    }
</style>

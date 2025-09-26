<script lang="ts">
    interface SelectOption {
        value: string | number;
        label: string;
        disabled?: boolean;
        group?: string;
    }

    export let options: SelectOption[] = [];
    export let value: string | number | undefined;
    export let label: string | undefined = undefined;
    export let ariaLabel: string | undefined = undefined;
    export let onChange: ((event: Event) => void) | undefined = undefined;

    const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

    function handleChange(event: Event): void {
        onChange?.(event);
    }

    $: groupedOptions = options.reduce((groups, option) => {
        const group = option.group || 'default';
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(option);
        return groups;
    }, {} as Record<string, SelectOption[]>);

    const selectClasses = 'select';
</script>

<div class="select-group">
    {#if label}
        <label for={selectId} class="select-label">
            {label}
        </label>
    {/if}

    <div class="select-wrapper">
        <select
            {value}
            id={selectId}
            class={selectClasses}
            aria-label={ariaLabel}
            on:change={handleChange}
        >
            {#each Object.entries(groupedOptions) as [groupName, groupOptions] (groupName)}
                {#if groupName !== 'default'}
                    <optgroup label={groupName}>
                        {#each groupOptions as option (option.value)}
                            <option
                                value={option.value}
                                disabled={option.disabled}
                                selected={option.value === value}
                            >
                                {option.label}
                            </option>
                        {/each}
                    </optgroup>
                {:else}
                    {#each groupOptions as option (option.value)}
                        <option
                            value={option.value}
                            disabled={option.disabled}
                            selected={option.value === value}
                        >
                            {option.label}
                        </option>
                    {/each}
                {/if}
            {/each}
        </select>

        <div class="select-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
        </div>
    </div>
</div>

<style>
    .select-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .select-label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
    }

    .select-wrapper {
        position: relative;
    }

    .select {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-md);
        background-color: var(--color-background-primary);
        color: var(--color-text-primary);
        font-family: var(--font-family-primary);
        font-size: var(--font-size-md);
        outline: none;
        transition: all var(--transition-normal);
        box-sizing: border-box;
        appearance: none;
    }

    .select:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .select-icon {
        position: absolute;
        right: var(--spacing-sm);
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--color-text-secondary);
    }
</style>

# CSS Variables Documentation

## Обзор

Проект использует современные CSS Custom Properties (переменные) для обеспечения единообразного дизайна и легкого управления темами.

## Структура файлов

```
src/
├── styles/
│   └── variables.css    # Глобальные CSS-переменные
└── routes/
    └── +layout.svelte   # Подключение переменных в layout
```

## Цветовая палитра

### Основные цвета
```css
--color-primary: #FF0066;           /* Основной цвет приложения */
--color-primary-hover: #e6005c;     /* Hover состояние */
--color-primary-light: #ff4d88;     /* Светлый вариант */
--color-primary-dark: #cc0052;      /* Темный вариант */

--color-secondary: #0099ff;         /* Вторичный цвет */
--color-secondary-hover: #0088ee;   /* Hover состояние */
```

### Семантические цвета
```css
--color-success: #2e7d32;           /* Успех */
--color-error: #d32f2f;             /* Ошибка */
--color-warning: #ed6c02;           /* Предупреждение */
--color-info: #1976d2;              /* Информация */
```

### Нейтральные цвета
```css
--color-text-primary: #333333;      /* Основной текст */
--color-text-secondary: #666666;    /* Вторичный текст */
--color-text-tertiary: #999999;     /* Третичный текст */
--color-text-disabled: #cccccc;     /* Отключенный текст */
--color-text-inverse: #ffffff;      /* Инверсный текст */

--color-background-primary: #ffffff;     /* Основной фон */
--color-background-secondary: #f5f5f5;  /* Вторичный фон */
--color-background-tertiary: #f8f9fa;   /* Третичный фон */

--color-border-primary: #dddddd;    /* Основная граница */
--color-border-secondary: #cccccc;  /* Вторичная граница */
--color-border-focus: #0099ff;      /* Фокус граница */
```

## Размеры и отступы

```css
--spacing-xs: 4px;      /* Очень маленький отступ */
--spacing-sm: 8px;      /* Маленький отступ */
--spacing-md: 12px;     /* Средний отступ */
--spacing-lg: 16px;     /* Большой отступ */
--spacing-xl: 20px;     /* Очень большой отступ */
--spacing-2xl: 24px;    /* Двойной большой отступ */
--spacing-3xl: 30px;    /* Тройной большой отступ */
--spacing-4xl: 40px;    /* Четверной большой отступ */
```

## Радиусы

```css
--radius-sm: 4px;       /* Маленький радиус */
--radius-md: 6px;       /* Средний радиус */
--radius-lg: 8px;       /* Большой радиус */
--radius-xl: 12px;      /* Очень большой радиус */
--radius-full: 50%;     /* Полный радиус (круг) */
```

## Тени

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);     /* Маленькая тень */
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1);      /* Средняя тень */
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.15);     /* Большая тень */
--shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.2);     /* Очень большая тень */
--shadow-focus: 0 0 0 3px rgba(0, 153, 255, 0.2); /* Фокус тень */
```

## Шрифты

```css
--font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;

--font-size-xs: 12px;   /* Очень маленький шрифт */
--font-size-sm: 14px;   /* Маленький шрифт */
--font-size-md: 16px;   /* Средний шрифт */
--font-size-lg: 18px;   /* Большой шрифт */
--font-size-xl: 20px;   /* Очень большой шрифт */
--font-size-2xl: 24px;  /* Двойной большой шрифт */
--font-size-3xl: 30px;  /* Тройной большой шрифт */
--font-size-4xl: 36px;  /* Четверной большой шрифт */

--font-weight-light: 300;      /* Светлый вес */
--font-weight-normal: 400;     /* Обычный вес */
--font-weight-medium: 500;    /* Средний вес */
--font-weight-semibold: 600;   /* Полужирный вес */
--font-weight-bold: 700;       /* Жирный вес */
```

## Переходы и анимации

```css
--transition-fast: 0.15s ease;    /* Быстрый переход */
--transition-normal: 0.2s ease;    /* Обычный переход */
--transition-slow: 0.3s ease;     /* Медленный переход */
--transition-slower: 0.5s ease;    /* Очень медленный переход */
```

## Максимальные ширины

```css
--max-width-sm: 640px;     /* Маленькая ширина */
--max-width-md: 768px;    /* Средняя ширина */
--max-width-lg: 1024px;   /* Большая ширина */
--max-width-xl: 1200px;   /* Очень большая ширина */
--max-width-2xl: 1400px;  /* Двойная большая ширина */
```

## Z-index

```css
--z-dropdown: 1000;        /* Выпадающие меню */
--z-sticky: 1020;          /* Липкие элементы */
--z-fixed: 1030;           /* Фиксированные элементы */
--z-modal-backdrop: 1040;  /* Фон модальных окон */
--z-modal: 1050;           /* Модальные окна */
--z-popover: 1060;         /* Всплывающие элементы */
--z-tooltip: 1070;         /* Подсказки */
```

## Компонент-специфичные переменные

### Кнопки
```css
--button-padding-sm: var(--spacing-sm) var(--spacing-md);
--button-padding-md: var(--spacing-md) var(--spacing-xl);
--button-padding-lg: var(--spacing-lg) var(--spacing-2xl);
```

### Селекты
```css
--select-padding: var(--spacing-sm) var(--spacing-md);
--select-border-width: 2px;
```

### Графики
```css
--chart-grid-color: #009933;      /* Цвет сетки графика */
--chart-line-color: var(--color-primary);  /* Цвет линии графика */
--chart-text-color: var(--color-secondary); /* Цвет текста графика */
```

## Темы

### Темная тема
Автоматически применяется при `prefers-color-scheme: dark`:

```css
@media (prefers-color-scheme: dark) {
    :root {
        --color-text-primary: #ffffff;
        --color-text-secondary: #cccccc;
        --color-background-primary: #121212;
        --color-background-secondary: #1e1e1e;
        /* ... и другие переменные */
    }
}
```

### Высокий контраст
Автоматически применяется при `prefers-contrast: high`:

```css
@media (prefers-contrast: high) {
    :root {
        --color-border-primary: #000000;
        --color-text-secondary: #000000;
        --shadow-focus: 0 0 0 3px #000000;
    }
}
```

### Уменьшенная анимация
Автоматически применяется при `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
    :root {
        --transition-fast: 0.01ms;
        --transition-normal: 0.01ms;
        --transition-slow: 0.01ms;
    }
}
```

## Утилитарные классы

В файле `variables.css` также определены утилитарные классы:

### Отступы
```css
.p-xs, .p-sm, .p-md, .p-lg, .p-xl  /* padding */
.m-xs, .m-sm, .m-md, .m-lg, .m-xl  /* margin */
```

### Цвета текста
```css
.text-primary, .text-secondary, .text-tertiary
.text-error, .text-success, .text-warning, .text-info
```

### Цвета фона
```css
.bg-primary, .bg-secondary, .bg-tertiary
.bg-error, .bg-success, .bg-warning, .bg-info
```

### Тени
```css
.shadow-sm, .shadow-md, .shadow-lg, .shadow-xl
```

### Радиусы
```css
.rounded-sm, .rounded-md, .rounded-lg, .rounded-xl, .rounded-full
```

### Переходы
```css
.transition-fast, .transition-normal, .transition-slow
```

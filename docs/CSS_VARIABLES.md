# CSS Variables Documentation

## Обзор

Проект использует современные CSS Custom Properties (переменные) для обеспечения единообразного дизайна и легкого управления темами.

## Структура файлов

```
src/
├── shared/
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
```

## Радиусы

```css
--radius-sm: 4px;       /* Маленький радиус */
--radius-md: 6px;       /* Средний радиус */
--radius-full: 50%;     /* Полный радиус (круг) */
```

## Тени

```css
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.15);     /* Большая тень */
```

## Шрифты

```css
--font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

--font-size-sm: 14px;   /* Маленький шрифт */
--font-size-md: 16px;   /* Средний шрифт */
--font-size-lg: 18px;   /* Большой шрифт */
--font-size-xl: 20px;   /* Очень большой шрифт */

--font-weight-medium: 500;    /* Средний вес */
--font-weight-bold: 700;       /* Жирный вес */
```

## Переходы и анимации

```css
--transition-fast: 0.15s ease;    /* Быстрый переход */
--transition-normal: 0.2s ease;    /* Обычный переход */
```

## Максимальные ширины

```css
--max-width-xl: 1200px;   /* Очень большая ширина */
```

## Z-index

```css
--z-sticky: 1020;          /* Липкие элементы */
```

## Размеры графика

```css
--chart-width: 1200px;    /* Ширина canvas графика */
--chart-height: 600px;    /* Высота canvas графика */
```

## Темы

### Темная тема
Автоматически применяется при `prefers-color-scheme: dark`:

```css
@media (prefers-color-scheme: dark) {
    :root {
        --color-text-primary: #f8f9fa;
        --color-text-secondary: #adb5bd;
        --color-text-disabled: #6c757d;

        --color-background-primary: #212529;
        --color-background-secondary: #343a40;
        --color-background-tertiary: #495057;

        --color-border-primary: #495057;
        --color-border-light: #343a40;
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
    }

    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

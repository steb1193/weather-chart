# Feature-Sliced Design Architecture

## Обзор

Проект построен с использованием Feature-Sliced Design (FSD) - методологии для структурирования фронтенд приложений.

## Принципы FSD

### 1. Слои (Layers)
Код организован в горизонтальные слои по техническому назначению:

- **App** - инициализация приложения
- **Pages** - композиция виджетов для страниц  
- **Widgets** - композитные блоки UI
- **Features** - бизнес-функции
- **Entities** - бизнес-сущности
- **Shared** - переиспользуемый код

### 2. Слайсы (Slices)
Внутри слоев код разделен на вертикальные слайсы по бизнес-доменам:

- `weather-chart` - график погоды
- `year-range` - выбор диапазона годов
- `weather-page` - страница приложения
- `weather-data` - управление данными

### 3. Сегменты (Segments)
Внутри слайсов код разделен по техническому назначению:

- `ui/` - UI компоненты
- `model/` - модели и состояние
- `api/` - API слой
- `lib/` - утилиты

## Структура проекта

```
src/
├── entities/             # Entities layer
│   ├── weather-data/     # Слайс: данные погоды
│   │   ├── WeatherDataService.ts
│   │   ├── utils.ts
│   │   └── index.ts
│   ├── year-range/       # Слайс: диапазон годов
│   │   ├── yearRange.ts
│   │   └── index.ts
│   └── index.ts
├── features/             # Features layer
│   └── index.ts
├── widgets/              # Widgets layer
│   ├── weather-chart/    # Слайс: график погоды
│   │   ├── Chart.svelte
│   │   ├── chartUtils.ts # Утилиты для отрисовки
│   │   └── index.ts
│   ├── year-range/       # Слайс: выбор диапазона годов
│   │   ├── YearSelectors.svelte
│   │   └── index.ts
│   ├── weather-page/     # Слайс: страница приложения
│   │   ├── WeatherPage.svelte
│   │   └── index.ts
│   └── index.ts
├── shared/               # Shared layer
│   ├── api-layer/        # API сервисы
│   │   ├── WeatherDataAPI.ts
│   │   └── index.ts
│   ├── lib/             # Утилиты и сервисы
│   │   ├── batch-renderer/    # Batch рендеринг графиков
│   │   │   ├── BatchRenderer.ts
│   │   │   └── index.ts
│   │   ├── storage/          # Хранение данных
│   │   │   ├── IndexedDBManager.ts
│   │   │   ├── BatchSaveQueue.ts
│   │   │   └── index.ts
│   │   ├── data-processing.ts # Обработка данных
│   │   └── index.ts
│   ├── ui-kit/          # UI компоненты
│   │   ├── Alert.svelte
│   │   ├── Button.svelte
│   │   ├── Card.svelte
│   │   ├── Select.svelte
│   │   └── index.ts
│   ├── constants.ts     # Константы и типы
│   ├── types.ts        # TypeScript типы
│   ├── errors.ts       # Обработка ошибок
│   ├── variables.css    # CSS переменные
│   └── index.ts
└── routes/              # SvelteKit маршруты
    ├── +layout.svelte
    ├── +layout.ts
    ├── +page.svelte
    ├── +page.ts
    ├── [type]/
    │   └── +page.svelte
    └── type.ts
```

## Правила импортов

### Разрешенные импорты

1. **Из нижележащих слоев** (строго запрещено)
2. **Из вышележащих слоев** (разрешено)
3. **Внутри одного слоя** (разрешено)

### Алиасы

```typescript
'@app'      → src/app
'@widgets'  → src/widgets
'@features' → src/features
'@entities' → src/entities
'@shared'   → src/shared
```

## Слои в деталях

### Entities Layer
- **Назначение**: Бизнес-сущности предметной области
- **Содержит**: Сервисы данных, модели, состояние
- **Примеры**: `WeatherDataService`, `ServerDataLoader`, `YearRange`

### Pages Layer
- **Назначение**: Композиция виджетов для страниц
- **Реализация**: Через SvelteKit routes
- **Примеры**: `+page.svelte`, `[type]/+page.svelte`

### Widgets Layer
- **Назначение**: Композитные блоки UI
- **Содержит**: Комбинации features и entities
- **Примеры**: `WeatherPage`, `Chart`, `YearSelectors`

### Features Layer
- **Назначение**: Бизнес-функции приложения
- **Содержит**: Бизнес-логику, состояние
- **Статус**: Готов для расширения


### Shared Layer
- **Назначение**: Переиспользуемый код
- **Содержит**: UI компоненты, API, утилиты, библиотеки
- **Примеры**: `ui-kit`, `api-layer`, `lib/batch-renderer`, `lib/storage`, `constants`, `types`, `errors`

## Современные технологии

### Svelte 5 Runes
Проект использует современный синтаксис Svelte 5 с runes:
- `$props()` - декларация пропсов
- `$state()` - реактивное состояние
- `$derived()` - вычисляемые значения
- `$effect()` - побочные эффекты

### TypeScript
Строгая типизация для всех компонентов и функций:
- Интерфейсы для пропсов компонентов
- Типы для данных погоды
- Типизированные API методы

### Batch обработка
Оптимизация производительности через:
- BatchRenderer для плавной отрисовки графиков
- BatchSaveQueue для эффективного сохранения в IndexedDB
- Downsampling данных для оптимизации отображения
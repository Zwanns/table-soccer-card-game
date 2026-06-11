# Total Soccer: Mundial

# Тестовый импортер экипировок сборных из Wikipedia и Wikimedia Commons

## 0. Общая задача

Нужно написать отдельный тестовый CLI-импортер на TypeScript.

Импортер должен:

- [ ] получать wikitext страниц трех национальных сборных из русскоязычной Википедии;
- [ ] извлекать параметры домашней и выездной экипировки из шаблона карточки сборной;
- [ ] находить необходимые графические слои на Wikimedia Commons;
- [ ] скачивать их локально;
- [ ] собирать прозрачные PNG-изображения экипировки;
- [ ] сохранять только футболку и шорты;
- [ ] не добавлять гетры;
- [ ] формировать manifest и отчет импорта;
- [ ] сохранять сведения об источниках и лицензиях;
- [ ] не подключать импортированные изображения к игровому UI автоматически.

Это отдельная вспомогательная утилита для разработки.

Не менять игровую механику и сцены Phaser в рамках этой задачи.

---

# 1. Тестовые сборные

Импортер должен поддерживать три команды:

```text
poland
ukraine
brazil
```

Использовать страницы:

```text
Сборная Польши по футболу
Сборная Украины по футболу
Сборная Бразилии по футболу
```

Источник данных:

```text
https://ru.wikipedia.org/w/api.php
```

Источник графических слоев:

```text
https://commons.wikimedia.org/w/api.php
```

Создать конфигурацию:

```ts
export type WikiKitTeamConfig = {
  teamId: string;
  wikipediaTitle: string;
};

export const TEST_WIKI_KIT_TEAMS: WikiKitTeamConfig[] = [
  {
    teamId: 'poland',
    wikipediaTitle: 'Сборная Польши по футболу',
  },
  {
    teamId: 'ukraine',
    wikipediaTitle: 'Сборная Украины по футболу',
  },
  {
    teamId: 'brazil',
    wikipediaTitle: 'Сборная Бразилии по футболу',
  },
];
```

---

# 2. Зафиксированный формат результата

Для каждой сборной создать два файла:

```text
home.png
away.png
```

Итоговая структура:

```text
public/
  kits/
    imported/
      poland/
        home.png
        away.png
      ukraine/
        home.png
        away.png
      brazil/
        home.png
        away.png
      manifest.json
      ATTRIBUTION.json
```

Дополнительно создать диагностический отчет:

```text
reports/
  wiki-kits-import-report.json
```

И визуальную контактную таблицу:

```text
reports/
  wiki-kits-preview.png
```

Контактная таблица должна показывать 6 изображений:

```text
Poland home
Poland away
Ukraine home
Ukraine away
Brazil home
Brazil away
```

---

# 3. Состав итогового изображения

Каждый PNG должен содержать:

```text
футболку;
левый рукав;
правый рукав;
шорты.
```

Не добавлять:

```text
гетры;
человеческую фигуру;
лицо;
руки;
ноги;
голову;
номер игрока;
номинал карты;
белый фон карты;
флаг;
герб;
подпись;
текст.
```

Фон PNG должен быть прозрачным.

Номер игрока и номинал карты будут добавляться позднее программно внутри Phaser.

---

# 4. Размер результата

Использовать портретный прозрачный canvas:

```ts
export const KIT_OUTPUT = {
  width: 384,
  height: 420,
} as const;
```

Композиция:

```text
верхние приблизительно 65%:
  футболка с рукавами;

нижние приблизительно 35%:
  шорты.
```

Гетры не резервировать и не выводить.

Все координаты вынести в отдельную конфигурацию:

```text
scripts/wiki-kits/renderGeometry.ts
```

Не разбрасывать числовые значения по коду рендера.

---

# 5. Технологии

Использовать:

```text
TypeScript
Node.js 20+
native fetch
sharp
tsx
Vitest
```

Добавить dev-зависимости при необходимости:

```bash
npm install --save-dev tsx
npm install sharp
```

Если `tsx` или `sharp` уже установлены, не устанавливать повторно.

Для наложения графических слоев использовать:

```ts
sharp(...).composite(...)
```

Не добавлять Playwright, Puppeteer или браузерную автоматизацию.

Не использовать Python.

---

# 6. Новые команды package.json

Добавить:

```json
{
  "scripts": {
    "import:kits:test": "tsx scripts/wiki-kits/index.ts",
    "import:kits:team": "tsx scripts/wiki-kits/index.ts --team",
    "import:kits:clear-cache": "tsx scripts/wiki-kits/index.ts --clear-cache",
    "test:kits-importer": "vitest run src/tests/wikiKitsImporter.test.ts"
  }
}
```

Поддержать команды:

```bash
npm run import:kits:test
npm run import:kits:test -- --team=poland
npm run import:kits:test -- --force
npm run import:kits:test -- --clear-cache
npm run import:kits:test -- --debug
```

Поведение:

```text
без аргументов:
  импортировать все три тестовые сборные;

--team=poland:
  импортировать только одну сборную;

--force:
  перезаписать существующие PNG;

--clear-cache:
  удалить локальный кэш скачанных файлов;

--debug:
  сохранить промежуточные слои и расширенный лог.
```

---

# 7. Структура новых файлов

Создать:

```text
scripts/
  wiki-kits/
    index.ts
    config.ts
    types.ts
    cli.ts
    wikipediaClient.ts
    commonsClient.ts
    wikitextParser.ts
    kitParamsExtractor.ts
    commonsFileResolver.ts
    downloadCache.ts
    renderGeometry.ts
    kitRenderer.ts
    manifestWriter.ts
    attributionWriter.ts
    previewWriter.ts
    reportWriter.ts
    logger.ts

src/
  tests/
    wikiKitsImporter.test.ts
    fixtures/
      wiki-kits/
        poland.wikitext.txt
        ukraine.wikitext.txt
        brazil.wikitext.txt
```

Создать при первом запуске:

```text
.cache/
  wiki-kits/
    commons/
    intermediate/
```

Не коммитить бинарные кэш-файлы.

Добавить в `.gitignore`:

```text
.cache/wiki-kits/
```

---

# 8. Этап 0. Аудит проекта

## Цель

Перед реализацией проверить текущее состояние репозитория.

## Проверить

```text
package.json
tsconfig.json
vite.config.*
vitest.config.*
.gitignore
public/kits/
src/data/
src/tests/
```

Определить:

1. используется ли ESM;
2. установлен ли `tsx`;
3. установлен ли `sharp`;
4. как запускается Vitest;
5. существует ли папка `public/kits`;
6. нет ли уже импортера или похожих утилит;
7. нет ли конфликтующих имен файлов.

## На этом этапе

Не писать код.

## Итог

Вывести отчет:

```text
что найдено;
какие зависимости уже существуют;
какие зависимости нужно добавить;
какие файлы планируется создать;
есть ли архитектурные риски.
```

После отчета остановиться.

---

# 9. Этап 1. Конфигурация и типы данных

## Цель

Создать типы и конфигурацию без сетевых запросов.

## Создать

```text
scripts/wiki-kits/types.ts
scripts/wiki-kits/config.ts
scripts/wiki-kits/renderGeometry.ts
scripts/wiki-kits/logger.ts
```

## Типы

Добавить:

```ts
export type KitVariant = 'home' | 'away';

export type TeamId = 'poland' | 'ukraine' | 'brazil';

export type WikipediaKitParams = {
  patternLeftArm?: string;
  patternBody?: string;
  patternRightArm?: string;
  patternShorts?: string;

  leftArmColor: string;
  bodyColor: string;
  rightArmColor: string;
  shortsColor: string;

  ignoredSocksColor?: string;
  ignoredSocksPattern?: string;
};

export type TeamKitImportData = {
  teamId: TeamId;
  wikipediaTitle: string;
  home: WikipediaKitParams;
  away: WikipediaKitParams;
};

export type CommonsAssetKind =
  | 'base-body'
  | 'base-left-arm'
  | 'base-right-arm'
  | 'base-shorts'
  | 'pattern-body'
  | 'pattern-left-arm'
  | 'pattern-right-arm'
  | 'pattern-shorts';

export type CommonsAssetMetadata = {
  kind: CommonsAssetKind;
  requestedTitle: string;
  resolvedTitle: string;
  sourceUrl: string;
  descriptionUrl: string;
  author?: string;
  licenseShortName?: string;
  licenseUrl?: string;
  attributionRequired?: boolean;
};

export type RenderedKitManifestEntry = {
  teamId: TeamId;
  variant: KitVariant;
  outputPath: string;
  wikipediaTitle: string;
  wikipediaRevisionId?: number;
  importedAt: string;
  ignoredSocks: true;
  colors: {
    leftArm: string;
    body: string;
    rightArm: string;
    shorts: string;
  };
  patterns: {
    leftArm?: string;
    body?: string;
    rightArm?: string;
    shorts?: string;
  };
  assets: CommonsAssetMetadata[];
  warnings: string[];
};
```

## Валидация цветов

Добавить helper:

```ts
normalizeHexColor(value: string): string;
```

Правила:

```text
принимать 6-значный RRGGBB;
удалять ведущий #;
переводить в uppercase;
отклонять невалидные значения;
не использовать молчаливый fallback без warning.
```

## Тесты

Добавить unit-тесты для:

```text
нормализации цвета;
валидного teamId;
валидного variant;
конфигурации трех команд;
геометрии canvas.
```

После этапа выполнить:

```bash
npm test
npm run build
```

После отчета остановиться.

---

# 10. Этап 2. Клиент Wikipedia API

## Цель

Получать wikitext страницы национальной сборной.

## Создать

```text
scripts/wiki-kits/wikipediaClient.ts
```

## Endpoint

Использовать:

```text
https://ru.wikipedia.org/w/api.php
```

Запрос:

```text
action=query
prop=revisions
titles=<PAGE_TITLE>
rvprop=ids|timestamp|content
rvslots=main
format=json
formatversion=2
```

Пример URL формировать через `URL` и `URLSearchParams`, не конкатенировать строку вручную.

## User-Agent

Каждый запрос должен отправлять информативный заголовок:

```text
User-Agent: TotalSoccerMundialKitImporter/0.1 (local development importer)
```

Если у владельца проекта есть публичный email или URL репозитория, вынести контакт в конфигурацию и добавить его в User-Agent.

Не выдумывать email.

## API

Реализовать:

```ts
export type WikipediaPageWikitext = {
  title: string;
  revisionId: number;
  revisionTimestamp: string;
  content: string;
};

export async function fetchWikipediaPageWikitext(
  title: string,
): Promise<WikipediaPageWikitext>;
```

## Обработка ошибок

Проверять:

```text
HTTP status;
наличие query.pages;
missing page;
наличие revisions;
наличие slots.main.content;
пустой content.
```

При ошибке выводить понятное сообщение:

```text
Failed to load Wikipedia wikitext for "Сборная Польши по футболу"
```

## Ограничения запросов

Выполнять запросы последовательно.

Не отправлять десятки параллельных запросов.

Добавить небольшую паузу между сетевыми запросами:

```ts
REQUEST_DELAY_MS = 150;
```

## Fixtures

Один раз сохранить актуальные wikitext трех страниц в:

```text
src/tests/fixtures/wiki-kits/
```

Unit-тесты не должны зависеть от интернета.

## Тесты

Использовать mock `fetch`.

Проверить:

```text
правильные query params;
User-Agent;
успешное чтение content;
missing page;
отсутствие revisions;
HTTP 500;
невалидный JSON.
```

После этапа выполнить:

```bash
npm test
npm run build
```

После отчета остановиться.

---

# 11. Этап 3. Парсер wikitext

## Цель

Надежно извлекать параметры формы из верхнего шаблона карточки сборной.

## Создать

```text
scripts/wiki-kits/wikitextParser.ts
scripts/wiki-kits/kitParamsExtractor.ts
```

## Важное ограничение

Не использовать один большой regex для всего шаблона.

Wikitext содержит:

```text
вложенные шаблоны;
переносы строк;
ссылки;
вложенные фигурные скобки;
параметры в одной строке;
параметры в нескольких строках.
```

Нужен небольшой depth-aware parser.

## Алгоритм

1. Найти первый шаблон верхнего уровня:

```text
{{Сборная страны по футболу
...
}}
```

2. Сканировать символы последовательно.
3. Учитывать глубину:

```text
{{ -> depth + 1
}} -> depth - 1
```

4. Разделять параметры по символу:

```text
|
```

только если текущая глубина равна глубине главного шаблона.

5. Разделять ключ и значение по первому:

```text
=
```

только на уровне параметра.

6. Выполнять:

```text
trim key;
trim value;
сохранять неизвестные параметры;
не падать на пустых значениях.
```

## Извлечение home

Использовать поля:

```text
pattern_la1
pattern_b1
pattern_ra1
pattern_sh1

leftarm1
body1
rightarm1
shorts1
```

## Извлечение away

Использовать поля:

```text
pattern_la2
pattern_b2
pattern_ra2
pattern_sh2

leftarm2
body2
rightarm2
shorts2
```

## Гетры

Считать, но игнорировать:

```text
pattern_so1
socks1

pattern_so2
socks2
```

Записывать в диагностические данные:

```ts
ignoredSocksColor
ignoredSocksPattern
```

Не использовать их при рендере.

## Нормализация паттернов

Добавить:

```ts
normalizePatternToken(value?: string): string | undefined;
```

Правила:

```text
trim;
пустая строка -> undefined;
удалить ведущий _;
сохранить исходное значение отдельно для отчета при необходимости.
```

Пример:

```text
_pol24h -> pol24h
```

## API

Добавить:

```ts
export function extractTeamKitImportData(
  teamId: TeamId,
  wikipediaTitle: string,
  wikitext: string,
): TeamKitImportData;
```

## Ошибки

Если отсутствуют обязательные цвета:

```text
leftarm
body
rightarm
shorts
```

не продолжать молча.

Выводить ошибку с указанием:

```text
teamId;
variant;
missing fields.
```

## Тесты

Использовать fixtures Польши, Украины и Бразилии.

Проверить:

```text
извлекаются home и away;
обрабатываются параметры в отдельных строках;
обрабатываются параметры в одной строке;
_pol24h нормализуется в pol24h;
пустой pattern_so не ломает парсер;
socks считываются, но отмечаются как ignored;
отсутствующий body вызывает понятную ошибку;
вложенные шаблоны не ломают разбор.
```

После этапа выполнить:

```bash
npm test
npm run build
```

После отчета остановиться.

---

# 12. Этап 4. Клиент Wikimedia Commons

## Цель

Получать URL исходных файлов и лицензионные метаданные.

## Создать

```text
scripts/wiki-kits/commonsClient.ts
scripts/wiki-kits/commonsFileResolver.ts
scripts/wiki-kits/downloadCache.ts
```

## Endpoint

Использовать:

```text
https://commons.wikimedia.org/w/api.php
```

Запрос:

```text
action=query
prop=imageinfo
titles=File:<FILE_TITLE>
iiprop=url|extmetadata
format=json
formatversion=2
```

## API

Добавить:

```ts
export async function resolveCommonsFile(
  fileTitle: string,
): Promise<CommonsAssetMetadata | null>;

export async function downloadCommonsAsset(
  metadata: CommonsAssetMetadata,
): Promise<string>;
```

`downloadCommonsAsset` должен возвращать локальный путь к кэш-файлу.

## Базовые файлы

Найти и скачать:

```text
File:Kit body.svg
File:Kit left arm.svg
File:Kit right arm.svg
File:Kit shorts.svg
```

Если SVG неудобен для обработки, разрешается получить PNG-preview достаточного размера через `thumburl`.

## Файлы паттернов

Для токена:

```text
pol24h
```

искать кандидаты:

```text
File:Kit body pol24h.png
File:Kit left arm pol24h.png
File:Kit right arm pol24h.png
File:Kit shorts pol24h.png
```

Для каждого типа слоя реализовать candidate resolver.

Проверять варианты расширения:

```text
.png
.svg
```

Для шаблонов MediaWiki underscores и пробелы могут нормализоваться. Формировать заголовок аккуратно через API.

## Отсутствующий паттерн

Если паттерн не найден:

```text
не падать;
использовать однотонный базовый цвет;
добавить warning;
указать отсутствующий файл в отчете.
```

## Кэш

Сохранять скачанные файлы:

```text
.cache/wiki-kits/commons/
```

Имя кэш-файла должно быть стабильным и безопасным.

Не скачивать файл повторно, если он уже существует и не передан:

```text
--force
```

## Лицензии

Из `extmetadata` сохранять, если доступны:

```text
Artist;
LicenseShortName;
LicenseUrl;
AttributionRequired;
Credit;
UsageTerms.
```

Сохранять:

```text
sourceUrl;
descriptionUrl;
resolvedTitle.
```

Не считать наличие файла на Commons автоматическим разрешением игнорировать лицензионные условия.

## Тесты

Через mocked fetch проверить:

```text
успешный imageinfo;
missing file;
отсутствующий imageinfo;
thumburl;
url;
extmetadata;
кэширование;
--force;
warning при отсутствующем паттерне.
```

После этапа выполнить:

```bash
npm test
npm run build
```

После отчета остановиться.

---

# 13. Этап 5. Рендерер экипировки

## Цель

Собирать прозрачный PNG из базовых цветов и скачанных паттернов.

## Создать

```text
scripts/wiki-kits/kitRenderer.ts
```

## Подход

Использовать `sharp`.

Собирать изображение слоями:

```text
transparent canvas
-> base left arm with leftArmColor
-> pattern left arm
-> base body with bodyColor
-> pattern body
-> base right arm with rightArmColor
-> pattern right arm
-> base shorts with shortsColor
-> pattern shorts
-> output PNG
```

Не добавлять гетры.

## Геометрия

Все позиции и размеры вынести в:

```text
scripts/wiki-kits/renderGeometry.ts
```

Пример структуры:

```ts
export const KIT_RENDER_GEOMETRY = {
  canvas: {
    width: 384,
    height: 420,
  },

  leftArm: {
    x: 36,
    y: 26,
    width: 92,
    height: 170,
  },

  body: {
    x: 108,
    y: 20,
    width: 168,
    height: 210,
  },

  rightArm: {
    x: 256,
    y: 26,
    width: 92,
    height: 170,
  },

  shorts: {
    x: 112,
    y: 228,
    width: 160,
    height: 160,
  },
} as const;
```

Это ориентировочные значения.

Codex должен визуально проверить результат и при необходимости аккуратно скорректировать координаты.

## Маски

Базовые SVG или PNG использовать как alpha-mask.

Цвет применять программно.

Паттерны накладывать поверх соответствующих деталей.

## Масштабирование

Для сохранения ретро-стиля Википедии использовать конфиг:

```ts
export const KIT_RESIZE_KERNEL = 'nearest';
```

Допускается заменить на более сглаженный kernel после визуальной проверки, но решение зафиксировать в отчете.

## API

Добавить:

```ts
export async function renderKitPng(
  input: {
    teamId: TeamId;
    variant: KitVariant;
    params: WikipediaKitParams;
    assets: ResolvedKitAssets;
  },
  outputPath: string,
): Promise<void>;
```

## Debug

Если передан:

```text
--debug
```

сохранять промежуточные слои:

```text
.cache/wiki-kits/intermediate/<teamId>/<variant>/
```

Например:

```text
01-left-arm-base.png
02-left-arm-pattern.png
03-body-base.png
04-body-pattern.png
05-right-arm-base.png
06-right-arm-pattern.png
07-shorts-base.png
08-shorts-pattern.png
09-composite.png
```

## Тесты

Создать fixture-ассеты минимального размера.

Проверить:

```text
создается PNG;
фон прозрачный;
размер 384 × 420;
гетры отсутствуют;
цвет корпуса применяется;
цвет шорт применяется;
паттерн накладывается;
при отсутствии паттерна используется цвет;
рендер детерминирован.
```

После этапа выполнить:

```bash
npm test
npm run build
```

После отчета остановиться.

---

# 14. Этап 6. Полный pipeline импорта

## Цель

Связать API, парсер, скачивание, рендер и отчеты.

## Создать

```text
scripts/wiki-kits/index.ts
scripts/wiki-kits/cli.ts
scripts/wiki-kits/manifestWriter.ts
scripts/wiki-kits/attributionWriter.ts
scripts/wiki-kits/reportWriter.ts
```

## Pipeline для одной сборной

```text
1. Получить wikitext страницы.
2. Извлечь home и away параметры.
3. Нормализовать цвета и токены паттернов.
4. Разрешить URL базовых Commons-слоев.
5. Разрешить URL паттернов.
6. Скачать отсутствующие слои в кэш.
7. Собрать home.png.
8. Собрать away.png.
9. Добавить manifest entries.
10. Добавить attribution entries.
11. Добавить warnings в report.
```

## Последовательность

Обрабатывать:

```text
poland
ukraine
brazil
```

последовательно.

Не запускать массовое параллельное скачивание.

## Перезапись

Если PNG уже существует:

```text
без --force:
  не перезаписывать;
  вывести SKIPPED;

с --force:
  перезаписать.
```

## Логи

Использовать понятные сообщения:

```text
[wiki-kits] Fetching Wikipedia page: Poland
[wiki-kits] Extracted home and away kit params
[wiki-kits] Resolving Commons assets
[wiki-kits] Pattern not found: Kit shorts ...
[wiki-kits] Using solid-color fallback
[wiki-kits] Rendered: public/kits/imported/poland/home.png
```

## Обработка ошибок

Ошибка одной команды не должна полностью скрывать отчет.

В конце вывести:

```text
SUCCESS
PARTIAL
FAILED
SKIPPED
```

для каждой сборной и каждого комплекта.

Если обязательный этап не выполнен:

```text
не создавать поврежденный PNG;
добавить ошибку в report;
продолжить обработку следующей команды.
```

---

# 15. Этап 7. Manifest и лицензионный отчет

## Цель

Сохранить происхождение импортированных изображений.

## manifest.json

Создать:

```text
public/kits/imported/manifest.json
```

Пример структуры:

```json
{
  "generatedAt": "2026-06-09T12:00:00.000Z",
  "source": "ru.wikipedia.org + commons.wikimedia.org",
  "ignoredSocks": true,
  "teams": {
    "poland": {
      "home": {
        "path": "poland/home.png",
        "wikipediaTitle": "Сборная Польши по футболу",
        "revisionId": 123456,
        "warnings": []
      },
      "away": {
        "path": "poland/away.png",
        "wikipediaTitle": "Сборная Польши по футболу",
        "revisionId": 123456,
        "warnings": []
      }
    }
  }
}
```

## ATTRIBUTION.json

Создать:

```text
public/kits/imported/ATTRIBUTION.json
```

Для каждого использованного Commons-файла сохранить:

```text
resolvedTitle;
descriptionUrl;
sourceUrl;
author;
licenseShortName;
licenseUrl;
attributionRequired;
usedBy.
```

`usedBy` должен содержать список:

```text
poland/home
poland/away
ukraine/home
...
```

## report

Создать:

```text
reports/wiki-kits-import-report.json
```

Сохранить:

```text
время запуска;
аргументы CLI;
результат по каждой команде;
wikipedia revision ID;
извлеченные параметры;
игнорируемые параметры гетр;
найденные файлы;
пропущенные паттерны;
fallback-слои;
ошибки;
warnings.
```

## Важное правило

Не удалять attribution metadata даже для кэшированных файлов.

---

# 16. Этап 8. Контактная таблица для визуальной проверки

## Цель

Автоматически создавать превью всех импортированных комплектов.

## Создать

```text
scripts/wiki-kits/previewWriter.ts
```

## Выходной файл

```text
reports/wiki-kits-preview.png
```

## Макет

```text
3 строки;
2 колонки;
белый или светло-серый технический фон;
слева home;
справа away.
```

Под каждым комплектом добавить техническую подпись:

```text
Poland / home
Poland / away
Ukraine / home
Ukraine / away
Brazil / home
Brazil / away
```

Это только диагностическое изображение.

Подписи не должны попадать в игровые PNG.

## Тесты

Проверить:

```text
контактная таблица создается;
размер стабилен;
есть 6 ячеек;
отсутствующий PNG заменяется placeholder-блоком.
```

---

# 17. Этап 9. Тесты pipeline без интернета

## Цель

Обеспечить надежные тесты без обращения к внешним API во время `npm test`.

## Создать

```text
src/tests/wikiKitsImporter.test.ts
```

## Правило

Обычные тесты не должны выполнять реальные HTTP-запросы.

Использовать:

```text
fixtures wikitext;
mock fetch;
fixture PNG/SVG;
временную папку output;
временную папку cache.
```

## Покрыть

### Парсер

```text
Poland fixture;
Ukraine fixture;
Brazil fixture;
home;
away;
пустые socks;
непустые socks;
параметры в строку;
параметры по строкам.
```

### Wikipedia API client

```text
успех;
404-like missing page;
500;
невалидный JSON;
пустой content.
```

### Commons API client

```text
успех;
missing pattern;
extmetadata;
descriptionUrl;
sourceUrl;
кэш.
```

### Renderer

```text
прозрачность;
размер;
цвета;
паттерны;
нет гетр;
fallback.
```

### Pipeline

```text
генерация двух PNG для команды;
генерация шести PNG для трех команд;
manifest;
ATTRIBUTION;
report;
preview;
--force;
SKIPPED;
PARTIAL.
```

## Отдельный сетевой smoke test

Не включать сетевой smoke test в обычный:

```bash
npm test
```

Создать отдельную команду:

```bash
npm run import:kits:test
```

Именно она обращается к реальным API.

---

# 18. Этап 10. Ручная проверка реального импорта

## Цель

Запустить реальный импорт и проверить результаты.

## Выполнить

```bash
npm run import:kits:test -- --clear-cache
npm run import:kits:test -- --force --debug
npm test
npm run build
```

## Проверить файлы

```text
public/kits/imported/poland/home.png
public/kits/imported/poland/away.png

public/kits/imported/ukraine/home.png
public/kits/imported/ukraine/away.png

public/kits/imported/brazil/home.png
public/kits/imported/brazil/away.png

public/kits/imported/manifest.json
public/kits/imported/ATTRIBUTION.json

reports/wiki-kits-import-report.json
reports/wiki-kits-preview.png
```

## Визуально проверить

```text
есть футболка;
есть оба рукава;
есть шорты;
нет гетр;
фон прозрачный;
цвета соответствуют параметрам;
домашний и выездной комплекты отличаются;
нет лишнего текста;
нет номера;
нет номинала;
нет белого фона;
паттерны не выходят за контуры;
пропущенные паттерны заменяются однотонным fallback.
```

---

# 19. Этап 11. Финальный отчет Codex

После завершения вывести:

```text
1. Список созданных файлов.
2. Список измененных файлов.
3. Установленные зависимости.
4. Схему работы импортера.
5. Какие параметры извлекаются из Wikipedia.
6. Какие параметры гетр намеренно игнорируются.
7. Какие Commons-файлы используются как базовые маски.
8. Какие паттерны были найдены.
9. Какие паттерны не были найдены.
10. Где применен fallback.
11. Результат импорта Poland.
12. Результат импорта Ukraine.
13. Результат импорта Brazil.
14. Результат npm test.
15. Результат npm run build.
16. Путь к контактной таблице.
17. Путь к manifest.json.
18. Путь к ATTRIBUTION.json.
19. Найденные лицензионные ограничения.
20. Рекомендации перед масштабированием на 64 сборные.
```

---

# 20. Что не входит в эту задачу

Не реализовывать:

```text
подключение PNG к CardView;
рендер номера игрока;
рендер номинала карты;
импорт гетр;
импорт вратарских форм;
выбор формы перед матчем;
импорт всех 64 сборных;
автоматическое обновление при старте игры;
hotlinking из игрового клиента;
сетевые запросы из Phaser;
редактор экипировок;
загрузку эмблем федераций;
загрузку логотипов производителей;
облачный cron;
автоматический commit бинарных файлов.
```

---

# 21. Критерии приемки

Задача считается выполненной, если:

- [ ] Импортер написан на TypeScript.
- [ ] Импортер запускается отдельной npm-командой.
- [ ] Обрабатываются Польша, Украина и Бразилия.
- [ ] Для каждой команды генерируются `home.png` и `away.png`.
- [ ] PNG имеют прозрачный фон.
- [ ] PNG содержат футболку, рукава и шорты.
- [ ] Гетры отсутствуют.
- [ ] Параметры гетр не используются при рендере.
- [ ] Wikitext получается через Wikipedia API.
- [ ] URL файлов получаются через Wikimedia Commons API.
- [ ] Сетевые запросы используют информативный User-Agent.
- [ ] Запросы выполняются последовательно.
- [ ] Отсутствующие необязательные паттерны не ломают импорт.
- [ ] При отсутствии паттерна используется однотонный fallback.
- [ ] Скачанные слои кэшируются.
- [ ] Есть `manifest.json`.
- [ ] Есть `ATTRIBUTION.json`.
- [ ] Есть диагностический JSON-отчет.
- [ ] Есть контактная таблица из шести комплектов.
- [ ] Unit-тесты не требуют интернета.
- [ ] `npm test` проходит.
- [ ] `npm run build` проходит.
- [ ] Импортер не изменяет игровую механику.
- [ ] Импортер не подключает ассеты к Phaser автоматически.
- [ ] После каждого этапа Codex останавливается и выводит отчет.

---

# 22. Порядок запуска Codex

Не выполнять всю задачу одним проходом.

Сначала выполнить только:

- [x] Этап 0. Аудит проекта

После согласования отчета последовательно выполнять:

- [x] Этап 1. Конфигурация и типы
- [x] Этап 2. Wikipedia API client
- [x] Этап 3. Парсер wikitext
- [x] Этап 4. Commons API client
- [x] Этап 5. Рендерер
- [x] Этап 6. Полный pipeline
- [x] Этап 7. Manifest и лицензии
- [x] Этап 8. Контактная таблица
- [x] Этап 9. Тесты без интернета
- [x] Этап 10. Реальный импорт
- [ ] Этап 11. Финальный отчет

После каждого этапа:

```bash
npm test
npm run build
```

И после каждого этапа остановиться.

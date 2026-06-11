# Рапорт по внедрению турнирного режима

## Текущий статус

Завершены и проверены:

- Этап 1: доменная модель турнира без UI.
- Этап 2: создание турнира через UI.
- Этап 3: турнирный хаб и групповой этап.
- Этап 4: плей-офф без пенальти.
- Этап 5: серия пенальти.
- Этап 6: командная статистика турнира.
- Этап 7: индивидуальная статистика.
- Этап 8: сохранение и продолжение турнира.
- Этап 9: завершение турнира и полировка.

Основной план `ToDo.md` по турнирному режиму завершен.

## Этап 6

Реализована командная статистика турнира:

- создан `src/tournament/TournamentStats.ts`;
- добавлена агрегация командных показателей по завершенным матчам;
- добавлена вкладка `Stats` в турнирный хаб;
- справа добавлены командные рейтинги `Goals`, `Shots`;
- таблица командной статистики получила прокрутку;
- правая область рейтингов получила прокрутку;
- для сокращенных заголовков таблицы добавлены тултипы;
- колонка `Pen` удалена из таблицы командной статистики, но данные пенальти сохранены в доменной статистике для будущих экранов.

Пенальти не смешиваются с основными голами матча: основной счет остается счетом матча, а серия хранится отдельно в `penaltyShootout`.

## Этап 7

Реализована индивидуальная статистика:

- добавлены явные резолверы состава:
  - `resolveSquadPlayerByCardRank`;
  - `resolveActiveGoalkeeper`;
- создан `src/tournament/TournamentPlayerStats.ts`;
- `createTournamentMatchResultFromGameState` теперь заполняет `playerStats`;
- гол записывается игроку по рангу карты из события `GOAL_SCORED`;
- ассист записывается игроку, который выбил последнего полевого защитника перед голом;
- кандидат на ассист сбрасывается после сейва, штанги, промаха и завершения хода;
- обычный сейв записывается активному вратарю команды, которая защищалась;
- добавлена турнирная агрегация индивидуальной статистики;
- во вкладку `Stats` добавлены индивидуальные рейтинги:
  - `Top scorers`;
  - `Top assists`;
  - `GK saves`.
- правая область вкладки `Stats` переведена на адаптивную сетку рейтингов до трех карточек в строке.
- показатель попаданий в штангу удален из турнирной статистики.

Пенальти по-прежнему хранятся отдельно от обычных голов и сейвов.

## Этап 8

Реализовано сохранение и продолжение турнира:

- создан `src/tournament/TournamentStorage.ts`;
- добавлены `schemaVersion`, `savedAt` и ключ `total-soccer-mundial:tournament`;
- турнир автоматически сохраняется после создания;
- турнир автоматически сохраняется после записи результата матча;
- турнир автоматически сохраняется после завершения серии пенальти;
- поврежденный JSON игнорируется без падения приложения;
- сохранения с неподдерживаемой версией схемы игнорируются;
- завершенный турнир не считается активным сохранением;
- в меню режимов добавлены:
  - `Продолжить турнир`;
  - `Новый турнир`;
  - `Удалить сохранение`;
- при старте нового турнира поверх незавершенного сохранения запрашивается подтверждение.

## Полировка интерфейса турнира

- из турнирной статистики удален показатель `Goalposts`;
- во вкладке `Group Stage` заголовки `P`, `Pts`, `GD`, `G` выровнены по колонкам;
- для заголовков показателей групповых таблиц добавлены тултипы.

## Этап 9

Реализован экран завершения турнира:

- создан `src/scenes/TournamentCompleteScene.ts`;
- экран показывает чемпиона и флаг чемпиона;
- показан финальный матч с итоговым счетом, включая счет пенальти при необходимости;
- добавлен путь чемпиона по сыгранным матчам турнира;
- добавлены лидеры турнира:
  - лучший бомбардир;
  - лучший ассистент;
  - лучший голкипер;
- финал без пенальти после записи результата открывает экран завершения;
- финал после серии пенальти возвращает на экран завершения;
- кнопка `View stats` открывает турнирный хаб сразу на вкладке `Stats`;
- кнопка `New tournament` удаляет сохранение и открывает создание нового турнира.

## Измененные и созданные файлы

Созданы:

- `src/tournament/TournamentStats.ts`
- `src/tournament/TournamentPlayerStats.ts`
- `src/tournament/TournamentStorage.ts`
- `src/tests/tournamentStorage.test.ts`
- `src/scenes/TournamentCompleteScene.ts`

Изменены:

- `src/game/squadResolver.ts`
- `src/game/index.ts`
- `src/main.ts`
- `src/tournament/createTournamentMatchResultFromGameState.ts`
- `src/tournament/index.ts`
- `src/tournament/tournamentTypes.ts`
- `src/scenes/MenuScene.ts`
- `src/scenes/ResultScene.ts`
- `src/scenes/TournamentHubScene.ts`
- `src/scenes/TournamentPenaltyScene.ts`
- `src/scenes/TournamentSetupScene.ts`
- `src/scenes/BootScene.ts`
- `src/data/teamKits.ts`
- `src/tests/tournamentEngine.test.ts`
- `src/tests/tournamentFlow.test.ts`
- `src/tests/gameEngine.test.ts`
- `src/tests/teamKits.test.ts`
- `WORK_REPORT.md`

## Тесты

Добавлены и обновлены тесты:

- командная статистика суммирует голы, пропущенные голы, разницу, удары и сейвы;
- пенальти-показатели не смешиваются с обычной статистикой;
- автор гола попадает в `playerStats`;
- ассист записывается после последнего выбитого полевого защитника;
- ассист не переносится через штангу или сейв;
- сейв записывается правильному вратарю;
- турнирные индивидуальные рейтинги сортируют игроков по голам, ассистам и сейвам.
- турнир сохраняется и загружается из `localStorage`;
- завершенный турнир не показывается как активный сейв;
- битый JSON и неподдерживаемая `schemaVersion` не ломают загрузку;
- сохранение удаляется по запросу.
- `TournamentCompleteScene` зарегистрирована в Phaser config;
- после завершения финала открывается экран завершения турнира;
- экран завершения содержит чемпиона, путь чемпиона, лидеров турнира и переход к статистике.

Результат:

```bash
npm.cmd test
```

- 16 test files passed.
- 192 tests passed.

## Сборка

Результат:

```bash
npm.cmd run build
```

- TypeScript compilation прошла успешно.
- Vite production build прошел успешно.
- Предупреждение Vite о большом JS chunk остается ожидаемым из-за Phaser.

## Хотфикс запуска

Исправлена причина белого экрана при открытии приложения в браузере:

- из обязательной предзагрузки меню убраны отсутствующие опциональные ассеты `menu-ball.png` и `menu-flags.png`;
- загрузчик опциональных форм команд теперь считает файл доступным только если сервер возвращает `image/*`, а не HTML-fallback Vite.

## Что проверить вручную

Минимальная ручная проверка этапа 9:

1. Запустить игру.
2. Создать турнир Cup M.
3. Доиграть или просимулировать турнир до финала.
4. Завершить финал без ничьей и проверить переход на экран завершения.
5. Проверить, что показаны чемпион, флаг чемпиона, финальный счет и путь чемпиона.
6. Проверить блок лидеров `Top scorer`, `Top assist`, `Top goalkeeper`.
7. Нажать `View stats` и проверить переход во вкладку `Stats`.
8. Нажать `New tournament` и проверить переход к созданию нового турнира.
9. Отдельно проверить финал с ничьей и серией пенальти: после серии должен открываться экран завершения.

## Блокеры

Блокеров нет.

Ограничение проверки: Browser-плагин в текущей сессии не смог подключиться к in-app browser, поэтому финальная визуальная проверка выполняется вручную в игре.

Рекомендованная точка продолжения: выполнить ручной smoke-test полного Cup M и затем зафиксировать финальные правки.

---

# Рапорт по импортеру экипировок Wikipedia / Commons

## Текущий статус

Завершены и отмечены в `ToDo.md`:

- Этап 0: аудит проекта.
- Этап 1: конфигурация и типы данных.
- Этап 2: клиент Wikipedia API.
- Этап 3: парсер wikitext и извлечение параметров формы.
- Этап 4: клиент Wikimedia Commons.
- Этап 5: рендерер экипировки.
- Этап 6: полный pipeline импорта.
- Этап 7: manifest и лицензионный отчет.

Следующий этап:

- Этап 8: контактная таблица для визуальной проверки.

## Этап 0. Аудит проекта

Проверено:

- проект использует ESM через `"type": "module"` в `package.json`;
- Node.js соответствует требованию Node 20+;
- Vitest запускается через `npm test`;
- настройки тестов находятся в `vite.config.ts`;
- папка `public/kits/` существует;
- существующего импортера `wiki-kits` или конфликтующих файлов не было;
- на момент аудита `tsx` и `sharp` не были установлены как прямые зависимости проекта;
- `.cache/wiki-kits/` пока не добавлен в `.gitignore`.

Риски:

- `tsconfig.json` включает `src` и `vite.config.ts`, поэтому CLI-файлы из `scripts/` typecheck'ятся через тестовые импорты; при необходимости позже можно добавить отдельную проверку.
- Реальный импорт зависит от внешних API, поэтому обычные unit-тесты должны оставаться полностью offline.

## Этап 1. Конфигурация и типы данных

Созданы:

- `scripts/wiki-kits/types.ts`;
- `scripts/wiki-kits/config.ts`;
- `scripts/wiki-kits/renderGeometry.ts`;
- `scripts/wiki-kits/logger.ts`;
- `src/tests/wikiKitsImporter.test.ts`.

Реализовано:

- типы `KitVariant`, `TeamId`, `WikipediaKitParams`, `TeamKitImportData`, `CommonsAssetMetadata`, `RenderedKitManifestEntry`;
- конфигурация тестовых команд `poland`, `ukraine`, `brazil`;
- guards `isTeamId`, `isKitVariant`;
- helper `normalizeHexColor`;
- базовая геометрия canvas `384 x 420`;
- `KIT_RESIZE_KERNEL = 'nearest'`;
- простой logger с префиксом `[wiki-kits]`.

Тесты:

- нормализация цвета;
- валидные `teamId`;
- валидные `variant`;
- конфигурация трех команд;
- геометрия canvas.

## Этап 2. Клиент Wikipedia API

Создан:

- `scripts/wiki-kits/wikipediaClient.ts`.

Добавлены fixtures:

- `src/tests/fixtures/wiki-kits/poland.wikitext.txt`;
- `src/tests/fixtures/wiki-kits/ukraine.wikitext.txt`;
- `src/tests/fixtures/wiki-kits/brazil.wikitext.txt`.

Реализовано:

- `fetchWikipediaPageWikitext(title)`;
- запрос к `https://ru.wikipedia.org/w/api.php`;
- сборка URL через `URL` и `URLSearchParams`;
- `User-Agent: TotalSoccerMundialKitImporter/0.1 (local development importer)`;
- проверка HTTP status;
- проверка `query.pages`;
- обработка missing page;
- проверка revisions;
- проверка `slots.main.content`;
- проверка пустого content;
- последовательная очередь запросов с задержкой `REQUEST_DELAY_MS = 150`.

Тесты:

- правильные query params;
- User-Agent;
- успешное чтение content;
- missing page;
- отсутствие `query.pages`;
- отсутствие revisions;
- HTTP 500;
- невалидный JSON;
- пустой content.

## Этап 3. Парсер wikitext

Созданы:

- `scripts/wiki-kits/wikitextParser.ts`;
- `scripts/wiki-kits/kitParamsExtractor.ts`.

Реализовано:

- depth-aware parser верхнего шаблона `{{Сборная страны по футболу ... }}`;
- разбор параметров без большого regex по всему шаблону;
- разделение параметров по `|` только на верхнем уровне;
- разделение ключа и значения по первому `=` только на верхнем уровне;
- сохранение неизвестных параметров в `params`;
- поддержка вложенных шаблонов `{{...}}`;
- поддержка ссылок `[[...|...]]`, чтобы `|` внутри ссылки не ломал разбор;
- извлечение home-полей `pattern_la1`, `pattern_b1`, `pattern_ra1`, `pattern_sh1`, `leftarm1`, `body1`, `rightarm1`, `shorts1`;
- извлечение away-полей `pattern_la2`, `pattern_b2`, `pattern_ra2`, `pattern_sh2`, `leftarm2`, `body2`, `rightarm2`, `shorts2`;
- чтение, но не использование, параметров гетр `pattern_so1`, `socks1`, `pattern_so2`, `socks2`;
- запись гетр в диагностические поля `ignoredSocksColor` и `ignoredSocksPattern`;
- `normalizePatternToken`, включая удаление ведущего `_`;
- понятная ошибка при отсутствующих обязательных цветах с указанием `teamId`, `variant` и missing fields.

Тесты:

- извлечение home и away из fixture Польши;
- извлечение home и away из fixture Бразилии с inline-параметрами;
- извлечение ignored socks из fixture Украины;
- нормализация `_pol24h -> pol24h`;
- пустой `pattern_so` не ломает парсер;
- отсутствующий `body` дает понятную ошибку;
- вложенные шаблоны и ссылки не ломают разбор параметров.

## Этап 4. Клиент Wikimedia Commons

Созданы:

- `scripts/wiki-kits/commonsClient.ts`;
- `scripts/wiki-kits/commonsFileResolver.ts`;
- `scripts/wiki-kits/downloadCache.ts`.

Изменены:

- `scripts/wiki-kits/types.ts`;
- `src/tests/wikiKitsImporter.test.ts`;
- `.gitignore`.

Реализовано:

- `resolveCommonsFile(fileTitle)`;
- запрос к `https://commons.wikimedia.org/w/api.php`;
- сборка URL через `URL` и `URLSearchParams`;
- `User-Agent: TotalSoccerMundialKitImporter/0.1 (local development importer)`;
- запрос `action=query`, `prop=imageinfo`, `iiprop=url|extmetadata`;
- поддержка `thumburl` с fallback на `url`;
- чтение `descriptionurl`;
- чтение `Artist`, `LicenseShortName`, `LicenseUrl`, `AttributionRequired`, `Credit`, `UsageTerms`;
- нормализация `File:` title;
- resolver базовых слоев:
  - `File:Kit body.svg`;
  - `File:Kit left arm.svg`;
  - `File:Kit right arm.svg`;
  - `File:Kit shorts.svg`;
- resolver паттернов с кандидатами `.png` и `.svg`;
- warning при отсутствующем необязательном паттерне вместо падения;
- `downloadCommonsAsset(metadata)`;
- стабильные безопасные имена кэш-файлов;
- локальный кэш `.cache/wiki-kits/commons/`;
- повторное использование кэша без `force`;
- повторное скачивание при `force`;
- добавлен `.cache/wiki-kits/` в `.gitignore`.

Тесты:

- успешный `imageinfo`;
- missing file;
- отсутствие `imageinfo`;
- `thumburl`;
- fallback на `url`;
- `extmetadata`;
- построение pattern candidates;
- warning при отсутствующем паттерне;
- кэширование;
- `force`-перезапись.

## Этап 5. Рендерер экипировки

Созданы:

- `scripts/wiki-kits/kitRenderer.ts`;
- `src/types/sharp.d.ts`.

Изменены:

- `scripts/wiki-kits/types.ts`;
- `src/tests/wikiKitsImporter.test.ts`;
- `package.json`;
- `package-lock.json`.

Установленные зависимости:

- `sharp`.

Реализовано:

- `renderKitPng(input, outputPath)`;
- transparent canvas `384 x 420`;
- порядок слоев:
  - base left arm;
  - pattern left arm;
  - base body;
  - pattern body;
  - base right arm;
  - pattern right arm;
  - base shorts;
  - pattern shorts;
- применение базовых SVG/PNG как alpha-mask;
- программное применение цветов к базовым слоям;
- наложение паттернов поверх соответствующих деталей;
- отсутствие рендера гетр;
- `KIT_RESIZE_KERNEL = 'nearest'`;
- опциональная запись debug intermediate layers;
- детерминированный PNG-output.

Тесты:

- создается PNG;
- размер `384 x 420`;
- фон прозрачный;
- область ниже шорт остается прозрачной, гетры не резервируются и не выводятся;
- цвет корпуса применяется;
- цвет шорт применяется;
- паттерн накладывается поверх base layer;
- при отсутствии pattern asset остается solid-color fallback;
- рендер детерминирован;
- debug intermediate layers записываются.

## Этап 6. Полный pipeline импорта

Созданы:

- `scripts/wiki-kits/index.ts`;
- `scripts/wiki-kits/cli.ts`;
- `scripts/wiki-kits/manifestWriter.ts`;
- `scripts/wiki-kits/attributionWriter.ts`;
- `scripts/wiki-kits/reportWriter.ts`.

Изменены:

- `package.json`;
- `package-lock.json`;
- `src/tests/wikiKitsImporter.test.ts`;
- `ToDo.md`;
- `WORK_REPORT.md`.

Установленные зависимости:

- `tsx`.

Добавлены npm scripts:

- `import:kits:test`;
- `import:kits:team`;
- `import:kits:clear-cache`;
- `test:kits-importer`.

Реализовано:

- CLI args parser для `--team`, `--force`, `--clear-cache`, `--debug`;
- последовательная обработка команд `poland`, `ukraine`, `brazil`;
- выбор одной команды через `--team`;
- очистка `.cache/wiki-kits/` через `--clear-cache`;
- skip существующих PNG без `--force`;
- pipeline:
  - получить wikitext;
  - извлечь параметры home / away;
  - разрешить Commons base layers;
  - разрешить Commons pattern layers;
  - скачать слои в cache;
  - собрать `home.png` и `away.png`;
  - добавить manifest entries;
  - добавить attribution entries;
  - добавить warnings / errors в report;
- статусы `SUCCESS`, `PARTIAL`, `FAILED`, `SKIPPED`;
- ошибка одной команды не останавливает весь report;
- базовый `manifest.json`;
- базовый `ATTRIBUTION.json`;
- `reports/wiki-kits-import-report.json`;
- dependency hooks для offline unit-тестов без реальных API.

Тесты:

- разбор CLI args;
- ошибка на неизвестный team;
- ошибка на неизвестный CLI option;
- mocked full pipeline для одной команды;
- проверка вызова base resolver;
- проверка pattern resolver;
- проверка render;
- проверка writers manifest / attribution / report.

## Этап 7. Manifest и лицензионный отчет

Изменены:

- `scripts/wiki-kits/index.ts`;
- `scripts/wiki-kits/manifestWriter.ts`;
- `scripts/wiki-kits/attributionWriter.ts`;
- `src/tests/wikiKitsImporter.test.ts`;
- `ToDo.md`;
- `WORK_REPORT.md`.

Реализовано:

- финальная структура `public/kits/imported/manifest.json`;
- сохранение `generatedAt`;
- сохранение `source`;
- сохранение `ignoredSocks: true`;
- группировка manifest по `teamId` и `variant`;
- сохранение `path`, `wikipediaTitle`, `revisionId`, `warnings`;
- финальная структура `public/kits/imported/ATTRIBUTION.json`;
- агрегация Commons assets по `resolvedTitle`;
- сохранение:
  - `resolvedTitle`;
  - `descriptionUrl`;
  - `sourceUrl`;
  - `author`;
  - `licenseShortName`;
  - `licenseUrl`;
  - `credit`;
  - `usageTerms`;
  - `attributionRequired`;
  - `usedBy`;
- расширенный `reports/wiki-kits-import-report.json`;
- сохранение args CLI;
- сохранение результата по каждой команде;
- сохранение `wikipedia revision ID`;
- сохранение извлеченных параметров формы;
- сохранение игнорируемых параметров гетр;
- сохранение найденных файлов;
- сохранение пропущенных паттернов;
- сохранение fallback-слоев;
- сохранение errors и warnings;
- attribution metadata не теряется при использовании кэшированных файлов, потому что metadata берется из resolved Commons asset, а не из cached binary.

Тесты:

- manifest содержит team / home / path / wikipedia title / revision / warnings;
- attribution содержит `usedBy`;
- report содержит extracted params;
- report содержит resolved files;
- report содержит missing patterns;
- report содержит fallback layers;
- fallback при отсутствующем pattern попадает в warnings/report.

Результат последней проверки:

```bash
npm test
```

- 17 test files passed.
- 229 tests passed.

```bash
npm run build
```

- TypeScript compilation прошла успешно.
- Vite production build прошел успешно.
- Предупреждение Vite о большом JS chunk остается ожидаемым из-за Phaser.

## Этап 8. Контактная таблица для визуальной проверки

Изменены:

- `scripts/wiki-kits/index.ts`;
- `scripts/wiki-kits/previewWriter.ts`;
- `src/tests/wikiKitsImporter.test.ts`;
- `ToDo.md`;
- `WORK_REPORT.md`.

Реализовано:

- добавлен `scripts/wiki-kits/previewWriter.ts`;
- генерируется `reports/wiki-kits-preview.png`;
- контактная таблица имеет стабильный размер;
- макет построен как 3 строки x 2 колонки;
- для каждой команды home расположен слева, away справа;
- подписи `Poland / home`, `Poland / away`, `Ukraine / home`, `Ukraine / away`, `Brazil / home`, `Brazil / away` добавляются только в диагностический preview;
- игровые PNG не изменяются и не получают подписи;
- отсутствующий PNG заменяется placeholder-блоком;
- preview writer подключен к `runWikiKitsImport` после записи JSON-отчета.

Тесты:

- contact sheet создается;
- размер preview стабилен;
- в layout есть 6 ячеек;
- отсутствующий PNG заменяется placeholder-блоком;
- pipeline вызывает preview writer.

Результат последней проверки:

```bash
npm run test:kits-importer
```

- 1 test file passed.
- 39 tests passed.

```bash
npm test
```

- 17 test files passed.
- 231 tests passed.

```bash
npm run build
```

- TypeScript compilation прошла успешно.
- Vite production build прошел успешно.
- Предупреждение Vite о большом JS chunk остается ожидаемым из-за Phaser.

## Этап 9. Тесты pipeline без интернета

Изменены:

- `scripts/wiki-kits/index.ts`;
- `src/tests/wikiKitsImporter.test.ts`;
- `ToDo.md`;
- `WORK_REPORT.md`.

Реализовано:

- `runWikiKitsImport` получил injectable runtime paths для тестов:
  - `outputRoot`;
  - `cacheRoot`;
  - `reportPath`;
  - `previewPath`;
- обычный CLI-путь остался прежним:
  - `public/kits/imported`;
  - `.cache/wiki-kits`;
  - `reports/wiki-kits-import-report.json`;
  - `reports/wiki-kits-preview.png`;
- pipeline-тесты теперь используют временные папки output/cache/report/preview;
- мок download-кэша копирует локальные fixture SVG/PNG в temp cache вместо сетевого скачивания;
- полный offline pipeline test блокирует глобальный `fetch`, чтобы случайный HTTP-запрос сразу ломал тест.

Покрыто тестами:

- полный pipeline для трех команд;
- генерация шести PNG: `poland`, `ukraine`, `brazil` x `home`, `away`;
- запись `manifest.json`;
- запись `ATTRIBUTION.json`;
- запись JSON report;
- запись `wiki-kits-preview.png`;
- временный cache directory передается в download layer;
- существующие PNG получают `SKIPPED` без `--force`;
- при `--force` существующие PNG рендерятся заново;
- `PARTIAL` при отсутствующем необязательном pattern остается покрыт;
- обычные unit-тесты не требуют интернета.

Результат последней проверки:

```bash
npm run test:kits-importer
```

- 1 test file passed.
- 41 tests passed.

```bash
npm test
```

- 17 test files passed.
- 233 tests passed.

```bash
npm run build
```

- TypeScript compilation прошла успешно.
- Vite production build прошел успешно.
- Предупреждение Vite о большом JS chunk остается ожидаемым из-за Phaser.

## Этап 10. Ручная проверка реального импорта

Изменены:

- `scripts/wiki-kits/config.ts`;
- `scripts/wiki-kits/httpRetry.ts`;
- `scripts/wiki-kits/wikipediaClient.ts`;
- `scripts/wiki-kits/commonsClient.ts`;
- `scripts/wiki-kits/downloadCache.ts`;
- `ToDo.md`;
- `WORK_REPORT.md`.

Созданы реальным импортом:

- `public/kits/imported/poland/home.png`;
- `public/kits/imported/poland/away.png`;
- `public/kits/imported/ukraine/home.png`;
- `public/kits/imported/ukraine/away.png`;
- `public/kits/imported/brazil/home.png`;
- `public/kits/imported/brazil/away.png`;
- `public/kits/imported/manifest.json`;
- `public/kits/imported/ATTRIBUTION.json`;
- `reports/wiki-kits-import-report.json`;
- `reports/wiki-kits-preview.png`.

Реальный запуск:

```bash
npm run import:kits:test -- --clear-cache
```

- первый запуск до правки retry получил HTTP 429 от Wikimedia;
- добавлены retry/backoff для HTTP 429;
- добавлена очередь с паузой для Commons API и Commons downloads;
- повторный запуск прошел успешно;
- `poland`: SUCCESS, `home`: SUCCESS, `away`: SUCCESS;
- `ukraine`: SUCCESS, `home`: SUCCESS, `away`: SUCCESS;
- `brazil`: SUCCESS, `home`: SUCCESS, `away`: SUCCESS.

```bash
npm run import:kits:test -- --force --debug
```

- прошел успешно;
- все шесть PNG перерендерены;
- debug intermediate layers записаны в `.cache/wiki-kits/intermediate`;
- итоговый report после debug-запуска содержит SUCCESS для всех команд и комплектов.

Проверка файлов:

- все 10 обязательных файлов существуют;
- все игровые PNG имеют размер `384 x 420`;
- все игровые PNG имеют прозрачные пиксели и непрозрачные пиксели;
- `reports/wiki-kits-preview.png` имеет размер `640 x 874`;
- `manifest.json` содержит команды `poland`, `ukraine`, `brazil`;
- `ATTRIBUTION.json` содержит 28 Commons assets;
- пропущенных паттернов нет;
- fallback layers нет.

Визуальная проверка preview:

- контактная таблица построена 3 x 2;
- home расположен слева, away справа;
- видны футболка, оба рукава и шорты;
- гетры не добавлены отдельным слоем;
- нет номеров игроков;
- нет номиналов карт;
- нет игрового текста внутри PNG;
- подписи присутствуют только в preview;
- белого фона у игровых PNG нет, фон прозрачный.

Результат последней проверки после реального импорта:

```bash
npm test
```

- 17 test files passed.
- 233 tests passed.

```bash
npm run build
```

- TypeScript compilation прошла успешно.
- Vite production build прошел успешно.
- Предупреждение Vite о большом JS chunk остается ожидаемым из-за Phaser.

## Точка продолжения

Продолжить с этапа 11:

- подготовить финальный отчет Codex;
- перечислить созданные и измененные файлы;
- описать схему работы импортера;
- перечислить извлекаемые параметры Wikipedia, игнорируемые параметры гетр, Commons-файлы, найденные паттерны, fallback и лицензионные ограничения;
- дать рекомендации перед масштабированием на 64 сборные.

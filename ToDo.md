````md
# Total Soccer: Mundial
# Добавить AI в серию пенальти

## Цель

Добавить управление AI в серии пенальти:

```text
HUMAN vs HUMAN
HUMAN vs AI
AI vs HUMAN
AI vs AI
```

AI пенальти должен:
- использовать только легальные действия;
- работать через публичный API `PenaltyShootoutEngine`;
- не менять состояние напрямую;
- не подсматривать будущие карты или скрытые данные;
- иметь небольшую вариативность;
- использовать отдельный seeded random stream;
- работать в standalone-режиме пенальти;
- работать в турнирной серии пенальти;
- не смешиваться с AI обычного матча;
- не использовать `AiTurnController` обычного матча;
- не использовать GK-колоду обычного матча.

Уровни сложности не добавлять.

Работу выполнять строго по этапам.

После каждого этапа запускать:

```bash
npm test
npm run build
```

Если менялся UI или runtime:

```bash
npm run dev
```

После каждого этапа остановиться и вывести отчет.

Не переходить к следующему этапу автоматически.

---

# Этап PAI-0 — аудит механики пенальти

## Цель

Изучить существующую реализацию серии пенальти до внесения изменений.

## Проверить

```text
src/scenes/TournamentPenaltyScene.ts
src/scenes/TeamSelectScene.ts
src/game/PenaltyShootoutEngine.ts
src/game/penalty/*
src/scenes/*
src/tests/*
```

Если пути отличаются, найти фактические файлы через поиск по:

```text
PenaltyShootoutEngine
TournamentPenaltyScene
penalty
shootout
```

## Выяснить

```text
1. Где находится PenaltyShootoutEngine.
2. Как устроен penalty state.
3. Какие фазы есть у серии пенальти.
4. Какие действия выполняет бьющая команда.
5. Какие действия выполняет защищающаяся команда.
6. Какие действия выбирает пользователь вручную.
7. Какие методы движка вызываются UI-сценой.
8. Какие методы движка являются публичными.
9. Как определяется результат удара.
10. Используются ли карты, направления удара, кнопки или другие варианты выбора.
11. Как запускаются:
   - standalone-пенальти;
   - турнирные пенальти.
12. Как TeamSelectScene передает выбранные команды в standalone-пенальти.
13. Передается ли controllerType в standalone-пенальти.
14. Передается ли controllerType участников турнира в TournamentPenaltyScene.
15. Какие анимации, sounds и flying messages используются.
16. Какие Phaser timers существуют.
17. Как очищаются timers при shutdown сцены.
18. Какие тесты пенальти уже существуют.
```

## Не менять

Не изменять файлы.

## Отчет

Вывести:

```text
Этап PAI-0 завершен.

Созданные файлы:
- нет

Измененные файлы:
- нет

Фактические файлы пенальти:
- ...

Публичный API PenaltyShootoutEngine:
- ...

Penalty phases:
- ...

Действия атакующей стороны:
- ...

Действия защищающейся стороны:
- ...

Путь данных standalone-пенальти:
- ...

Путь данных турнирных пенальти:
- ...

Передается ли controllerType:
- standalone:
- tournament:

Текущие timers:
- ...

Текущие sounds/messages:
- ...

Рекомендованный минимальный набор файлов для изменения:
- ...
```

После отчета остановиться.

---

# Этап PAI-1 — передать controllerType в серию пенальти

## Цель

Подготовить данные серий пенальти к HUMAN / AI управлению без автоматических действий.

## Использовать существующий тип

Использовать:

```ts
PlayerControllerType =
  | 'HUMAN'
  | 'AI';
```

Не создавать второй тип контроллера.

## Standalone-пенальти

Проверить путь:

```text
TeamSelectScene
->
penalty scene
```

Передавать для обеих команд:

```ts
player1ControllerType: PlayerControllerType;
player2ControllerType: PlayerControllerType;
```

Использовать существующие AI-чекбоксы `TeamSelectScene`.

Если TeamSelectScene работает в режиме standalone-пенальти:
- показывать те же компактные checkbox `AI`;
- по умолчанию оба выключены;
- чекбоксы независимы;
- передавать значения в penalty scene.

## Турнирные пенальти

При запуске турнирной серии передавать:

```ts
homeControllerType: PlayerControllerType;
awayControllerType: PlayerControllerType;
```

или эквивалентные поля текущей архитектуры.

Использовать уже сохраненный:

```text
controllerType
```

участника турнира.

Не создавать отдельный AI-checkbox внутри `TournamentPenaltyScene`.

## Значение по умолчанию

Если controllerType отсутствует:

```ts
'HUMAN'
```

## Не делать

На этом этапе:
- не запускать AI;
- не добавлять timers AI;
- не менять PenaltyShootoutEngine;
- не менять правила пенальти;
- не менять обычный матч;
- не менять AiTurnController обычного матча.

## Тесты

Проверить:

```text
standalone penalties по умолчанию HUMAN vs HUMAN;
standalone HUMAN vs AI передается корректно;
standalone AI vs HUMAN передается корректно;
standalone AI vs AI передается корректно;
tournament penalties получают controllerType home-team;
tournament penalties получают controllerType away-team;
старые вызовы без controllerType нормализуются в HUMAN;
обычные матчи не меняются.
```

## Проверка

```bash
npm test
npm run build
```

После отчета остановиться.

---

# Этап PAI-2 — чистая модель решений Penalty AI

## Цель

Создать отдельную чистую эвристику AI для пенальти без Phaser и timers.

## Создать

```text
src/ai/penaltyAiTypes.ts
src/ai/penaltyAiDecision.ts
src/ai/penaltyAiRandom.ts
src/tests/penaltyAiDecision.test.ts
```

Обновить:

```text
src/ai/index.ts
```

## Важно

Не использовать:

```text
AiTurnController
aiDecision.ts обычного матча
aiHeuristics.ts обычного матча
GK-колоду обычного матча
```

AI пенальти является отдельным модулем.

---

## 1. Тип действия

После аудита адаптировать тип действия к фактическому публичному API `PenaltyShootoutEngine`.

Общий принцип:

```ts
export type PenaltyAiAction =
  | {
      type: 'SELECT_SHOT_ACTION';
      actionId: string;
    }
  | {
      type: 'SELECT_GOALKEEPER_ACTION';
      actionId: string;
    };
```

Если в текущем движке действия называются иначе:
- использовать фактические названия;
- не создавать лишний слой абстракции;
- не менять механику.

Примеры допустимой адаптации:

```text
SELECT_SHOT_CARD
SELECT_GOALKEEPER_CARD
SELECT_SHOT_DIRECTION
SELECT_SAVE_DIRECTION
CONFIRM_SHOT
```

Использовать только реально существующие варианты.

---

## 2. Основной API

Добавить:

```ts
export function choosePenaltyAiAction(
  state: Readonly<PenaltyShootoutState>,
  controllerSide: PenaltySide,
  random: PenaltyAiRandomSource,
): PenaltyAiAction | null;
```

Названия типов адаптировать к текущему движку.

Функция должна:
- быть чистой;
- не мутировать state;
- не мутировать карты;
- не вызывать Phaser;
- не использовать timers;
- не использовать `Math.random()`;
- не менять движок напрямую;
- возвращать одно легальное действие;
- возвращать `null`, если действие AI сейчас не требуется.

---

## 3. Честность AI

AI разрешено использовать только:

```text
текущую penalty phase;
сторону, которая должна сделать выбор;
легальные публичные действия;
текущий счет серии;
номер удара;
историю уже выполненных ударов, если она видна пользователю;
текущие открытые данные penalty state.
```

AI запрещено использовать:

```text
будущие карты;
порядок скрытой penalty deck;
неоткрытые действия HUMAN;
приватные значения движка;
seed другого игрока;
seed shuffle;
результат удара до подтверждения действия;
Math.random().
```

---

## 4. Эвристика

Использовать простую честную стратегию.

### Базовое правило

AI выбирает только среди:

```text
legal actions
```

### Вариативность

Если доступны несколько легальных вариантов:
- выбирать через отдельный seeded random;
- не использовать один и тот же вариант постоянно;
- избегать трех одинаковых действий подряд, если есть альтернативы;
- не создавать идеальную стратегию;
- не пытаться угадывать скрытый выбор HUMAN.

### История

Если penalty state содержит публичную историю:
- разрешается слегка снижать вероятность немедленного повторения предыдущего действия;
- нельзя гарантированно исключать повтор;
- сохранять вариативность.

Рекомендуемый принцип веса:

```text
базовый вес варианта = 1.0;
если этот вариант использован два раза подряд -> вес = 0.45;
если есть альтернативы.
```

Если текущая механика не использует направления или повторяемые варианты:
- сохранить простой seeded-random выбор среди legal actions;
- не придумывать новую механику.

---

## 5. Отдельный random stream

Добавить:

```ts
createPenaltyAiRandom(
  matchSeed,
  side,
)
```

Использовать namespace:

```text
PENALTY_AI
```

Пример идеи:

```ts
`${matchSeed}:PENALTY_AI:${side}`
```

Адаптировать к существующему seeded random API.

Требования:

```text
одинаковый seed -> одинаковые AI-решения;
разные seed могут давать разные решения;
решения penalty AI не меняют shuffle обычной deck;
решения penalty AI не меняют shuffle goalkeeperDeck;
решения penalty AI не меняют обычный AiTurnController random stream.
```

---

## 6. Тесты

Проверить:

```text
choosePenaltyAiAction возвращает только legal action;
choosePenaltyAiAction не мутирует state;
AI не использует Math.random;
AI не читает скрытые данные;
AI возвращает null в неподходящей phase;
AI возвращает null, если сейчас ход HUMAN;
одинаковый seed дает одинаковое решение;
разные seed могут выбрать разные равноценные варианты;
AI избегает трех одинаковых действий подряд при наличии альтернатив;
AI может повторить действие, если альтернатив нет;
обычный AI матча не меняется.
```

## Проверка

```bash
npm test
npm run build
```

После отчета остановиться.

---

# Этап PAI-3 — PenaltyAiController и выполнение AI-действий

## Цель

Подключить penalty AI к визуальной сцене серии пенальти.

## Создать

```text
src/ai/PenaltyAiController.ts
src/tests/penaltyAiController.test.ts
```

Обновить:

```text
src/ai/index.ts
фактическую penalty scene
```

Ожидаемо:

```text
src/scenes/TournamentPenaltyScene.ts
```

Если standalone и tournament используют разные сцены:
- подключить общий `PenaltyAiController` к обеим;
- не дублировать код.

---

## 1. Обязанности PenaltyAiController

Контроллер должен:
- проверить, является ли текущая сторона AI;
- дождаться стабильного UI-состояния;
- поставить один timer;
- вызвать `choosePenaltyAiAction()`;
- передать одно действие в callback сцены;
- не менять state напрямую;
- не создавать два timers одновременно;
- очищать timer при shutdown;
- не действовать после завершения серии.

## API

Реализовать:

```ts
scheduleNextAction(): void;
cancelPendingAction(): void;
destroy(): void;
isPending(): boolean;
```

---

## 2. Задержки

Добавить:

```ts
export const PENALTY_AI_TIMING = {
  beforeShotChoiceMs: 750,
  beforeGoalkeeperChoiceMs: 750,
  afterResultMs: 850,
  jitterMs: 150,
} as const;
```

Допускается корректировка после визуальной проверки.

Требования:
- не использовать `Math.random()`;
- jitter через penalty AI random stream;
- AI не должен действовать мгновенно;
- AI не должен заметно тормозить серию.

---

## 3. Общий UI pipeline HUMAN и AI

В penalty scene вынести общие методы:

```ts
handleShotAction(actionId: string): void;
handleGoalkeeperAction(actionId: string): void;
```

или эквивалентные методы текущей архитектуры.

HUMAN:
```text
клик
->
общий handler
```

AI:
```text
PenaltyAiController
->
общий handler
```

Не дублировать:
- правила;
- анимации;
- sound;
- сообщения;
- переходы фаз.

---

## 4. Блокировка HUMAN-ввода

Если текущую сторону контролирует AI:
- отключить игровые клики HUMAN;
- оставить служебные кнопки доступными, если это безопасно;
- tooltip сохранить при наличии;
- не блокировать сцену полностью.

Если текущую сторону контролирует HUMAN:
- поведение UI остается прежним.

---

## 5. Cleanup

При:

```text
SHUTDOWN
DESTROY
серия завершена
переход на другую сцену
```

вызвать:

```ts
penaltyAiController.destroy()
```

Требования:
- timer удаляется;
- callback не выполняется после выхода;
- повторное открытие сцены не создает старые timers;
- нет двойных действий.

---

## 6. AI vs AI

Поддержать:

```text
AI vs AI
```

Серия должна:
- идти автоматически;
- сохранять анимации;
- сохранять sounds;
- сохранять сообщения;
- корректно доходить до завершения;
- поддерживать дополнительную серию после ничьей, если она существует;
- не зависать.

---

## 7. Не менять

Не менять:

```text
правила PenaltyShootoutEngine;
логику определения гола;
логику определения сейва;
обычный AiTurnController;
обычный GameScene;
обычный goalkeeperDeck;
обычные cards;
tournamentMatchSimulation;
формы;
шрифты;
составы;
```

---

## 8. Тесты

Проверить:

```text
PenaltyAiController не ставит timer для HUMAN;
PenaltyAiController ставит один timer для AI;
не создается второй timer;
после timer выполняется одно действие;
действие выполняется через общий UI handler;
timer удаляется при destroy;
после завершения серии AI не действует;
после shutdown AI не действует;
HUMAN-клик заблокирован во время AI-выбора;
HUMAN-клик работает во время HUMAN-выбора;
AI vs AI выполняет серию до конца;
AI vs AI не зависает в дополнительной серии;
sounds/messages не дублируются.
```

## Проверка

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап PAI-4 — standalone-пенальти с AI

## Цель

Проверить и завершить пользовательский путь standalone-пенальти.

## Что изменить

При необходимости обновить:

```text
src/scenes/TeamSelectScene.ts
standalone penalty scene
связанные тесты
```

## Требования

При выборе standalone-пенальти:
- показывать AI-checkbox для Team 1;
- показывать AI-checkbox для Team 2;
- оба по умолчанию выключены;
- состояния независимы;
- checkbox не меняет выбранную команду;
- значения передаются в penalty scene;
- HUMAN vs HUMAN работает;
- HUMAN vs AI работает;
- AI vs HUMAN работает;
- AI vs AI работает.

Не создавать отдельный экран настроек AI.

## Тесты

Проверить:

```text
standalone penalty checkbox Team 1 работает;
standalone penalty checkbox Team 2 работает;
checkbox по умолчанию выключены;
controllerType передается в penalty scene;
HUMAN vs AI серия завершается;
AI vs HUMAN серия завершается;
AI vs AI серия завершается;
обычный быстрый матч не сломан.
```

## Проверка

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап PAI-5 — турнирные пенальти с AI

## Цель

Подключить AI к турнирной серии пенальти.

## Что изменить

При необходимости обновить:

```text
src/scenes/TournamentHubScene.ts
src/scenes/TournamentPenaltyScene.ts
tournament state types
связанные тесты
```

## Требования

При запуске турнирной серии:
- использовать сохраненный `controllerType` home-team;
- использовать сохраненный `controllerType` away-team;
- не показывать дополнительные AI-checkbox внутри penalty scene;
- не менять controllerType во время серии;
- сохранять существующий переход:
  ```text
  tournament match
  ->
  penalty shootout
  ->
  tournament hub / next round
  ```
- победитель серии должен корректно попадать в турнирный state;
- AI vs AI серия должна завершаться автоматически;
- HUMAN vs AI должна позволять HUMAN делать только свои выборы;
- tournamentMatchSimulation не менять без необходимости.

## Тесты

Проверить:

```text
турнирная серия получает home controllerType;
турнирная серия получает away controllerType;
HUMAN vs HUMAN турнирные пенальти работают;
HUMAN vs AI турнирные пенальти работают;
AI vs HUMAN турнирные пенальти работают;
AI vs AI турнирные пенальти работают;
AI vs AI серия завершается;
победитель сохраняется;
турнир продолжается;
simulated tournament match не сломан.
```

## Проверка

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап PAI-6 — финальная регрессия AI пенальти

## Цель

Проверить совместимость нового penalty AI со всем проектом.

## Запустить

```bash
npm run validate:kits
npm test
npm run build
npm run dev
```

## Проверить standalone-пенальти

```text
HUMAN vs HUMAN
HUMAN vs AI
AI vs HUMAN
AI vs AI
```

Проверить:
- AI делает выбор автоматически;
- HUMAN может делать только свои выборы;
- AI не действует за HUMAN;
- серия завершается;
- дополнительная серия работает;
- sounds работают;
- animations работают;
- messages работают;
- timers очищаются.

## Проверить турнирные пенальти

```text
HUMAN vs HUMAN
HUMAN vs AI
AI vs HUMAN
AI vs AI
```

Проверить:
- controllerType передается из tournament participant;
- AI-checkbox турнира влияют на серию;
- победитель корректно сохраняется;
- турнир продолжается;
- simulation не сломан.

## Проверить изоляцию

Убедиться, что penalty AI не использует:

```text
AiTurnController обычного матча;
aiDecision.ts обычного матча;
GK-колоду обычного матча;
main deck обычного матча;
midfielder logic;
midfield gap;
обычные match events.
```

## Проверить обычный матч

```text
HUMAN vs HUMAN
HUMAN vs AI
AI vs HUMAN
AI vs AI
```

Убедиться, что режим обычного матча не сломан.

## Критерии приемки

Задача завершена, если:

```text
1. Добавлен отдельный penalty AI.
2. Penalty AI использует только legal actions.
3. Penalty AI не смотрит скрытые данные.
4. Penalty AI не использует Math.random.
5. Используется отдельный seeded random stream.
6. HUMAN vs HUMAN пенальти работают.
7. HUMAN vs AI пенальти работают.
8. AI vs HUMAN пенальти работают.
9. AI vs AI пенальти работают.
10. Standalone-пенальти поддерживают AI.
11. Турнирные пенальти поддерживают AI.
12. HUMAN-ввод блокируется только во время AI-выбора.
13. HUMAN и AI используют общий UI pipeline.
14. Timers очищаются.
15. Дополнительная серия не зависает.
16. Обычный AiTurnController не изменен без необходимости.
17. GK-колода обычного матча не используется.
18. Tournament simulation не сломан.
19. npm run validate:kits проходит.
20. npm test проходит.
21. npm run build проходит.
```

## Формат финального отчета

```text
Финальная регрессия AI пенальти завершена.

Созданные файлы:
- ...

Измененные файлы:
- ...

Penalty AI module:
- ...

Используется ли отдельный random stream:
- ...

Использует ли penalty AI Math.random:
- ...

Standalone penalties:
- HUMAN vs HUMAN:
- HUMAN vs AI:
- AI vs HUMAN:
- AI vs AI:

Tournament penalties:
- HUMAN vs HUMAN:
- HUMAN vs AI:
- AI vs HUMAN:
- AI vs AI:

Дополнительная серия:
- ...

Блокировка HUMAN-ввода:
- ...

Cleanup timers:
- ...

Изоляция от обычного AI:
- ...

Изоляция от goalkeeperDeck:
- ...

Tournament simulation:
- ...

Результат npm run validate:kits:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...

Что проверить вручную:
- ...
```

После отчета остановиться.
````

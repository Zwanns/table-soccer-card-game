# Total Soccer: Mundial - описание и спецификация проекта

Этот документ предназначен для переноса контекста проекта в отдельный чат GPT. Он описывает текущее состояние приложения после этапов с реальными составами, WebP-экипировками, новым layout открытых карт, локальными игровыми шрифтами, отдельной GK-колодой, подключением полузащитников к атаке, единой открытой зоной для контратаки, режимом игры против AI и обновленными строгими правилами подключенных полузащитников.

## 1. Краткое описание

`Total Soccer: Mundial` - браузерная карточная футбольная игра на Phaser 3, TypeScript и Vite.

Игроки выбирают две национальные сборные и проводят матч карточными колодами. Каждая команда может управляться человеком или встроенным AI, поэтому поддерживаются матчи HUMAN vs HUMAN, HUMAN vs AI, AI vs HUMAN и AI vs AI. Поле каждой команды состоит из линии полузащиты, линии защиты и позиции вратаря. Атака проходит линии соперника строго по порядку: полузащита, защита, вратарь. Во время атаки на линию полузащиты игрок может вместо карты из колоды подключать собственных полузащитников строго по соответствующим коридорам. Подключенный полузащитник бьет только строго меньший rank, кроме специальных правил. При пробитии вратаря засчитывается гол.

Текущая версия приложения в коде: `1.3.0`.

## 2. Технологии и команды

- Язык: TypeScript.
- Игровой фреймворк: Phaser 3.
- Dev server и сборка: Vite.
- Тесты: Vitest.
- Экипировки и валидация изображений: WebP + `sharp` только в Node-скриптах.
- Игровые шрифты карт и сообщений: локальные Fontsource-пакеты `@fontsource/anton`, `@fontsource/oswald` и `@fontsource/bangers`.
- Размер игровой сцены: `1600 x 720`.

Основные команды:

```bash
npm run dev
npm test
npm run build
npm run validate:kits
```

## 3. Главные файлы

```text
src/config.ts
```

Глобальная конфигурация:

- `GAME_TITLE = 'Total Soccer: Mundial'`
- `GAME_VERSION = '1.3.0'`
- `GAME_AUTHOR = 'Oleh Myronchuk'`
- `SCENE_WIDTH = 1600`
- `SCENE_HEIGHT = 720`

```text
src/main.ts
```

Точка входа Phaser-приложения. Здесь подключены сцены и локальные шрифты:

```ts
import '@fontsource/anton/400.css';
import '@fontsource/bangers/400.css';
import '@fontsource/oswald/600.css';
```

```text
src/scenes/
```

Основные сцены:

- `BootScene.ts` - загрузка базовых ассетов, звуков, меню и экипировок.
- `bootKitAssets.ts` - список загружаемых kit-текстур.
- `MenuScene.ts` - главное меню.
- `TeamSelectScene.ts` - выбор сборных для быстрого матча или standalone-пенальти. В быстром матче и standalone-пенальти у каждой выбранной команды есть AI-checkbox; по умолчанию команды HUMAN. Все 64 команды отображаются на одной странице компактной сеткой 8x8 без пагинации.
- `SquadSelectScene.ts` и `SquadEditorScene.ts` - просмотр/редактирование состава.
- `GameScene.ts` - основной матч.
- `ResultScene.ts` - финальный экран матча.
- `TournamentSetupScene.ts`, `TournamentHubScene.ts`, `TournamentPenaltyScene.ts`, `TournamentCompleteScene.ts` - турнирный контур и пенальти. В setup-экране слоты групп, AI-checkboxes и кнопки удаления используют интерактивные зоны, совпадающие с видимыми прямоугольниками строк.

```text
src/game/
```

Игровая логика:

- `GameEngine.ts` - основной движок матча.
- `GameState.ts` - состояние игры.
- `GameEvent.ts` - события лога.
- `GamePhase.ts` - фазы игры.
- `Player.ts` - модель игрока/команды в матче.
- `PlayerField.ts` - структура поля.
- `fieldRules.ts` - восстановление поля и выбор текущей линии атаки.
- `MatchTeamSetup.ts` - snapshot выбранной сборной, состава, GK-комплекта и типа контроллера `HUMAN`/`AI`.
- `kitAssetResolver.ts` - runtime resolver экипировок.
- `squadResolver.ts` - связь карт с игроками состава.
- `matchStats.ts` - статистика матча.
- `advantage.ts` - шкала текущего преимущества.

```text
src/ai/
```

AI-логика:

- `aiTypes.ts` - типы `PlayerControllerType` и `MatchControllerSetup`.
- `aiDecision.ts` - чистый API выбора действия AI без Phaser и без мутаций `GameState`.
- `aiHeuristics.ts` - эвристика выбора источника атаки, цели, midfield gap и экономии сильных полузащитников.
- `AiTurnController.ts` - таймерный контроллер AI-хода для `GameScene`, работающий через публичный API `GameEngine`.
- `penaltyAiTypes.ts`, `penaltyAiDecision.ts`, `penaltyAiRandom.ts` - отдельная чистая модель решений AI для серий пенальти. Она выбирает только легальные действия `DRAW_GOALKEEPER_CARD` и `SELECT_ATTACK_CARD`, не мутирует `PenaltyShootoutState`, не использует `Math.random()` и не смотрит скрытые rank-карты для выбора.
- `PenaltyAiController.ts` - таймерный контроллер AI для `TournamentPenaltyScene`. Он ставит один pending timer, использует отдельный seeded random stream, вызывает `choosePenaltyAiAction()` и передает действие в общий UI pipeline сцены.
- `index.ts` - публичный экспорт AI-модуля.

```text
src/cards/
```

Карты и колоды:

- `Card.ts` - обычные полевые карты.
- `Deck.ts` - операции с основной колодой.
- `cardRules.ts` - правила сравнения карт.
- `createDecks.ts` - основные стартовые колоды.
- `GoalkeeperCard.ts` - отдельный тип GK-карты.
- `GoalkeeperDeck.ts` - отдельная GK-колода.
- `createGoalkeeperDeck.ts` - создание и shuffle GK-колоды.
- `seededRandom.ts` - seeded random.

```text
src/data/
```

Данные:

- `nationalTeams.ts` - 64 национальные сборные.
- `realSquads.ts` - единственный источник реальных статических составов.
- `defaultSquads.ts` - адаптер/фасад для получения состава из `realSquads`.
- `squadTypes.ts` и `squadValidation.ts` - типы и проверки составов.
- `teamKits.ts` - registry цветов, путей и asset keys экипировок.

```text
src/ui/
```

Phaser UI:

- `CardView.ts` - контейнер карты.
- `KitCardFaceView.ts` - открытая лицевая сторона карты с формой, rank и номером.
- `kitCardFaceModel.ts` - layout открытой карты.
- `cardPlayerProfile.ts` - профиль игрока для карты и tooltip.
- `CardTooltipView.ts` - tooltip.
- `DeckView.ts`, `FieldView.ts`, `ScoreView.ts`, `TeamStatsView.ts`, `AdvantageView.ts`, `EventLogView.ts`.

## 4. Национальные сборные и составы

В проекте 64 сборные. Список команд находится в:

```text
src/data/nationalTeams.ts
```

Реальные статические составы находятся в:

```text
src/data/realSquads.ts
```

Это единственный источник фамилий, номеров и распределения rank для состава. Структура состава:

- 14 полевых игроков, привязанных к rank обычных карт;
- 1 goalkeeper с `id: 'gk'`;
- goalkeeper не хранит личный rank, потому что rank берется из отдельной GK-карты.

`defaultSquads.ts` сохраняет совместимость старого кода, но данные берет из `realSquads.ts`.

## 5. Обычные карты и правила сравнения

Обычные rank:

```text
2
3
4
5
6
7
8
9
10
J
Q
K
A
JOKER
```

Базовое правило:

```text
attacker >= defender
```

Для обычной deck-карты равный rank считается успешным (`5` бьет `5`). Для подключенного полузащитника действует более строгое правило: он должен бить строго меньший rank (`6` бьет `5`, но `5` не бьет `5`). Специальные пробития ниже сохраняются для обычных карт и для подключенных полузащитников.

Особые пробития:

```text
2 beats JOKER
6 beats A
7 beats K
8 beats Q
9 beats J
```

Эти правила реализованы в:

```text
src/cards/cardRules.ts
```

Ключевые функции:

```ts
canBeat(attacker, defender)
canCommittedMidfielderBeat(attacker, defender)
isSpecialBeat(attacker, defender)
```

## 6. Отдельная GK-карта и GK-колода

GK-карта не является обычной полевой картой. Тип находится в:

```text
src/cards/GoalkeeperCard.ts
```

Текущий контракт:

```ts
export type GoalkeeperCardRank =
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export type GoalkeeperCard = {
  id: string;
  rank: GoalkeeperCardRank;
  kind: 'goalkeeper';
};
```

GK-колода содержит ровно 12 карт:

```text
3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A
```

В GK-колоде нет:

```text
2
JOKER
```

API `GoalkeeperDeck`:

```ts
drawTop(): GoalkeeperCard | undefined;
returnToBottom(card: GoalkeeperCard): void;
peekTop(): GoalkeeperCard | undefined;
getSize(): number;
getCards(): readonly GoalkeeperCard[];
```

`toArray()` пока оставлен как совместимый alias для существующего кода и тестов.

У каждой команды в матче есть собственная отдельная GK-колода:

```ts
goalkeeperDeck: GoalkeeperDeck;
```

Основная колода и GK-колода не смешиваются. GK-карта не попадает в руку атаки, `attackBank`, основную колоду или penalty deck.

## 7. Поле и восстановление

Поле игрока:

```text
goalkeeper
defender-1
defender-2
midfielder-1
midfielder-2
midfielder-3
```

Порядок восстановления:

```text
1. goalkeeper
2. defender-1
3. defender-2
4. midfielder-1
5. midfielder-2
6. midfielder-3
```

Правила восстановления:

- `goalkeeper` заполняется только из `goalkeeperDeck`;
- защитники и полузащитники заполняются только из основной deck;
- обычная полевая карта не может попасть в GK-slot;
- GK-карта не может попасть в защиту, полузащиту или атаку.

Восстановление реализовано в:

```text
src/game/fieldRules.ts
```

## 8. Основной ход матча

1. Активный игрок начинает ход.
2. Его поле восстанавливается: GK из GK-колоды, полевые позиции из основной колоды.
3. Если атака находится на линии полузащиты соперника, игрок может выбрать источник атаки: верхнюю карту из основной колоды или допустимого собственного полузащитника.
4. На линиях защиты и вратаря источник атаки - только основная колода.
5. Игрок берет верхнюю карту атаки из основной колоды или подключает собственного полузащитника.
6. Движок определяет текущую доступную линию соперника.
7. Игрок выбирает цель только из текущей линии; для подключенного полузащитника цель определяется автоматически по тому же `midfielder-N`.
8. Если цель пробита, полевая карта соперника уходит в `attackBank`.
9. Если пробит вратарь, засчитывается гол.
10. При завершении атаки полевые карты из `attackBank` уходят вниз основной колоды активного игрока и перекрашиваются в его цвет.
11. GK-карта никогда не захватывается и не перекрашивается.
12. Ход переходит сопернику.

## 8.1 Подключение полузащитников к атаке

Стабильные идентификаторы полузащитников:

```text
midfielder-1
midfielder-2
midfielder-3
```

Во время прохождения линии midfield соперника активный игрок может вместо клика по основной deck нажать на своего допустимого полузащитника.

Условия подключения:

- фаза `WAITING_FOR_ATTACK_CARD`;
- текущая линия соперника - `MIDFIELD`;
- в собственном выбранном слоте лежит обычная полевая карта;
- в противоположном слоте соперника с тем же `positionId` лежит обычная полевая карта;
- выбранный слот еще не использовался в текущей атаке;
- карта подключаемого полузащитника может пробить противоположную карту по `canCommittedMidfielderBeat`;
- атака еще не вышла к defense или goalkeeper.

Коридоры строго совпадают:

```text
midfielder-1 -> midfielder-1
midfielder-2 -> midfielder-2
midfielder-3 -> midfielder-3
```

Диагональные атаки запрещены. Если противоположный слот пуст, подключить полузащитника из этого коридора нельзя. Равный rank не считается успешным для подключенного полузащитника: `midfielder 5` не может подключиться против `5`. Для обычной deck-карты это правило не меняется: deck-карта `5` по-прежнему бьет полевую карту `5`.

Подключенный полузащитник:

- снимается со своей позиции;
- оставляет собственный слот пустым;
- становится текущей атакующей картой;
- автоматически атакует карту соперника строго напротив;
- при успехе использует стандартный `CARD_DEFEATED` и lifecycle `attackBank`;
- при неудаче создает `ATTACK_MISSED`, завершает атаку и передает ход сопернику.

Специальные правила подключенного полузащитника:

```text
2 beats JOKER
6 beats A
7 beats K
8 beats Q
9 beats J
```

За одну атаку можно подключить до трех разных полузащитников, по одному из каждого слота. Разрешено чередование источников:

```text
MIDFIELDER -> DECK -> MIDFIELDER -> DECK
```

После прохода последней фактически лежащей карты midfield соперника возможность подключать оставшихся своих полузащитников закрывается до конца текущей атаки.

В `GameState` источник текущей атакующей карты различается явно:

```ts
export type AttackCardSource = 'DECK' | 'MIDFIELDER';

currentAttackCardSource?: AttackCardSource | null;
currentAttackingMidfielderPositionId?: MidfielderPositionId | null;
committableMidfielderPositionIds?: MidfielderPositionId[];
committedMidfielderPositionIds?: MidfielderPositionId[];
```

Публичные методы движка:

```ts
getCommittableMidfielderPositionIds(): MidfielderPositionId[];
canCommitMidfielder(positionId: string): positionId is MidfielderPositionId;
commitMidfielder(positionId: string): GameState;
```

## 8.2 Единая открытая зона контратаки

Если игрок подключил минимум одного полузащитника и его атака завершилась без гола, освобожденные midfield-слоты остаются пустыми на время немедленной контратаки соперника.

Независимо от количества пустых слотов создается один общий ресурс:

```text
one counterattack midfield gap
```

В `GameState` он хранится как:

```ts
export interface CounterattackMidfieldGap {
  defendingPlayerId: Player['id'];
  positionIds: MidfielderPositionId[];
  used: boolean;
  turnNumber: number;
}

counterattackMidfieldGap?: CounterattackMidfieldGap | null;
legalMidfieldGapPositionIds?: MidfielderPositionId[];
```

Открытую зону может использовать только обычная атакующая карта из основной deck. Она не может использоваться подключенным полузащитником или GK-картой.

Проход gap:

- выбирается кликом по любому доступному пустому midfield-слоту соперника;
- добавляет текущую атакующую карту в `attackBank`;
- создает событие `MIDFIELD_GAP_USED`;
- не создает `CARD_DEFEATED`;
- не создает фиктивную карту defender;
- не передает gap в `cardRules`;
- не увеличивает напрямую possession или advantage;
- закрывает все остальные gap-позиции в рамках этой контратаки;
- продолжает атаку обычным образом.

Если при доступном gap игрок выбирает карту defense или goalkeeper, неиспользованное окно gap закрывается. После завершения контратаки gap удаляется. После гола committed midfield slots забившего игрока восстанавливаются обычными картами из его основной deck, если они есть; GK-колода при этом не используется.

## 8.3 AI-режим

Команды матча имеют явный тип контроллера:

```ts
export type PlayerControllerType = 'HUMAN' | 'AI';
```

Тип хранится в `MatchTeamSetup.controllerType`; если старый код создает setup без этого поля, используется `HUMAN`. Runtime не должен использовать только boolean `isAi` как источник истины игровой модели.

Поддерживаемые сочетания:

```text
HUMAN vs HUMAN
HUMAN vs AI
AI vs HUMAN
AI vs AI
```

AI честный и эвристический:

- использует только открытую информацию из `GameState`;
- не смотрит порядок закрытых карт основной deck или GK-deck;
- не использует seed для просмотра будущего;
- не обращается к private-полям `GameEngine` или `Deck`;
- выбирает только легальные действия из публичных списков `legalTargetPositionIds`, `legalMidfieldGapPositionIds` и `committableMidfielderPositionIds`;
- выполняет действия только через публичный API `GameEngine`.

Действия AI:

```ts
export type AiAction =
  | { type: 'DRAW_FROM_DECK' }
  | { type: 'COMMIT_MIDFIELDER'; positionId: MidfielderPositionId }
  | { type: 'SELECT_TARGET'; positionId: FieldPositionId }
  | { type: 'SELECT_MIDFIELD_GAP'; positionId: MidfielderPositionId };
```

В фазе `WAITING_FOR_ATTACK_CARD` AI берет карту из deck, если текущая линия не midfield или нет эффективного легального полузащитника. На midfield-линии AI иногда подключает легального полузащитника, который пробивает противоположную карту, предпочитает минимально достаточный rank и не тратит слишком сильную карту на слабую цель. `MAX_MIDFIELDER_OVERPAY_STEPS = 2`; special rules не считаются неэффективной переплатой.

Вероятность подключения успешного полузащитника:

```text
AI проигрывает: 80%
счет равный: 70%
AI ведет: 55%
```

В фазе `WAITING_FOR_TARGET` AI сначала выбирает пробиваемую обычную цель. Если обычной пробиваемой цели нет, текущая карта пришла из deck и доступен midfield gap, AI использует `SELECT_MIDFIELD_GAP`. Если gap недоступен или источник атаки `MIDFIELDER`, AI выбирает легальную обычную цель для стандартного turnover.

`AiTurnController` добавляет небольшие задержки и jitter, очищает pending timers при dispose, не действует во время анимаций/goal effects и повторно проверяет состояние после render/update. На AI-ходе человеческая интерактивность поля блокируется; в HUMAN-ход она остается доступной.

## 9. Вратарь, голы, штанги и сейвы

Когда текущая линия атаки - `goalkeeper`, выбор GK считается ударом по воротам.

Всегда логируется:

```text
SHOT_ON_GOAL
```

Для строгих GK-rank `3..10`:

- если `attacker.rank === goalkeeper.rank`, это штанга: `GOALPOST_HIT`;
- для гола атакующая карта должна быть строго выше GK-карты;
- если атакующая карта не может пробить GK, это сейв: `GOALKEEPER_SAVE`.

Если атакующая карта пробивает вратаря:

- логируется `GOAL_SCORED`;
- GK-карта снимается с поля;
- GK-карта возвращается вниз `goalkeeperDeck` защищавшейся команды;
- GK-карта не добавляется в `attackBank`;
- поле защищавшейся команды очищается;
- атака завершается.

После сейва или штанги:

- GK остается на поле;
- rank GK не меняется;
- GK-комплект не меняется;
- GK-карта не возвращается в колоду.

## 10. Команды, цвета и GK-комплекты

Игроки матча:

```text
PLAYER_1 = RED
PLAYER_2 = BLACK
```

При создании матча `MatchTeamSetup` фиксирует:

- `flagCode`;
- snapshot состава;
- `goalkeeperKitId`;
- `controllerType`;
- compatibility alias `teamId`.

GK-комплекты:

```text
gk1
gk2
```

Правило назначения:

- team 1 получает seeded-random `gk1` или `gk2`;
- team 2 получает оставшийся комплект;
- в одном матче комплекты команд всегда различаются;
- при одинаковом seed распределение повторяется;
- комплект фиксируется на матч и не выбирается заново при рендере.

Реализовано в:

```text
src/game/MatchTeamSetup.ts
createGoalkeeperKitPair()
```

## 11. Экипировки и asset contract

Все runtime-изображения экипировок лежат в:

```text
public/kits/images/
```

Формат:

```text
public/kits/images/<flagCode>.webp
public/kits/images/none.webp
public/kits/images/gk1.webp
public/kits/images/gk2.webp
```

Размер каждого исходного файла:

```text
130 x 150 px
```

Контракт в коде:

```ts
KIT_IMAGE_SIZE = { width: 130, height: 150 }
```

Fallback:

- если форма сборной не зарегистрирована, используется `kits/images/none.webp`;
- если `flagCode` неизвестен, также используется `none.webp`.

Runtime не должен:

- использовать `public/kits/imported/`;
- использовать `.png` для экипировок;
- импортировать `sharp`;
- импортировать `fs`;
- делать сетевые запросы к Wikipedia или Commons;
- читать файловую систему браузера.

`sharp` используется только в Node-валидаторе:

```text
scripts/validate-kits.ts
```

Validator проверяет:

- обязательное наличие `none.webp`, `gk1.webp`, `gk2.webp`;
- WebP-сигнатуру и WebP metadata;
- размер `130 x 150`;
- читаемость файла;
- путь `kits/images/`;
- расширение `.webp`.

## 12. Загрузка и resolver экипировок

BootScene всегда загружает:

```text
kit-none -> kits/images/none.webp
kit-gk1  -> kits/images/gk1.webp
kit-gk2  -> kits/images/gk2.webp
```

Дополнительно загружаются только зарегистрированные формы сборных из `AVAILABLE_MANUAL_KIT_FLAG_CODES`.

Resolver:

```text
src/game/kitAssetResolver.ts
```

Правила:

- зарегистрированная команда -> `kit-<flagCode>`;
- незарегистрированная или неизвестная команда -> `kit-none`;
- GK -> `kit-gk1` или `kit-gk2`;
- resolver возвращает `assetKey`, `shirtNumberColor`, `shirtNumberStrokeColor`;
- graphics fallback убран из resolver-модели.

## 13. Открытая карта и layout

Открытая карта рендерится слоями:

1. белый фон с умеренно скругленными углами;
2. один крупный rank в левом верхнем углу;
3. изображение экипировки в правой нижней части;
4. номер игрока поверх формы;
5. интерактивные эффекты и tooltip.

Закрытые карты не менялись.

Layout:

```ts
export const KIT_CARD_LAYOUT = {
  kitWidth: 76,
  kitHeight: 88,
  kitAnchorX: 1,
  kitAnchorY: 1,
  kitOffsetRight: 6,
  kitOffsetBottom: 6,
  shirtNumberX: 0.5,
  shirtNumberY: 0.33,
  rankOffsetLeft: 10,
  rankOffsetTop: 8,
  rankColor: '#000000',
  rankFontFamily: 'Anton, Arial, sans-serif',
  shirtNumberFontFamily: 'Oswald, Arial, sans-serif',
  cardCornerRadius: 8,
  deckCornerRadius: 8
} as const;
```

Rank:

- один раз;
- слева сверху;
- черный `#000000`;
- без мастей;
- без нижнего перевернутого rank;
- шрифт Anton.

Номер игрока:

- поверх формы;
- центр по горизонтали;
- верхняя треть формы;
- координаты `shirtNumberX = 0.5`, `shirtNumberY = 0.33`;
- полевые номера берут цвета из resolver;
- GK-номера всегда `#FFFFFF` с обводкой `#111111`;
- шрифт Oswald SemiBold.

Tooltip:

- показывает только фамилию игрока;
- не показывает номер, rank, роль или команду.

## 14. UI матча

Основная сцена:

```text
src/scenes/GameScene.ts
```

На экране матча есть:

- футбольное поле;
- карты обеих команд;
- основные колоды;
- GK-slot на поле;
- кнопки меню/результата;
- табло счета;
- мини-статистика;
- шкала текущего преимущества;
- лог событий.

Карты поля получают профиль игрока через snapshot `state.matchSetups[player.id]`, а не через runtime-чтение localStorage.

Интерактивность поля:

- карты соперника из `state.legalTargetPositionIds` кликабельны как обычные цели;
- собственные полузащитники из `state.committableMidfielderPositionIds` кликабельны в фазе выбора источника атаки;
- пустые midfield-слоты соперника из `state.legalMidfieldGapPositionIds` кликабельны как единая открытая зона контратаки;
- UI не показывает заранее, выиграет ли подключенный полузащитник дуэль.

Анимация атакующей карты учитывает источник:

- `DECK`: карта летит от активной deck к цели;
- `MIDFIELDER`: карта летит из собственного midfield-слота к противоположному midfield-слоту.

Flying messages (`GOAL!!`, `Goalkeeper!!`, `Post!`, `Turnover...`) используют padding у текстового объекта, чтобы stroke и крайние символы не обрезались.

## 15. Статистика и преимущество

`matchStats.ts` считает:

- голы;
- удары;
- сейвы GK;
- реализацию;
- scorer snapshots;
- possession.

`advantage.ts` считает текущее преимущество по максимальной глубине атаки за последние 5 ходов:

```text
midfield = 1
defense = 2
goalkeeper = 3
```

За один ход учитывается только максимальная достигнутая глубина, а не сумма всех пробитых линий.

`MIDFIELD_GAP_USED` не является `CARD_DEFEATED`, не считается пробитой картой и сам по себе не меняет possession или advantage. Если после прохода gap игрок добирается до defense или goalkeeper, более глубокие события учитываются стандартной логикой `CARD_DEFEATED`.

## 16. Турнир и пенальти

Турнирный контур уже присутствует:

- setup турнира;
- hub турнира;
- симуляция матчей;
- stats и rankings;
- финальный экран турнира;
- отдельный penalty shootout engine.

Пенальти используют свой `PenaltyShootoutEngine` и не должны смешиваться с отдельной GK-колодой обычного матча.

Setup турнира отображает группы как панели со слотами по 4 команды. Клик по строке выбирает слот, клик по `x` удаляет команду из слота. Интерактивные зоны строк и кнопок удаления должны совпадать с видимыми прямоугольниками, без смещения hit area относительно UI.

У каждого турнирного слота есть AI-checkbox. По умолчанию checkbox выключен, то есть новая команда создается как `HUMAN`. `controllerType` сохраняется в tournament state в `participants`; удаление команды очищает AI-state слота, а новая команда в освобожденном слоте снова становится `HUMAN`. Визуальные матчи турнира получают `player1ControllerType` и `player2ControllerType` из участников турнира. Турнирные серии пенальти получают `homeControllerType` и `awayControllerType` из тех же участников. Standalone-пенальти получают `player1ControllerType` и `player2ControllerType` из `TeamSelectScene`.

`TournamentPenaltyScene` поддерживает HUMAN vs HUMAN, HUMAN vs AI, AI vs HUMAN и AI vs AI для standalone- и турнирных серий. HUMAN-клики и AI-действия проходят через общие handlers `handleGoalkeeperAction` и `handleShotAction`, поэтому правила, анимации, sounds, flying messages и переходы фаз не дублируются. Если текущую сторону контролирует AI, игровые клики по карточкам блокируются только для этой стороны; служебные кнопки остаются вне этой блокировки.

`tournamentMatchSimulation` не использует `AiTurnController` и не зависит от эвристик обычного AI-матча. Penalty shootout живет в отдельном engine и не смешивается с AI обычного матча, обычной GK-колодой, main deck, midfielder logic или match events. `PenaltyAiController` очищает timers при `SHUTDOWN`, `DESTROY` и завершении серии.

## 17. События игры

Ключевые события:

```text
GAME_STARTED
FIRST_PLAYER_SELECTED
FIELD_RESTORED
FIELD_CARD_RESTORED
ATTACK_CARD_DRAWN
MIDFIELDER_COMMITTED
TARGETS_AVAILABLE
CARD_DEFEATED
MIDFIELD_GAP_USED
SHOT_ON_GOAL
GOALPOST_HIT
GOALKEEPER_SAVE
GOALKEEPER_CARD_RECYCLED
ATTACK_MISSED
GOAL_SCORED
TURN_ENDED
GAME_OVER
```

`CARD_DEFEATED` содержит:

```text
playerId
turnNumber
positionId
attackerCard
defenderCard
```

Для GK после гола дополнительно логируется:

```text
GOALKEEPER_CARD_RECYCLED
```

`MIDFIELDER_COMMITTED` содержит:

```text
playerId
turnNumber
positionId
card
```

`MIDFIELD_GAP_USED` содержит:

```text
playerId
turnNumber
positionId
attackerCard
```

`MIDFIELD_GAP_USED` не заменяет и не дублирует `CARD_DEFEATED`.

## 18. Фазы игры

Фазы:

```text
NOT_STARTED
DETERMINING_FIRST_PLAYER
ENDING_TURN
RESTORING_FIELD
WAITING_FOR_ATTACK_CARD
DRAWING_ATTACK_CARD
WAITING_FOR_TARGET
GAME_OVER
```

Фазы описаны в:

```text
src/game/GamePhase.ts
```

## 19. Тесты

Тесты находятся в:

```text
src/tests/
```

Основные группы:

- `cards.test.ts` - обычные карты и правила.
- `goalkeeperDeck.test.ts` - отдельная GK-карта и GK-колода.
- `field.test.ts` - восстановление поля и целевые линии.
- `gameEngine.test.ts` - атаки, подключение полузащитников, единый counterattack gap, голы, сейвы, штанги, рециклинг GK.
- `matchTeamSetup.test.ts` - snapshot команды, разные GK-комплекты и controllerType по умолчанию.
- `aiDecision.test.ts` - чистые решения AI, честность, legal-only действия, special rules, gap priority и overpay filter.
- `aiTurnController.test.ts` - таймеры AI, HUMAN/AI и AI/AI pipeline до `GAME_OVER`, блокировка ввода во время AI-хода.
- `gameSceneEventEffects.test.ts` - общий GOAL sound и `GOAL!!` pipeline для HUMAN и AI.
- `cardFace.test.ts` - layout карты, tooltip, шрифты, kit render contract.
- `teamKits.test.ts` и `kitAssetResolver.test.ts` - registry и resolver экипировок.
- `validateKits.test.ts` - validator WebP-ассетов.
- `realSquads.test.ts` и `squads.test.ts` - составы.
- tournament tests - турнирная механика, статистика, AI-checkboxes, visual AI match setup, simulation, penalty routing и сохранение победителя серии пенальти с HUMAN/AI.
- `penaltyAiDecision.test.ts` - чистая модель решений penalty AI, legal-only действия, отсутствие мутаций, отдельный random stream и запрет `Math.random()`.
- `penaltyAiController.test.ts` - timers penalty AI, cleanup, общий pipeline действий, standalone HUMAN/AI комбинации и дополнительная серия после ничьей.

На момент обновления документа:

```text
28 test files
389 tests
```

Перед завершением значимых правок рекомендуется запускать:

```bash
npm run validate:kits
npm test
npm run build
```

Если менялся frontend/runtime, дополнительно:

```bash
npm run dev
```

## 20. Важные ограничения

Не менять без отдельного этапа/задачи:

- фамилии, номера и rank-распределение в `realSquads.ts`;
- механику обычных карт;
- текущий контракт отсутствия кнопки `OUT` на экране матча;
- wiki-importer;
- исходные `.webp`-ассеты `130 x 150`;
- формат экипировок `public/kits/images/*.webp`;
- локальные шрифты Anton, Oswald и Bangers;
- tooltip: только фамилия;
- отдельность GK-колоды от основной колоды;
- запрет попадания GK-карты в `attackBank` и основную deck;
- честность AI: не смотреть закрытые карты, не читать private-поля движка/колод, не использовать `Math.random()` в решениях;
- отдельность tournament simulation и penalty shootout от AI обычного визуального матча.

Runtime не должен зависеть от Node API (`fs`, `sharp`) и не должен обращаться к Wikipedia/Commons.

## 21. Как использовать этот документ в другом чате GPT

В новом чате можно загрузить этот файл и написать:

```text
Это спецификация моего проекта Total Soccer: Mundial. Используй ее как основной контекст. Помогай развивать проект в соответствии с текущей архитектурой, правилами игры, asset contract и UI-договоренностями.
```

Если нужно просить изменения кода, дополнительно передавайте актуальный `ToDo.md`, релевантные файлы или diff, потому что этот документ фиксирует архитектурное состояние проекта, но не заменяет свежую рабочую задачу.

# Total Soccer: Mundial - описание и спецификация проекта

Этот документ предназначен для переноса контекста проекта в отдельный чат GPT. Он описывает текущее состояние приложения после этапов с реальными составами, WebP-экипировками, командными рубашками колод, новым layout открытых карт, локальными игровыми шрифтами, отдельной GK-колодой, подключением полузащитников к атаке, единой открытой зоной для контратаки, режимом игры против AI, безопасным аудио, обновленной статистикой голов и строгими правилами подключенных полузащитников.

## 1. Краткое описание

`Total Soccer: Mundial` - браузерная карточная футбольная игра на Phaser 3, TypeScript и Vite.

Игроки выбирают две национальные сборные и проводят матч карточными колодами. Каждая команда может управляться человеком или встроенным AI, поэтому поддерживаются матчи HUMAN vs HUMAN, HUMAN vs AI, AI vs HUMAN и AI vs AI. Поле каждой команды состоит из линии полузащиты, линии защиты и позиции вратаря. Атака проходит линии соперника строго по порядку: полузащита, защита, вратарь. Во время атаки на линию полузащиты игрок может вместо карты из колоды подключать собственных полузащитников строго по соответствующим коридорам. Подключенный полузащитник бьет только строго меньший rank, кроме специальных правил. При пробитии вратаря засчитывается гол.

Текущая версия приложения в коде: `1.3.2`.

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
npm run validate:covers
```

## 3. Главные файлы

```text
src/config.ts
```

Глобальная конфигурация:

- `GAME_TITLE = 'Total Soccer: Mundial'`
- `GAME_VERSION = '1.3.2'`
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

- `BootScene.ts` - загрузка базовых ассетов, звуков, меню, флагов, экипировок и fallback/team-cover рубашек колод. Для меню загружает `menu-logo1.png` и `menu-logo2.png`, но не старый `menu-logo.png`.
- `bootKitAssets.ts` - список загружаемых kit-текстур.
- `MenuScene.ts` - главное меню с фоновым изображением, кнопками режимов, отдельными разделами `Rules`/`About` и мигающим scoreboard-логотипом. Анимированный мяч и желтые декоративные треугольники в меню не используются.
- `TeamSelectScene.ts` - выбор сборных для быстрого матча или standalone-пенальти. В быстром матче и standalone-пенальти у каждой выбранной команды есть AI-checkbox; по умолчанию команды HUMAN. Все 65 команд отображаются на одной странице компактной сеткой с 8 колонками без пагинации.
- Team selection layout uses `createTeamScreenLayout()` from `src/ui/teamScreenLayout.ts`: selected Team 1 card and Menu button align to `teamGridRect.x`, selected Team 2 card and Start/Start penalties align to the right edge of `teamGridRect`, and `VS` remains centered between selected cards.
- Team selection selected cards show a 3-card face-down cover fan from `resolveTeamCoverLoadResult()` instead of the team flag. Between each selected card and `VS`, the screen shows a small kit preview using `getTeamKitAssetKey()` with `kit-none` fallback.
- Team selection background uses the preloaded `public/menu/menu-2-bg.webp` asset, stretched to the scene size, with the muted striped Phaser Graphics football field kept only as a missing-texture fallback. No main.ts, index.html, global CSS scale/input, GameEngine, AI, Penalty AI, or TournamentEngine changes are part of this screen layout contract.
- `SquadSelectScene.ts` и `SquadEditorScene.ts` - просмотр состава. `Teams` показывает справа цвета выбранной сборной и две preview-карты: лицевую карту с экипировкой и rank `N`, а ниже одиночную face-down карту с рубашкой выбранной команды.
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
- `matchStats.ts` - статистика матча, scorer snapshots и форматирование подписей авторов голов.
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

- `nationalTeams.ts` - 65 национальных сборных.
- `realSquads.ts` - единственный источник статических составов с вымышленными фамилиями игроков.
- `defaultSquads.ts` - адаптер/фасад для получения состава из `realSquads`.
- `squadTypes.ts` и `squadValidation.ts` - типы и проверки составов.
- `teamKits.ts` - registry цветов, путей и asset keys экипировок.

```text
src/assets/
```

Runtime-ассеты:

- `teamCover.ts` - registry/utility для рубашек командных колод, fallback `covers/none.webp`, ленивой догрузки cover-текстур и contain-fit масштабирования изображений.

```text
src/audio/
```

Аудио:

- `playSoundSafe.ts` - безопасный helper проигрывания звука. Если audio asset не загружен, helper пишет warning и не вызывает `scene.sound.play()`.

```text
src/ui/
```

Phaser UI:

- `CardView.ts` - контейнер карты. Поддерживает открытую карту с формой, обычную закрытую карту, нейтральную закрытую preview-карту и squad-preview рубашку с deck-layering без синей deck-обводки.
- `KitCardFaceView.ts` - открытая лицевая сторона карты с формой, rank и номером.
- `kitCardFaceModel.ts` - layout открытой карты.
- `teamColorSwatches.ts` - чистый helper layout/HEX parsing для цветных кружков сборной на `Teams`.
- `cardPlayerProfile.ts` - профиль игрока для карты и tooltip.
- `CardTooltipView.ts` - tooltip.
- `DeckView.ts`, `FieldView.ts`, `ScoreView.ts`, `TeamStatsView.ts`, `AdvantageView.ts`, `EventLogView.ts`.

### Главное меню

Главное меню использует ассеты:

```text
public/menu/menu-bg.webp
public/menu/menu-logo1.png
public/menu/menu-logo2.png
public/menu/menu-flags.png
```

`menu-logo1.png` - включенное состояние табло, `menu-logo2.png` - выключенное состояние табло. `MENU_ASSETS` хранит ключи `logoOn` и `logoOff`, `MENU_ASSET_PATHS` указывает на `menu/menu-logo1.png` и `menu/menu-logo2.png`.

Правила:

- `menu-logo.png` не используется runtime-кодом;
- `menu-ball` не используется в меню;
- `turn-ball` продолжает загружаться для игровых UI-элементов, но не является fallback-декором главного меню;
- логотип создается одним `Image` и мигает через переключение texture между `logoOn` и `logoOff`;
- `fitImageWithin()` сохраняет aspect ratio логотипа через `setScale()`;
- кнопки главного меню и меню режимов используют единый `buttonWidth`, рассчитанный через `getMenuButtonWidth()`;
- если `logoImage.displayWidth` доступен, ширина кнопок равна фактической ширине масштабированного табло с clamp по ширине экрана;
- если используется текстовый fallback без logo image, ширина кнопок берется из ограниченного fallback-расчета от `this.scale.width`;
- главное меню содержит кнопки `Game modes`, `Teams`, `Rules`, `About` в этом порядке;
- `About` содержит короткое описание игры и отдельный legal/disclaimer-раздел на EN/PL/UA, без правил;
- footer главного меню содержит legal disclaimer: игра неофициальная, не связана с FIFA, UEFA, футбольными федерациями, клубами, лигами или игроками; названия команд, имена игроков, формы, рубашки карт и визуальные элементы являются вымышленными или стилизованными, если не указано иное;
- `Rules` открывает отдельную модальную панель с правилами на EN/PL/UA и использует тот же language selector;
- украинский `About` должен использовать украинский текст, а не английский fallback;
- если `logoOn` не загружен, показывается текстовый fallback из `GAME_TITLE`;
- если `logoOff` не загружен, логотип остается включенным и blink timer не запускается;
- blink timer очищается на `SHUTDOWN`, `DESTROY` и при перестроении меню.

## 4. Национальные сборные и составы

В проекте 65 сборных. Список команд находится в:

```text
src/data/nationalTeams.ts
```

Статические составы с вымышленными фамилиями игроков находятся в:

```text
src/data/realSquads.ts
```

Это единственный источник вымышленных фамилий, номеров и распределения rank для состава. Игра не использует реальные имена футболистов. Структура состава:

- 14 полевых игроков, привязанных к rank обычных карт;
- 1 goalkeeper с `id: 'gk'`;
- goalkeeper не хранит личный rank, потому что rank берется из отдельной GK-карты.

`defaultSquads.ts` сохраняет совместимость старого кода, но данные берет из `realSquads.ts`.

Northern Ireland добавлена как отдельная команда в алфавитный список сборных:

- `name: 'Northern Ireland'`
- `flagCode: 'nir'`
- Ireland / Republic of Ireland продолжает использовать `flagCode: 'ie'`
- флаг команды загружается из `public/flags/nir.svg`
- ручная форма зарегистрирована как `public/kits/images/nir.webp`
- kit colors: primary `#006A3A`, secondary `#FFFFFF`; `secondaryColor` также является цветом номера на форме, номера рендерятся без stroke.
- вымышленный состав `nir` находится в `realSquads.ts`: goalkeeper McKeown, 14 field players, включая Colerain, Antrimor и Magherin.

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
702 x 900 px
```

Контракт в коде:

```ts
KIT_IMAGE_SIZE = { width: 702, height: 900 }
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
- размер `702 x 900`;
- читаемость файла;
- путь `kits/images/`;
- расширение `.webp`.
- каждый `AVAILABLE_MANUAL_KIT_FLAG_CODES` существует среди `NATIONAL_TEAMS.flagCode`;
- `none`, `gk1`, `gk2` не зарегистрированы как team kits;
- если в `public/kits/images/<flagCode>.webp` есть файл для существующей сборной, этот `flagCode` обязан быть в `AVAILABLE_MANUAL_KIT_FLAG_CODES`, иначе `validate:kits` падает.

## 11.1 Рубашки командных колод

Командные рубашки колод лежат в:

```text
public/covers/
```

Формат:

```text
public/covers/<flagCode>.webp
public/covers/none.webp
```

Кодовый контракт:

```text
src/assets/teamCover.ts
```

Ключевые функции:

```ts
getTeamCoverFilename(flagFilename)
getTeamCoverPath(flagFilename)
getTeamCoverTextureKey(flagFilename)
getFallbackCoverPath()
getFallbackCoverTextureKey()
queueTeamCoverLoad(scene, flagFilename)
markTeamCoverLoadFailed(textureKey)
resolveTeamCoverLoadResult(textures, flagFilename)
fitImageContain(image, bounds)
```

Правила:

- texture key строится как `cover-<flagCode>`;
- fallback texture key - `cover-none`;
- fallback path - `covers/none.webp`;
- `AVAILABLE_TEAM_COVER_FLAG_CODES` содержит все реально доступные cover-ассеты, совпадающие с `NATIONAL_TEAMS.flagCode`, и не содержит `none`;
- `hasManualTeamCover(flagCode)` проверяет регистрацию индивидуальной рубашки;
- `resolveTeamCoverAsset(flagCode)` возвращает `cover-<flagCode>` / `covers/<flagCode>.webp` для зарегистрированной сборной и `cover-none` / `covers/none.webp` для неизвестной или незарегистрированной;
- если cover не загружен или загрузка помечена как failed, используется `cover-none`;
- `GameScene` и `TournamentPenaltyScene` могут лениво ставить cover в очередь через `queueTeamCoverLoad()`;
- `BootScene` всегда загружает `cover-none` и все cover-ассеты из `AVAILABLE_TEAM_COVER_FLAG_CODES`;
- `DeckView` и closed `CardView` получают `coverTextureKey`, но сами не решают командную fallback-логику.

Validator рубашек колод:

```text
scripts/validate-covers.ts
npm run validate:covers
```

Проверяет:

- `public/covers/none.webp`;
- каждый registered cover из `AVAILABLE_TEAM_COVER_FLAG_CODES`;
- совпадение registered cover codes с `NATIONAL_TEAMS.flagCode`;
- WebP-сигнатуру и читаемость через `sharp`;
- ошибку, если `public/covers/<flagCode>.webp` существует для текущей сборной, но `<flagCode>` не зарегистрирован;
- ошибку, если `public/covers/<code>.webp` не соответствует ни одной сборной;
- запрет `none` как team cover.

Чтобы добавить новую рубашку колоды:

1. положить файл `public/covers/<flagCode>.webp`;
2. убедиться, что `<flagCode>` совпадает с `nationalTeams.flagCode`;
3. добавить `<flagCode>` в `AVAILABLE_TEAM_COVER_FLAG_CODES`;
4. запустить `npm run validate:covers`;
5. запустить `npm test`;
6. запустить `npm run build`.

## 12. Загрузка и resolver экипировок

BootScene всегда загружает:

```text
kit-none -> kits/images/none.webp
kit-gk1  -> kits/images/gk1.webp
kit-gk2  -> kits/images/gk2.webp
cover-none -> covers/none.webp
```

Дополнительно загружаются только зарегистрированные формы сборных из `AVAILABLE_MANUAL_KIT_FLAG_CODES`. Этот whitelist является явным runtime source of truth, потому что браузер/Vercel runtime не читает директорию `public/kits/images` через `fs`.

Текущий процесс добавления новой формы:

1. положить файл `public/kits/images/<flagCode>.webp`;
2. добавить `<flagCode>` в `AVAILABLE_MANUAL_KIT_FLAG_CODES`;
3. запустить `npm run validate:kits`;
4. запустить `npm test`.

Если файл формы существует для текущей сборной, но не зарегистрирован в whitelist, validator сообщает ошибку: такая форма не будет загружена в `BootScene` и игра покажет `kit-none`.

Командные рубашки колод загружаются из `AVAILABLE_TEAM_COVER_FLAG_CODES`.

Resolver:

```text
src/game/kitAssetResolver.ts
```

Правила:

- зарегистрированная команда -> `kit-<flagCode>`;
- незарегистрированная или неизвестная команда -> `kit-none`;
- GK -> `kit-gk1` или `kit-gk2`;
- resolver возвращает `assetKey`, `numberColor`; для field kits `numberColor` берется из `secondaryColor`;
- graphics fallback убран из resolver-модели.

## 13. Открытая карта и layout

Открытая карта рендерится слоями:

1. белый фон с умеренно скругленными углами;
2. один крупный rank в левом верхнем углу;
3. изображение экипировки в правой нижней части;
4. номер игрока поверх формы;
5. интерактивные эффекты и tooltip.

Закрытые карты:

- стандартный face-down вариант по умолчанию остается deck-стилем с темной подложкой `0x214f6b` и синей обводкой `0x7bb8d8`;
- `CardViewOptions.faceDownVariant?: 'deck' | 'preview' | 'squad-preview'` позволяет явно запросить preview-вариант;
- `faceDownVariant: 'preview'` использует нейтральную одиночную карту с белой подложкой `0xffffff` и темной рамкой `0x1f2a2e`, без синей deck-обводки;
- `faceDownVariant: 'squad-preview'` использует темную верхнюю подложку как у deck-стиля, добавляет смещенную заднюю карту `(-10, 10)` и нейтральную темную рамку `0x1f2a2e`, без active/highlight outline;
- если `coverTextureKey` не передан, закрытая карта использует `getFallbackCoverTextureKey()`.

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

### Teams preview

На экране `Teams` / `SquadSelectScene` кнопка возврата подписана `Back`, использует желтый UI-стиль и возвращает в `MenuScene`. Старый label `<` не используется.

Справа от таблицы состава отображаются цветные кружки и две карты выбранной команды:

- над preview-картами есть ряд color swatches без текстового заголовка;
- swatches берутся из `getTeamKitStyle(team.flagCode)`, без отдельного списка цветов для UI;
- layout строится через `buildTeamColorSwatches()` из `src/ui/teamColorSwatches.ts`;
- отображаются `primaryColor`, `secondaryColor`, optional `accentColor`, если значения валидные;
- HEX-строки преобразуются в числовые цвета для Phaser `fillStyle`;
- swatches рисуются отдельными `Graphics` с явной позицией над верхней preview-картой и добавляются в preview container после карт, чтобы не быть перекрытыми;
- белый/светлый swatch получает темный контур `0x1f2a2e`, остальные - светлый контур;
- сверху лицевая preview-карта через `CardView` с `rank: 'N'`, `kitTextureKey: getTeamKitAssetKey(team.flagCode)` и отключенным tooltip;
- снизу face-down squad-preview карта через `CardView` с `coverTextureKey: resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey`, `faceDown: true`, `faceDownVariant: 'squad-preview'` и отключенным tooltip.

Обе preview-карты используют один масштаб:

```ts
const TEAM_PREVIEW_CARD_SCALE = 1.45;
```

Это важно: preview-рубашка должна быть такого же размера, как лицевая preview-карта, но при этом не должна выглядеть как активная игровая колода.

## 14. UI матча

Основная сцена:

```text
src/scenes/GameScene.ts
```

На экране матча есть:

- футбольное поле;
- карты обеих команд;
- основные колоды с командными рубашками;
- GK-slot на поле;
- кнопки `Menu`/`Result` слева над полем и `Rules`/`About` справа от табло: все `286 x 38`, `fontSize = 16px`; боковые кнопки занимают пространство от края поля до табло с `14px` gap;
- табло счета `520 x 78`, ширина берется из `ADVANTAGE_VIEW_WIDTH` и совпадает с нижней шкалой преимущества; фон вынесен в `SCORE_VIEW_BACKGROUND_COLOR = 0x08120f`;
- мини-статистика;
- шкала текущего преимущества;
- лог событий.

`Rules` и `About` в главном меню и в матче используют фон центральной панели из `SCORE_VIEW_BACKGROUND_COLOR` с alpha `0.98`, чтобы совпадать по базовому цвету с верхним табло. В матче они открывают in-game overlay поверх `GameScene`: полупрозрачная интерактивная подложка блокирует клики под окном, центральная панель содержит `Back` снизу по центру, title, `${GAME_TITLE} | v${GAME_VERSION}`, языки `EN/PL/UA` и scrollable viewport. Контент переиспользуется из экспортированных `ABOUT_CONTENT` / `RULES_CONTENT` главного меню; окно не стартует другую сцену, не пересоздает `GameEngine` и после закрытия возобновляет AI-check.

`FieldView` рисует поле `1120 x 600` как аркадный полосатый газон: base `0x157a43`, 14 вертикальных полос с `0x19864a` / `0x126d3c` и alpha `0.28`. Разметка поля и карточки рисуются поверх полос.

Карты поля получают профиль игрока через snapshot `state.matchSetups[player.id]`, а не через runtime-чтение localStorage.

Интерактивность поля:

- карты соперника из `state.legalTargetPositionIds` кликабельны как обычные цели;
- собственные полузащитники из `state.committableMidfielderPositionIds` кликабельны в фазе выбора источника атаки;
- пустые midfield-слоты соперника из `state.legalMidfieldGapPositionIds` кликабельны как единая открытая зона контратаки;
- UI не показывает заранее, выиграет ли подключенный полузащитник дуэль.

Анимация атакующей карты учитывает источник:

- `DECK`: карта летит от активной deck к цели;
- `MIDFIELDER`: карта летит из собственного midfield-слота к противоположному midfield-слоту.

Мяч-маркер над активной колодой использует bounce-анимацию в `DeckView`: `DECK_MARKER_BOUNCE_HEIGHT = 24`, подъем `360 ms` с `Quad.easeOut`, падение `260 ms` с `Quad.easeIn`, затем короткий squash/stretch `64 ms`. Для маркера создается один `TweenChain`, который останавливается при destroy маркера или shutdown сцены.

Flying messages (`GOAL!!`, `Goalkeeper!!`, `Post!`, `Turnover...`) используют padding у текстового объекта, чтобы stroke и крайние символы не обрезались.

Звуки в `GameScene`, `ResultScene` и `TournamentPenaltyScene` проигрываются через `playSoundSafe()`. Отсутствующий audio asset не должен ломать сцену: helper пишет warning и пропускает проигрывание.

## 15. Статистика и преимущество

`matchStats.ts` считает:

- голы;
- удары;
- сейвы GK;
- реализацию;
- scorer snapshots с `turnNumber`;
- possession.

Форматирование авторов голов:

```ts
formatGoalScorerLabel(scorer)
formatGoalScorerMatchLabel(scorer)
```

Правила label:

- если есть номер и имя: `#<shirtNumber> <playerName>`;
- если есть только номер: `#<shirtNumber>`;
- если есть только имя: `<playerName>`;
- fallback: `Rank <rank>`.

В `GameScene` мини-статистика голов показывает список авторов через `TeamStatsView`: панели `200 x 288`, без темного фона, верх выровнен с `FIELD_TOP`, пустое состояние рендерится как `-`. Длинный список находится в masked viewport и прокручивается колесом как fallback. В `ResultScene` блок `Goalscorers` показывает общую хронологию голов по turnNumber в двух левых-выравненных колонках команд и тоже поддерживает прокрутку при переполнении.

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
- `cardFace.test.ts` - layout карты, tooltip, шрифты, kit render contract, стандартный и preview face-down варианты.
- `teamCover.test.ts` - пути, texture keys, fallback и failure-state для рубашек командных колод.
- `teamStatsView.test.ts` - список авторов голов, fallback `-`, masked viewport и scrollbar.
- `gameScene.test.ts` - визуальные контракты игрового экрана: bounce-мяч активной колоды, размер/позиция боковых кнопок `Menu`/`Result`/`Rules`/`About`, in-game info overlay, общий цвет фона табло/info-панелей, прозрачные и высокие Goals-панели, общая ширина табло и advantage indicator, полосатый газон поля.
- `teamKits.test.ts` и `kitAssetResolver.test.ts` - registry и resolver экипировок.
- `validateKits.test.ts` - validator WebP-ассетов.
- `validateCovers.test.ts` - validator WebP-рубашек колод.
- `realSquads.test.ts` и `squads.test.ts` - составы, вымышленные фамилии, глобальная уникальность фамилий и латиница.
- `project.test.ts` - метаданные проекта, версия, автор, main menu asset contracts, blink-logo contracts, унификация ширины menu buttons, отдельные `Rules`/`About`, legal disclaimer, safe sound helper, scorer UI contracts.
- `bootScene.test.ts` - обязательная загрузка kit-ассетов и текущих menu scoreboard ассетов без старого `menu-logo.png` / `menu-ball`.
- `resultScene.test.ts` - выравнивание и прокручиваемая хронология авторов голов на финальном экране.
- `squadEditor.test.ts` - read-only Teams/Squad screens и preview-карты выбранной сборной с одинаковым scale.
- tournament tests - турнирная механика, статистика, AI-checkboxes, visual AI match setup, simulation, penalty routing и сохранение победителя серии пенальти с HUMAN/AI.
- `penaltyAiDecision.test.ts` - чистая модель решений penalty AI, legal-only действия, отсутствие мутаций, отдельный random stream и запрет `Math.random()`.
- `penaltyAiController.test.ts` - timers penalty AI, cleanup, общий pipeline действий, standalone HUMAN/AI комбинации и дополнительная серия после ничьей.

На момент обновления документа:

```text
32 test files
431 tests
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
- исходные `.webp`-ассеты `702 x 900`;
- формат экипировок `public/kits/images/*.webp`;
- fallback-рубашку `public/covers/none.webp` и контракт `cover-<flagCode>` / `cover-none`;
- локальные шрифты Anton, Oswald и Bangers;
- tooltip: только фамилия;
- отдельность GK-колоды от основной колоды;
- запрет попадания GK-карты в `attackBank` и основную deck;
- честность AI: не смотреть закрытые карты, не читать private-поля движка/колод, не использовать `Math.random()` в решениях;
- отдельность tournament simulation и penalty shootout от AI обычного визуального матча.
- стандартный deck-стиль настоящих игровых закрытых карт и колод при правках preview на `Teams`;
- fallback-логику `resolveTeamCoverLoadResult()` при правках рубашек.

Runtime не должен зависеть от Node API (`fs`, `sharp`) и не должен обращаться к Wikipedia/Commons.

## 21. Как использовать этот документ в другом чате GPT

В новом чате можно загрузить этот файл и написать:

```text
Это спецификация моего проекта Total Soccer: Mundial. Используй ее как основной контекст. Помогай развивать проект в соответствии с текущей архитектурой, правилами игры, asset contract и UI-договоренностями.
```

Если нужно просить изменения кода, дополнительно передавайте актуальный `ToDo.md`, релевантные файлы или diff, потому что этот документ фиксирует архитектурное состояние проекта, но не заменяет свежую рабочую задачу.

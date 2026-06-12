# Total Soccer: Mundial - описание и спецификация проекта

Этот документ предназначен для переноса контекста проекта в отдельный чат GPT. Он описывает текущее состояние приложения после этапов с реальными составами, WebP-экипировками, новым layout открытых карт, локальными игровыми шрифтами и отдельной GK-колодой.

## 1. Краткое описание

`Total Soccer: Mundial` - браузерная карточная футбольная игра на Phaser 3, TypeScript и Vite.

Игроки выбирают две национальные сборные и проводят матч карточными колодами. Поле каждой команды состоит из линии полузащиты, линии защиты и позиции вратаря. Атака проходит линии соперника строго по порядку: полузащита, защита, вратарь. При пробитии вратаря засчитывается гол.

Текущая версия приложения в коде: `1.0`.

## 2. Технологии и команды

- Язык: TypeScript.
- Игровой фреймворк: Phaser 3.
- Dev server и сборка: Vite.
- Тесты: Vitest.
- Экипировки и валидация изображений: WebP + `sharp` только в Node-скриптах.
- Игровые шрифты карт: локальные Fontsource-пакеты `@fontsource/anton` и `@fontsource/oswald`.
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
- `GAME_VERSION = '1.0'`
- `GAME_AUTHOR = 'Oleh Myronchuk'`
- `SCENE_WIDTH = 1600`
- `SCENE_HEIGHT = 720`

```text
src/main.ts
```

Точка входа Phaser-приложения. Здесь подключены сцены и локальные шрифты:

```ts
import '@fontsource/anton/400.css';
import '@fontsource/oswald/600.css';
```

```text
src/scenes/
```

Основные сцены:

- `BootScene.ts` - загрузка базовых ассетов, звуков, меню и экипировок.
- `bootKitAssets.ts` - список загружаемых kit-текстур.
- `MenuScene.ts` - главное меню.
- `TeamSelectScene.ts` - выбор сборных.
- `SquadSelectScene.ts` и `SquadEditorScene.ts` - просмотр/редактирование состава.
- `GameScene.ts` - основной матч.
- `ResultScene.ts` - финальный экран матча.
- `TournamentSetupScene.ts`, `TournamentHubScene.ts`, `TournamentPenaltyScene.ts`, `TournamentCompleteScene.ts` - турнирный контур и пенальти.

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
- `MatchTeamSetup.ts` - snapshot выбранной сборной, состава и GK-комплекта.
- `kitAssetResolver.ts` - runtime resolver экипировок.
- `squadResolver.ts` - связь карт с игроками состава.
- `matchStats.ts` - статистика матча.
- `advantage.ts` - шкала текущего преимущества.

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
3. Игрок берет верхнюю карту атаки из основной колоды.
4. Движок определяет текущую доступную линию соперника.
5. Игрок выбирает цель только из текущей линии.
6. Если цель пробита, полевая карта соперника уходит в `attackBank`.
7. Если пробит вратарь, засчитывается гол.
8. При завершении атаки полевые карты из `attackBank` уходят вниз основной колоды активного игрока и перекрашиваются в его цвет.
9. GK-карта никогда не захватывается и не перекрашивается.
10. Ход переходит сопернику.

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
- кнопка `OUT`;
- кнопки меню/результата;
- табло счета;
- мини-статистика;
- шкала текущего преимущества;
- лог событий.

Карты поля получают профиль игрока через snapshot `state.matchSetups[player.id]`, а не через runtime-чтение localStorage.

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

## 16. Турнир и пенальти

Турнирный контур уже присутствует:

- setup турнира;
- hub турнира;
- симуляция матчей;
- stats и rankings;
- финальный экран турнира;
- отдельный penalty shootout engine.

Пенальти используют свой `PenaltyShootoutEngine` и не должны смешиваться с отдельной GK-колодой обычного матча.

## 17. События игры

Ключевые события:

```text
GAME_STARTED
FIRST_PLAYER_SELECTED
FIELD_RESTORED
FIELD_CARD_RESTORED
ATTACK_CARD_DRAWN
TARGETS_AVAILABLE
CARD_DEFEATED
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
- `gameEngine.test.ts` - атаки, голы, сейвы, штанги, рециклинг GK.
- `matchTeamSetup.test.ts` - snapshot команды и разные GK-комплекты.
- `cardFace.test.ts` - layout карты, tooltip, шрифты, kit render contract.
- `teamKits.test.ts` и `kitAssetResolver.test.ts` - registry и resolver экипировок.
- `validateKits.test.ts` - validator WebP-ассетов.
- `realSquads.test.ts` и `squads.test.ts` - составы.
- tournament tests - турнирная механика и статистика.

На момент обновления документа:

```text
21 test files
255 tests
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
- правила `OUT`;
- wiki-importer;
- исходные `.webp`-ассеты `130 x 150`;
- формат экипировок `public/kits/images/*.webp`;
- локальные шрифты Anton и Oswald;
- tooltip: только фамилия;
- отдельность GK-колоды от основной колоды;
- запрет попадания GK-карты в `attackBank` и основную deck.

Runtime не должен зависеть от Node API (`fs`, `sharp`) и не должен обращаться к Wikipedia/Commons.

## 21. Как использовать этот документ в другом чате GPT

В новом чате можно загрузить этот файл и написать:

```text
Это спецификация моего проекта Total Soccer: Mundial. Используй ее как основной контекст. Помогай развивать проект в соответствии с текущей архитектурой, правилами игры, asset contract и UI-договоренностями.
```

Если нужно просить изменения кода, дополнительно передавайте актуальный `ToDo.md`, релевантные файлы или diff, потому что этот документ фиксирует архитектурное состояние проекта, но не заменяет свежую рабочую задачу.

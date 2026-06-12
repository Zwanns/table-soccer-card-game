# Этап 10 — подключить реальные статические составы

## Цель

Использовать `src/data/realSquads.ts` как единственный источник составов.

## Что сделать

1. Подключить `REAL_SQUADS`, `getRealSquad()` и `requireRealSquad()`.
2. В `src/data/defaultSquads.ts` удалить placeholder-генерацию или заменить ее адаптером к `REAL_SQUADS`.
3. Сохранить совместимый API для существующих runtime-модулей.
4. Обновить read-only adapter:

   * `src/services/squadStorage.ts`
5. `loadSquad(flagCode)` должен возвращать deep copy реального состава.
6. Не использовать `localStorage`.
7. Проверить runtime-потребителей:

   * `MatchTeamSetup.ts`
   * `squadResolver.ts`
   * `cardPlayerProfile.ts`
   * `SquadEditorScene.ts`
   * `GameScene.ts`
   * `TournamentPenaltyScene.ts`

## Требования к данным

Для каждой сборной:

* `14` полевых игроков;
* `1` GK;
* все rank:

  * `2,3,4,5,6,7,8,9,10,J,Q,K,A,JOKER`
* `goalkeeper.id = 'gk'`
* `goalkeeper.shirtNumber = 1`
* `JOKER.shirtNumber = 18`
* нет placeholder-имен;
* нет номера `99`.

## Тесты

Создать или обновить:

* `src/tests/realSquads.test.ts`
* `src/tests/squads.test.ts`
* `src/tests/squadStorage.test.ts`

Проверить:

* ровно `64` состава;
* ровно `960` игроков;
* все `flagCode` совпадают с `NATIONAL_TEAMS`;
* нет лишних составов;
* номера уникальны внутри команды;
* `getRealSquad()` и `requireRealSquad()` работают;
* runtime не использует placeholder;
* runtime не использует `localStorage`.

## Не делать

* Не менять фамилии.
* Не менять номера.
* Не менять распределение rank.
* Не внедрять формы `.webp`.
* Не внедрять GK-колоду.

## Проверка

```bash
npm run validate:kits
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 11 — обновить контракт ассетов экипировок

## Цель

Перейти с `.png` на `.webp` и новый формат `130 × 150 px`.

## Что изменить

Обновить:

* `src/data/teamKits.ts`
* `public/kits/README.md`
* `scripts/validate-kits.ts`
* тесты validator и team kits.

## Новые пути

Все ассеты лежат в:

```text
public/kits/images/
```

Полевые формы:

```text
kits/images/<flagCode>.webp
```

Fallback:

```text
kits/images/none.webp
```

GK:

```text
kits/images/gk1.webp
kits/images/gk2.webp
```

## Размеры

Добавить:

```ts
export const KIT_IMAGE_SIZE = {
  width: 130,
  height: 150,
} as const;
```

## Цвет номера

В `TeamKitStyle` оставить:

```ts
shirtNumberColor: '#RRGGBB';
shirtNumberStrokeColor: '#RRGGBB';
```

Формат:

```text
#RRGGBB
```

Пока пользователь не заполнил цвета вручную, использовать:

```ts
shirtNumberColor: '#111111';
shirtNumberStrokeColor: '#FFFFFF';
```

## GK-типы

Использовать:

```ts
export type GoalkeeperKitId =
  | 'gk1'
  | 'gk2';
```

Не использовать:

```text
gk-1
gk-2
gk-3
gk-4
```

## Registry

Для форм сборных оставить registry доступных файлов.

Для обязательных служебных файлов:

```text
none.webp
gk1.webp
gk2.webp
```

не использовать условный registry: validator должен требовать их наличие.

## Validator

Проверять:

* формат `.webp`;
* размер `130 × 150`;
* читаемость;
* наличие `none.webp`;
* наличие `gk1.webp`;
* наличие `gk2.webp`;
* корректный формат цветов;
* пути только из `kits/images/`.

## Не делать

* Не менять `CardView`.
* Не менять механику матча.
* Не менять GK-колоду.

## Проверка

```bash
npm run validate:kits
npm test
npm run build
```

После отчета остановиться.

---

# Этап 12 — обновить resolver и BootScene

## Цель

Загружать `.webp` и использовать `none.webp` вместо Graphics-fallback.

## Что изменить

Обновить:

* `src/game/kitAssetResolver.ts`
* `src/scenes/bootKitAssets.ts`
* `src/scenes/BootScene.ts`
* тесты resolver и BootScene.

## Resolver полевой формы

Для команды вернуть:

```ts
type ResolvedTeamKitAsset = {
  assetKey: string;
  shirtNumberColor: string;
  shirtNumberStrokeColor: string;
};
```

Правила:

1. Если форма команды зарегистрирована:

   ```text
   kits/images/<flagCode>.webp
   ```
2. Если формы нет:

   ```text
   kits/images/none.webp
   ```

Не использовать Graphics-fallback.

## Resolver GK

Для:

```text
gk1
gk2
```

возвращать:

```text
kits/images/gk1.webp
kits/images/gk2.webp
```

## BootScene

Загружать:

* все зарегистрированные формы команд;
* `none.webp`;
* `gk1.webp`;
* `gk2.webp`.

## Запрещено

* `public/kits/imported/`
* Wikipedia API
* Commons API
* `sharp` в runtime
* `fs`
* сетевые запросы из runtime

## Тесты

Проверить:

* зарегистрированная команда → свой `.webp`;
* незарегистрированная команда → `none.webp`;
* неизвестный `flagCode` → `none.webp`;
* `gk1` и `gk2` загружаются всегда;
* runtime не использует `.png`;
* runtime не использует `imported/`.

## Проверка

```bash
npm run validate:kits
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 13 — обновить рендер карты под новый layout

## Цель

Разместить форму, rank и номер по новой схеме.

## Что изменить

Обновить:

* `src/ui/CardView.ts`
* `src/ui/KitCardFaceView.ts`
* `src/ui/kitCardFaceModel.ts`
* тесты CardView.

## Layout открытой карты

Рендерить:

1. белый фон;
2. крупный rank в левом верхнем углу;
3. изображение формы в правой нижней части;
4. номер игрока поверх формы;
5. существующие интерактивные эффекты.

## Rank

Требования:

* только один rank;
* левый верхний угол;
* крупный шрифт;
* черный цвет:

  ```ts
  '#000000'
  ```

Не рендерить:

* нижний перевернутый rank;
* масти.

## Форма

Использовать:

```text
130 × 150 px
```

Разместить:

```text
в правой нижней части карты.
```

Добавить layout-константы в одном месте:

```ts
export const KIT_CARD_LAYOUT = {
  kitWidth: 130,
  kitHeight: 150,

  kitAnchorX: 1,
  kitAnchorY: 1,

  kitOffsetRight: 0,
  kitOffsetBottom: 0,

  shirtNumberX: 0.5,
  shirtNumberY: 0.33,

  rankColor: '#000000',
} as const;
```

При необходимости скорректировать значения после визуальной проверки, но не разбрасывать координаты по коду.

## Номер

Размещать:

```text
по центру формы;
в верхней трети изображения.
```

Использовать:

```ts
shirtNumberX: 0.5
shirtNumberY: 0.33
```

Цвет:

```ts
shirtNumberColor
```

Обводка:

```ts
shirtNumberStrokeColor
```

## Tooltip

Оставить:

```text
<Имя>
№<номер>
Номинал: <rank>
```

## Закрытые карты

Не менять.

## Тесты

Проверить:

* используется `.webp`;
* fallback = `none.webp`;
* форма справа снизу;
* rank слева сверху;
* rank черный;
* номер в верхней трети формы;
* имя не рендерится постоянно;
* tooltip работает;
* нет мастей;
* нет нижнего rank;
* нет Graphics-fallback.

## Проверка

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 14 — snapshot матча и разные GK-экипировки

## Цель

Гарантировать разные GK-формы двух команд в каждом матче.

## Что изменить

Обновить:

* `src/game/MatchTeamSetup.ts`
* точки создания матча;
* тесты setup и GameEngine.

## MatchTeamSetup

Использовать:

```ts
export type MatchTeamSetup = {
  flagCode: string;
  squad: NationalTeamSquad;
  goalkeeperKitId: GoalkeeperKitId;
};
```

## Назначение GK-форм

При создании матча:

1. Для команды 1 выбрать через seeded random:

   ```text
   gk1
   ```

   или:

   ```text
   gk2
   ```
2. Для команды 2 автоматически назначить оставшийся вариант.

Пример:

```text
team 1 -> gk1
team 2 -> gk2
```

или:

```text
team 1 -> gk2
team 2 -> gk1
```

## Требования

* у команд всегда разные GK-формы;
* выбор детерминирован при одинаковом seed;
* после старта матча GK-форма не меняется;
* snapshot состава не меняется;
* не читать `localStorage`;
* захваченная полевая карта использует:

  * форму новой команды;
  * игрока того же rank новой команды;
  * номер новой команды;
  * tooltip новой команды.

## Не делать

* Не внедрять отдельную GK-колоду.
* Не менять правила гола.
* Не менять правила сэйва.
* Не менять правила штанги.

## Тесты

Проверить:

* team 1 получает `gk1` или `gk2`;
* team 2 получает оставшийся kit;
* kits всегда различаются;
* одинаковый seed дает одинаковое распределение;
* snapshot стабилен;
* захваченная карта использует новую команду.

## Проверка

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 15 — отдельная GK-колода

## Цель

Отделить карты GK от основной колоды.

## Что создать

Создать:

* `src/cards/GoalkeeperCard.ts`
* `src/cards/GoalkeeperDeck.ts`
* `src/cards/createGoalkeeperDeck.ts`
* тесты GK-колоды.

## GK-карты

Колода содержит:

```text
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
```

Не содержит:

```text
2
JOKER
```

## API

```ts
drawTop(): GoalkeeperCard;
returnToBottom(card: GoalkeeperCard): void;
peekTop(): GoalkeeperCard | undefined;
getSize(): number;
```

Использовать seeded random.

## Подключение к полю

Изменить:

* `Player.ts`
* `PlayerField.ts`
* `GameState.ts`
* `fieldRules.ts`
* `GameEngine.ts`
* связанные тесты.

Правила:

```text
goalkeeper -> goalkeeperDeck
defenders -> main deck
midfielders -> main deck
```

Порядок восстановления:

```text
GK
защита
полузащита
```

## Рендер GK

Использовать:

* `squad.goalkeeper.name`
* `squad.goalkeeper.shirtNumber`
* `goalkeeperKitId`
* текущий rank GK-карты.

Tooltip:

```text
<Имя GK>
№<номер>
GK: <rank>
```

## После гола

```text
снять GK-карту;
вернуть вниз goalkeeperDeck;
не захватывать;
не перекрашивать;
не добавлять в attackBank;
не добавлять в main deck.
```

## После сэйва

```text
GK остается на поле;
rank не меняется;
форма не меняется.
```

## После штанги

```text
GK остается на поле;
rank не меняется;
форма не меняется.
```

## Запрещено

* GK-карта в атаке;
* GK-карта в main deck;
* GK-карта в attackBank;
* полевая карта в GK-slot.

## Тесты

Проверить:

* ровно 12 GK-карт;
* нет `2`;
* нет `JOKER`;
* seeded shuffle;
* draw;
* returnToBottom;
* GK-slot берет карту только из GK deck;
* после гола GK возвращается вниз;
* после сэйва остается;
* после штанги остается;
* GK не захватывается.

## Проверка

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 16 — автор гола и статистика

## Цель

Показывать реальные имена авторов голов.

## Что изменить

Обновить:

* `src/game/GameEvent.ts`
* `src/game/matchStats.ts`
* `src/ui/TeamStatsView.ts`
* `src/scenes/ResultScene.ts`
* тесты статистики.

## ScorerSnapshot

Добавить:

```ts
export type ScorerSnapshot = {
  playerName: string;
  shirtNumber: number;
  rank: CardRank;
  flagCode: string;
};
```

При голе сохранять snapshot атакующего игрока.

Не вычислять имя позже повторно.

## Экран матча

Показывать:

```text
Голы: Lewandowski (#17), Zielinski (#11)
```

## ResultScene

Показывать:

```text
Lewandowski (#17), ход 18
```

Если номер хода уже хранится.

## Тесты

Проверить:

* `GOAL_SCORED` содержит snapshot;
* имя и номер реальные;
* snapshot не меняется;
* захваченная карта использует профиль новой команды;
* ResultScene показывает автора.

## Проверка

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 17 — финальная регрессия

## Выполнить

```bash
npm run validate:kits
npm test
npm run build
npm run dev
```

## Проверить вручную

1. Реальные составы отображаются.
2. У каждой команды один GK.
3. Формы команд читаются из `.webp`.
4. Если формы нет — используется `none.webp`.
5. `none.webp`, `gk1.webp`, `gk2.webp` имеют размер `130 × 150`.
6. Форма отображается справа снизу.
7. Rank отображается крупно слева сверху.
8. Rank черный.
9. Номер находится в центре верхней трети формы.
10. Цвет номера берется из конфига команды.
11. В одном матче GK-формы команд различаются.
12. GK-колода отдельная.
13. После гола GK-карта возвращается вниз GK-колоды.
14. После сэйва GK остается.
15. После штанги GK остается.
16. Tooltip работает.
17. Статистика голов работает.
18. `public/kits/imported/` не используется runtime.
19. `sharp` не попадает в runtime.
20. Нет сетевых запросов к Wikipedia и Commons.

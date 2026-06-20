# ТЗ для Codex: смена номинала GK-карты после гола или сэйва

## Контекст

Проект: `Total Soccer: Mundial`
Текущая версия: `1.3.1`
Стек: Phaser 3 + TypeScript + Vite + Vitest.

В игре у каждой команды есть отдельная GK-колода. GK-карта не смешивается с основной колодой, не попадает в `attackBank` и не захватывается атакующим игроком.

Текущая GK-колода содержит 12 карт:

```text
3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A
```

В GK-колоде нет:

```text
2
JOKER
```

Каждая GK-карта создается как отдельная карта с id:

```text
GK_3
GK_4
GK_5
GK_6
GK_7
GK_8
GK_9
GK_10
GK_J
GK_Q
GK_K
GK_A
```

Каждого GK-номинала в GK-колоде ровно по одной карте.

---

## Цель

Добавить новую механику:

После удара по воротам номинал GK-карты может измениться.

Правила:

```text
GOAL_SCORED      -> GK-карта возвращается вниз GK-колоды, поле защищавшейся команды очищается, новый GK будет взят при следующем восстановлении поля.
GOALKEEPER_SAVE  -> текущая GK-карта возвращается вниз GK-колоды, новая GK-карта берется сверху, GK-slot остается занят.
GOALPOST_HIT     -> GK-карта не меняется.
```

Визуально при `GOALKEEPER_SAVE` смена GK-rank должна выглядеть не как замена карты, а как прокрутка номинала на той же карте, похожая на барабан игрового автомата.

Для `GOAL_SCORED` отдельную анимацию прокрутки делать не обязательно, потому что после гола поле защищавшейся команды очищается, а новый GK будет показан при следующем восстановлении поля.

---

## Важные игровые решения

### 1. Источник нового номинала

Использовать честную замену через GK-колоду.

Не выбирать случайный rank вручную.

Алгоритм:

```text
1. взять текущую GK-карту с поля;
2. вернуть ее вниз GK-колоды защищавшейся команды;
3. взять верхнюю карту из GK-колоды;
4. поставить ее в GK-slot.
```

Так как каждого GK-rank в колоде по одной карте, текущий rank не может сразу выпасть повторно, если замена сделана через `returnToBottom(currentGkCard)` перед `drawTop()`.

---

### 2. После гола

При событии `GOAL_SCORED`:

```text
1. гол засчитывается;
2. текущая GK-карта возвращается вниз GK-колоды защищавшейся команды;
3. GK-карта не добавляется в attackBank;
4. поле защищавшейся команды очищается;
5. ход завершается;
6. при следующем восстановлении поля GK-slot получит новую GK-карту из GK-колоды.
```

Важно:

* не нужно сразу ставить новую GK-карту на очищенное поле;
* новая GK-карта появится стандартно через восстановление поля;
* текущий контракт очистки поля после гола сохраняется.

---

### 3. После сэйва

При событии `GOALKEEPER_SAVE`:

```text
1. сэйв фиксируется;
2. текущая GK-карта возвращается вниз GK-колоды защищавшейся команды;
3. новая GK-карта берется сверху GK-колоды;
4. новая GK-карта ставится в тот же GK-slot;
5. визуально это отображается как прокрутка rank на той же карте;
6. атака завершается;
7. ход переходит сопернику.
```

Важно:

* GK-slot остается занят;
* визуально карта не должна улетать и заменяться другой картой;
* должна меняться только надпись rank;
* форма/рамка/позиция GK-карты должны оставаться на месте.

---

### 4. При штанге

При событии `GOALPOST_HIT`:

```text
GK-карта не меняется.
```

Важно:

* текущая GK-карта остается на поле;
* rank не меняется;
* GK-карта не возвращается в колоду;
* новая GK-карта не тянется;
* штанга остается отдельным событием, не равным сэйву.

---

## Изменения в GameEngine

Основной файл:

```text
src/game/GameEngine.ts
```

Нужно найти логику обработки удара по GK.

Ожидаемые события:

```text
SHOT_ON_GOAL
GOAL_SCORED
GOALKEEPER_SAVE
GOALPOST_HIT
GOALKEEPER_CARD_RECYCLED
```

### Для GOAL_SCORED

Текущую GK-карту защищавшегося игрока нужно вернуть вниз его GK-колоды до очистки поля или в рамках текущего существующего recycle-процесса.

Если сейчас уже есть логика `GOALKEEPER_CARD_RECYCLED` после гола, ее нужно сохранить и привести к новому контракту:

```text
после гола GK возвращается вниз GK-колоды,
но новая GK-карта не ставится сразу,
потому что поле очищается.
```

---

### Для GOALKEEPER_SAVE

Добавить новую логику recycle + draw:

```ts
const currentGoalkeeperCard = defendingPlayer.field.goalkeeper;

if (currentGoalkeeperCard) {
  defendingPlayer.goalkeeperDeck.returnToBottom(currentGoalkeeperCard);
  const nextGoalkeeperCard = defendingPlayer.goalkeeperDeck.drawTop();

  if (nextGoalkeeperCard) {
    defendingPlayer.field.goalkeeper = nextGoalkeeperCard;
  }
}
```

Псевдокод адаптировать под актуальные типы проекта.

Нужно учесть:

* `goalkeeper` slot содержит GK-карту, не обычную карту;
* если по какой-то причине `drawTop()` вернул `undefined`, игра не должна падать;
* но в нормальном сценарии колода не должна быть пустой, потому что текущая карта возвращается вниз перед draw.

---

## Новое событие

Добавить отдельное событие:

```text
GOALKEEPER_RANK_CHANGED
```

Файл:

```text
src/game/GameEvent.ts
```

Событие нужно для UI-анимации прокрутки rank.

Контракт события:

```ts
{
  type: 'GOALKEEPER_RANK_CHANGED';
  playerId: Player['id'];          // защищавшийся игрок, чей GK изменился
  turnNumber: number;
  previousCard: GoalkeeperCard;
  nextCard: GoalkeeperCard;
}
```

Можно использовать имена `oldCard` / `newCard`, если так лучше соответствует стилю проекта, но важно сохранить смысл:

```text
previousCard = GK-карта до смены
nextCard = GK-карта после смены
```

Когда создавать событие:

```text
GOALKEEPER_SAVE -> да
GOAL_SCORED     -> опционально, только если это полезно для логов, но UI-анимация после гола не обязательна
GOALPOST_HIT    -> нет
```

Рекомендованный вариант:

* для `GOALKEEPER_SAVE` обязательно логировать `GOALKEEPER_RANK_CHANGED`;
* для `GOAL_SCORED` можно не логировать `GOALKEEPER_RANK_CHANGED`, если новая карта не ставится на поле сразу;
* существующий `GOALKEEPER_CARD_RECYCLED` после гола оставить для recycle-логики.

---

## Изменения в GameScene

Основной файл:

```text
src/scenes/GameScene.ts
```

Нужно добавить визуальную анимацию для события:

```text
GOALKEEPER_RANK_CHANGED
```

### Требование к анимации

При сэйве:

```text
1. показывается обычная анимация сэйва;
2. затем на GK-карте прокручивается rank;
3. карта остается на той же позиции;
4. в конце показывается новый rank;
5. после этого ход завершается / UI переходит к следующему состоянию.
```

Визуально:

```text
A -> J -> 8 -> Q -> 4 -> 10 -> 5
```

Это должно выглядеть как барабан автомата в казино.

### Важные требования

* не заменять всю карту визуально;
* не делать fly-out / fly-in новой карты;
* не менять kit/рамку/позицию;
* прокручивать только текст rank;
* итоговый rank должен совпадать с `nextCard.rank` из события;
* анимация не должна ломать render pipeline;
* интерактивность во время анимации должна быть заблокирована так же, как во время других attack animations.

---

## Где лучше реализовать animation helper

Возможные варианты:

### Вариант A

Добавить метод в `GameScene`:

```ts
private animateGoalkeeperRankChange(event: GoalkeeperRankChangedEvent): Promise<void>
```

или в текущем стиле проекта через Phaser tween/callback.

### Вариант B

Добавить метод в `CardView`:

```ts
animateRankScroll(fromRank: string, toRank: string): Promise<void>
```

Это предпочтительнее, если `CardView` уже управляет отображением rank через `KitCardFaceView`.

Но нужно не усложнять `CardView`, если это нарушит существующую архитектуру.

---

## Рекомендованная реализация анимации

Если rank-текст доступен внутри `KitCardFaceView`, лучше добавить публичный метод:

```ts
animateRankRoll(targetRank: string, options?: {
  durationMs?: number;
  steps?: string[];
}): Promise<void>;
```

Пример поведения:

```text
duration: 700-900 ms
steps: 8-12 смен rank
финальный rank: nextCard.rank
```

Допустимая последовательность прокрутки:

```ts
const GK_RANK_ROLL_SEQUENCE = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
```

Можно прокручивать по этой последовательности несколько шагов и остановиться на `nextCard.rank`.

Важно:

* не использовать `Math.random()` в логике выбора итогового rank;
* визуальная промежуточная последовательность может быть декоративной, но лучше сделать ее детерминированной или простой циклической;
* итог всегда берется из события `GOALKEEPER_RANK_CHANGED`.

---

## Render pipeline: важный момент

После `GameEngine` сменит GK-карту, `GameState` уже будет содержать новую GK-карту.

Чтобы UI не потерял старый rank, событие `GOALKEEPER_RANK_CHANGED` должно содержать:

```text
previousCard
nextCard
```

Тогда `GameScene` может:

```text
1. найти GK CardView защищавшегося игрока;
2. временно показать previousCard.rank, если render уже показал nextCard.rank;
3. проиграть прокрутку;
4. завершить на nextCard.rank.
```

Если текущий render pipeline проще устроен через полное пересоздание `CardView`, нужно аккуратно встроить анимацию так, чтобы она не исчезала из-за повторного render.

---

## Изменения в CardView / KitCardFaceView

Вероятные файлы:

```text
src/ui/CardView.ts
src/ui/KitCardFaceView.ts
src/ui/kitCardFaceModel.ts
```

Нужно проверить, где именно создается rank-текст.

Если rank-текст сейчас private и недоступен, можно добавить безопасный публичный метод только для анимации:

```ts
setDisplayRank(rank: string): void
```

и/или

```ts
animateDisplayRankRoll(finalRank: string): Promise<void>
```

Важно:

* не менять layout открытой карты;
* не менять face-down варианты;
* не менять squad-preview;
* не менять rank `N` в Teams preview;
* не менять tooltip;
* не менять игровую логику обычных карт.

---

## Звуки

На первом этапе звук прокрутки можно не добавлять.

Если добавлять звук позже, обязательно использовать:

```text
src/audio/playSoundSafe.ts
```

В этом ТЗ звук не обязателен.

---

## AI

AI-логику менять минимально.

Проверить, что:

* после сэйва AI видит новый GK-rank из актуального `GameState`;
* AI не кеширует старую GK-карту;
* AI не использует private-поля GK-колоды.

Если AI работает только через `GameEngine` и свежий `GameState`, отдельные изменения в `aiDecision.ts` могут не понадобиться.

---

## Статистика

Не менять подсчет:

```text
goals
shots
saves
goalposts
possession
advantage
scorers
```

`GOALKEEPER_RANK_CHANGED` не должен:

* увеличивать shots;
* увеличивать saves;
* менять possession;
* считаться `CARD_DEFEATED`;
* влиять на `advantage`.

---

## Тесты

Обновить или добавить тесты в:

```text
src/tests/gameEngine.test.ts
src/tests/gameSceneEventEffects.test.ts
src/tests/cardFace.test.ts
```

При необходимости также:

```text
src/tests/goalkeeperDeck.test.ts
src/tests/project.test.ts
```

---

### GameEngine tests

Добавить тесты:

#### 1. После GOALKEEPER_SAVE GK-карта меняется

Сценарий:

```text
defending GK = A
после сэйва A возвращается вниз GK-колоды
новая верхняя GK-карта становится goalkeeper slot
GK-slot остается занят
новый rank отличается от A при стандартной 12-card GK-deck
```

Проверить:

```text
GOALKEEPER_SAVE есть в событиях
GOALKEEPER_RANK_CHANGED есть в событиях
previousCard.rank = старый rank
nextCard.rank = новый rank
state.defender.field.goalkeeper.rank = nextCard.rank
```

---

#### 2. После GOALPOST_HIT GK-карта не меняется

Сценарий:

```text
attacker rank == goalkeeper rank
```

Проверить:

```text
GOALPOST_HIT есть
GOALKEEPER_RANK_CHANGED нет
goalkeeper slot содержит ту же карту
GK-deck order не меняется или не выполняется recycle
```

---

#### 3. После GOAL_SCORED текущая GK-карта возвращается вниз колоды

Сценарий:

```text
attacker пробивает goalkeeper
```

Проверить:

```text
GOAL_SCORED есть
GOALKEEPER_CARD_RECYCLED есть, если это существующий контракт
GK-карта не попадает в attackBank
поле защищавшейся команды очищено
при следующем восстановлении поля GK-slot получает новую карту из GK-колоды
```

Важно:

```text
после гола новую GK-карту не нужно ставить сразу, если поле очищается.
```

---

#### 4. GK-карта не попадает в основную deck

Проверить, что после save/goal:

```text
GK-карта остается только в goalkeeperDeck или goalkeeper slot
не попадает в main deck
не попадает в attackBank
```

---

### GameScene / UI tests

Если текущая тестовая инфраструктура позволяет:

Проверить, что при событии:

```text
GOALKEEPER_RANK_CHANGED
```

вызывается animation/helper прокрутки rank.

Можно не тестировать сам Phaser tween пиксельно. Достаточно проверить:

```text
GameScene распознает событие
анимация получает previousCard.rank и nextCard.rank
интерактивность блокируется во время анимации
после анимации render показывает nextCard.rank
```

---

### CardView / KitCardFaceView tests

Если будет добавлен метод:

```ts
setDisplayRank()
animateDisplayRankRoll()
```

проверить:

```text
можно временно сменить отображаемый rank
финальный rank совпадает с переданным
layout не меняется
rank N для squad preview продолжает работать
face-down варианты не затронуты
```

---

## Обновить спецификацию проекта

Обновить:

```text
PROJECT_SPEC_FOR_CHATGPT.md
```

Добавить в раздел про GK:

```text
После GOALKEEPER_SAVE текущая GK-карта возвращается вниз GK-колоды, новая GK-карта берется сверху и остается в GK-slot. В UI это отображается как прокрутка rank на той же карте.

После GOAL_SCORED текущая GK-карта возвращается вниз GK-колоды, поле защищавшейся команды очищается, новая GK-карта будет взята при следующем восстановлении поля.

После GOALPOST_HIT GK-карта не меняется.
```

Также добавить новое событие:

```text
GOALKEEPER_RANK_CHANGED
```

если оно будет введено.

---

## Важные ограничения

Не менять:

```text
основную deck
обычные card rules
special beat rules
midfielder commit rules
counterattack gap
squad-preview
team cover fallback
GK-kit assignment
penalty shootout engine
tournament simulation
AI fairness contract
```

Особенно важно:

```text
PenaltyShootoutEngine не должен использовать эту механику.
```

Эта механика относится только к обычному визуальному матчу `GameEngine` / `GameScene`.

---

## Проверка

После реализации выполнить:

```bash
npm test
npm run build
```

Если менялись ассеты или kit-related code, дополнительно:

```bash
npm run validate:kits
```

Но для этой задачи `validate:kits` скорее всего не нужен.

---

## Финальный ответ Codex должен содержать

1. Какие файлы изменены.
2. Как реализована смена GK-rank после `GOALKEEPER_SAVE`.
3. Что происходит после `GOAL_SCORED`.
4. Что происходит после `GOALPOST_HIT`.
5. Какое событие добавлено для UI-анимации.
6. Как реализована анимация прокрутки rank.
7. Какие тесты добавлены или обновлены.
8. Результат `npm test`.
9. Результат `npm run build`.

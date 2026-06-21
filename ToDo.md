# ТЗ для Codex: вернуть полноценную анимацию сообщений GOAL!! и Goalkeeper!!

## Контекст

После последней правки сообщения `GOAL!!`, `Goalkeeper!!` и `Post!` были перенесены так, чтобы появляться одновременно со звуком и анимацией удара по воротам.

Проблема: `GOAL!!` и `Goalkeeper!!` теперь появляются только на короткое мгновение и потеряли свою нормальную flying-анимацию.

Нужно исправить это поведение.

---

## Цель

Сохранить правильный timing:

```text
GOAL!! появляется одновременно со звуком и анимацией гола
Goalkeeper!! появляется одновременно со звуком и анимацией сэйва
Post! появляется одновременно со звуком и анимацией штанги
```

Но при этом вернуть полноценную длительность и анимацию сообщений:

```text
сообщение появляется
увеличивается / всплывает / двигается как раньше
остается видимым достаточно долго
плавно исчезает
```

---

## Где искать

Основные файлы:

```text
src/scenes/GameScene.ts
src/scenes/gameSceneEventEffects.ts
src/tests/gameSceneEventEffects.test.ts
src/tests/gameScene.test.ts
```

Возможные связанные места:

```text
showFlyingMessage
createFlyingMessage
finishGoalkeeperShotBallImpact
GOALKEEPER_SAVE
GOAL_SCORED
GOALPOST_HIT
GOALKEEPER_RANK_CHANGED
```

---

## Вероятная причина

Скорее всего, после переноса сообщений в `finishGoalkeeperShotBallImpact` flying message стал запускаться внутри короткого callback/promise/tween, который завершается быстро, либо сообщение уничтожается вместе с временными объектами impact-анимации.

Нужно разделить:

```text
impact animation lifecycle
```

и

```text
flying message lifecycle
```

Сообщение должно стартовать одновременно с impact-анимацией, но жить по собственному tween/duration, а не исчезать сразу после завершения impact.

---

## Что нужно сделать

### 1. Проверить старую реализацию flying message

Найти, как до последней правки создавались `GOAL!!` и `Goalkeeper!!`.

Нужно вернуть тот же механизм анимации, но запускать его раньше.

Правильная логика:

```text
start sound
start ball/impact animation
start flying message animation
await impact animation
then continue next effects
```

Но не нужно делать так:

```text
start message
await impact
destroy message
```

---

### 2. GOAL!!

Для `GOAL_SCORED`:

* сообщение `GOAL!!` должно стартовать одновременно со звуком и goal impact;
* размер `GOAL!!` оставить увеличенным, как после последней правки;
* сообщение должно использовать полноценную flying-анимацию;
* сообщение не должно исчезать через долю секунды.

Ожидаемо:

```text
GOAL!! видно достаточно долго, как раньше, но появляется раньше.
```

---

### 3. Goalkeeper!!

Для `GOALKEEPER_SAVE`:

* сообщение `Goalkeeper!!` должно стартовать одновременно со звуком и save impact;
* затем должна идти анимация смены GK-rank;
* сообщение не должно повторяться после `GOALKEEPER_RANK_CHANGED`;
* сообщение не должно исчезать мгновенно.

Ожидаемый порядок:

```text
save impact + sound + Goalkeeper!! flying message
затем GK rank roll
переход хода
```

---

### 4. Post!

Проверить `Post!` тоже.

Если `Post!` работает нормально — не ломать.
Если тоже исчезает слишком быстро — применить тот же фикс.

---

## Важные требования

1. Не возвращать позднее появление `Goalkeeper!!` после `GOALKEEPER_RANK_CHANGED`.
2. Не создавать второе сообщение `Goalkeeper!!`.
3. Не задерживать звук до окончания rank-roll.
4. Не задерживать goal/save/post impact ради сообщения.
5. Не менять игровую логику.
6. Не менять `GameEngine`.
7. Не менять событие `GOALKEEPER_RANK_CHANGED`.
8. Не менять новую логику `ATTACK_DECK_EMPTY`.
9. Не менять версию приложения, если пользователь отдельно не попросит.

---

## Рекомендованный подход

Если сейчас в `finishGoalkeeperShotBallImpact` есть что-то похожее на:

```ts
this.showFlyingMessage(effect.flyingMessage);
```

нужно проверить, возвращает ли `showFlyingMessage` Promise и не ожидается ли он неправильно.

Предпочтительно:

```ts
void this.showFlyingMessage(effect.flyingMessage, options);
await this.playGoalkeeperShotImpact(...);
```

или:

```ts
const messageAnimation = this.showFlyingMessage(...);
await this.playGoalkeeperShotImpact(...);
// не уничтожать message здесь
```

Если `showFlyingMessage` сама управляет временем жизни сообщения, ее нужно запускать независимо от короткой impact-анимации.

---

## Тесты

Обновить тесты:

```text
src/tests/gameSceneEventEffects.test.ts
src/tests/gameScene.test.ts
```

Добавить/проверить:

1. `GOAL_SCORED` запускает `GOAL!!` на событии goal impact.
2. `GOAL!!` использует flying-message animation lifecycle, а не короткий impact lifecycle.
3. `GOALKEEPER_SAVE` запускает `Goalkeeper!!` до `GOALKEEPER_RANK_CHANGED`.
4. `GOALKEEPER_RANK_CHANGED` не запускает `Goalkeeper!!`.
5. `Goalkeeper!!` не уничтожается сразу после impact tween.
6. `Post!` продолжает появляться на `GOALPOST_HIT`.

Не нужно делать pixel-perfect тест. Достаточно проверить вызовы helper-методов, порядок событий и параметры duration/tween, если они доступны.

---

## Ручная проверка

После исправления проверить в браузере:

```text
1. Запустить матч.
2. Добиться гола.
3. Проверить:
   - GOAL!! появляется сразу со звуком/анимацией;
   - GOAL!! видно не мгновение, а нормально анимируется.
4. Добиться сэйва GK.
5. Проверить:
   - Goalkeeper!! появляется сразу со звуком/анимацией;
   - затем идет смена GK-rank;
   - Goalkeeper!! не появляется второй раз;
   - сообщение не исчезает мгновенно.
6. Добиться штанги.
7. Проверить:
   - Post! появляется сразу;
   - Post! не потерял анимацию.
```

---

## Проверка команд

Выполнить:

```bash
npm test
npm run build
```

---

## Финальный ответ Codex должен содержать

1. Какие файлы изменены.
2. Почему сообщения исчезали слишком быстро.
3. Как возвращена полноценная flying-анимация.
4. Как сохранен ранний timing сообщений.
5. Подтверждение, что `Goalkeeper!!` больше не появляется после `GOALKEEPER_RANK_CHANGED`.
6. Подтверждение, что `GOAL!!` остался увеличенным.
7. Результат `npm test`.
8. Результат `npm run build`.

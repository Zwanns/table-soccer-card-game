# ТЗ для Codex: проверить и стабилизировать звук гола при GOAL_SCORED

## Контекст

Проект: `Total Soccer: Mundial`.

После последних правок сообщения `GOAL!!`, `Goalkeeper!!`, `Post!` были синхронизированы со звуком и анимацией удара по воротам.

Пользователь заметил, что один раз при забитом голе звук гола не проигрался.

Нужно проверить, почему это могло произойти, и сделать запуск звука гола более надежным.

---

## Цель

Гарантировать, что при каждом событии:

```text
GOAL_SCORED
```

звук гола запускается стабильно и синхронно с:

```text
GOAL!! message
goal animation / impact pulse
```

---

## Где искать

Основные файлы:

```text
src/scenes/GameScene.ts
src/scenes/gameSceneEventEffects.ts
src/audio/playSoundSafe.ts
src/tests/gameSceneEventEffects.test.ts
src/tests/gameScene.test.ts
src/tests/project.test.ts
```

Также проверить загрузку звуков:

```text
src/scenes/BootScene.ts
```

И реальные asset paths:

```text
public/sounds/
```

---

## Что проверить

### 1. Загружается ли goal sound стабильно

Проверить, что в `BootScene` загружается правильный audio key для гола.

Проверить:

```text
sound key
file path
file name
case sensitivity
```

Особенно убедиться, что в production используется правильный путь с учетом регистра букв.

---

### 2. Используется ли `playSoundSafe()`

Все звуки в `GameScene` должны запускаться через:

```ts
playSoundSafe(...)
```

Нужно проверить, что goal sound тоже запускается через него.

Если где-то остался прямой вызов:

```ts
this.sound.play(...)
```

заменить на `playSoundSafe()`.

---

### 3. Не привязан ли звук к короткой/уничтожаемой анимации

Проверить свежую логику:

```text
finishGoalkeeperShotBallImpact
getGoalkeeperShotSceneEffect
GOAL_SCORED
```

Звук должен запускаться в начале обработки goal impact, а не в конце promise/tween и не после удаления временных объектов.

Правильный порядок:

```text
start goal sound
start GOAL!! message
start goal impact animation
await impact animation
continue turn flow
```

---

### 4. Не подавляется ли повторный звук

Если голы происходят близко друг к другу или звук предыдущего гола еще играет, Phaser/browser может вести себя нестабильно.

Проверить:

* не используется ли один и тот же sound instance;
* не настроен ли `detune`, `rate`, `volume` некорректно;
* не вызывается ли `stopByKey()` или `sound.stopAll()` рядом с goal effect;
* не уничтожается ли scene/audio manager до проигрывания.

Если нужно, можно перед `playSoundSafe()` для goal sound использовать независимый запуск нового instance.

---

### 5. Не теряется ли effect из-за `GOALKEEPER_RANK_CHANGED`

При голе `GOALKEEPER_RANK_CHANGED` не должен запускаться. Но нужно проверить, что pipeline goal/save/post effect не смешан.

Для `GOAL_SCORED` должен быть выбран именно goal effect:

```ts
getGoalkeeperShotSceneEffect('goal')
```

и goal sound должен быть связан с этим effect.

---

## Возможное улучшение playSoundSafe

Если `playSoundSafe()` сейчас только проверяет наличие key и вызывает `scene.sound.play(key)`, можно аккуратно добавить защитное логирование в dev/test режиме.

Например:

```ts
if (!scene.cache.audio.exists(key)) {
  console.warn(...)
  return false;
}

scene.sound.play(key, config);
return true;
```

Если helper уже возвращает boolean — использовать это в тестах.

Если не возвращает — можно рассмотреть добавление return value:

```ts
true  = звук был запрошен к проигрыванию
false = audio key отсутствует или scene не готова
```

Важно: не ломать существующие вызовы.

---

## Что можно добавить для надежности

Для goal sound можно использовать отдельную небольшую функцию:

```ts
private playGoalSound(): void
```

или общий effect pipeline:

```ts
playGoalkeeperShotEffectSound(effect)
```

Главное:

* запускать звук сразу;
* не ждать окончания message/tween;
* не привязывать звук к уничтожению ball object;
* не запускать второй раз.

---

## Тесты

Обновить или добавить тесты.

Вероятные файлы:

```text
src/tests/gameSceneEventEffects.test.ts
src/tests/gameScene.test.ts
src/tests/project.test.ts
```

### Проверить:

1. `GOAL_SCORED` выбирает goal scene effect.
2. goal scene effect содержит правильный sound key / tone.
3. при `GOAL_SCORED` вызывается `playSoundSafe()` именно в начале impact pipeline.
4. `GOAL!!` message и goal sound запускаются в одном effect-проходе.
5. `GOALKEEPER_SAVE` не использует goal sound.
6. `GOALPOST_HIT` не использует goal sound.
7. если `playSoundSafe()` возвращает false при отсутствующем key, игра не падает.

Если есть mock audio manager, проверить, что при двух последовательных `GOAL_SCORED` вызов звука происходит два раза.

---

## Ручная проверка

После исправления вручную проверить:

```text
1. Запустить матч.
2. Добиться гола.
3. Убедиться, что GOAL!! и звук стартуют одновременно.
4. Повторить несколько голов в одном матче.
5. Проверить, что звук проигрывается каждый раз.
6. Проверить сэйв: играет звук сэйва, не гола.
7. Проверить штангу: играет звук штанги, не гола.
8. Проверить Console на warnings от playSoundSafe.
```

---

## Важные ограничения

Не менять:

```text
GameEngine
GameEvent
правила гола
GK random rank logic
GOALKEEPER_RANK_CHANGED
ATTACK_DECK_EMPTY
match card scale
field positions
```

Если проблема только в `GameScene` / sound pipeline, не трогать игровую логику.

Не поднимать версию приложения, если пользователь отдельно не попросит.

---

## Проверка команд

Выполнить:

```bash
npm test
npm run build
```

---

## Финальный ответ Codex должен содержать

1. Что было потенциальной причиной пропуска goal sound.
2. Какие файлы изменены.
3. Где теперь запускается goal sound.
4. Как гарантируется ранний запуск звука при `GOAL_SCORED`.
5. Проверено ли, что save/post используют свои звуки.
6. Какие тесты добавлены/обновлены.
7. Результат `npm test`.
8. Результат `npm run build`.

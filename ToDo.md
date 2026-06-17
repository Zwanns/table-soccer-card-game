````md
# Total Soccer: Mundial
# Mobile Step 1.1 — исправить смещение кликов после touch-scroll правок

## Контекст

Проверка mobile-landscape Preview на телефоне показала:

Что работает:
- скроллинг пальцем работает хорошо.

Что сломано:
- есть смещение кликов в главном меню;
- есть смещение кликов в меню режимов игры;
- есть смещение кликов в Rules/About;
- есть смещение кликов у нижних кнопок в меню турниров.

Важно:
- раньше после отката кнопки работали корректно;
- после Mobile Step 1 появились touchInput.ts, изменения Button.ts и drag-scroll/hitArea правки;
- глобальные main.ts / index.html / Phaser scale / canvas CSS не менялись.

Значит вероятная причина не в Phaser Scale, а в локальных hitArea / Button / drag-scroll / overlay input zones.

---

## Цель

Исправить смещение кликов, не ломая уже работающий touch-scroll.

Клик должен срабатывать только там, где визуально находится кнопка.

---

## Ветка

Работать только в ветке:

```text
mobile-landscape
````

---

## Проверить файлы

```text
src/ui/touchInput.ts
src/ui/Button.ts
src/scenes/MenuScene.ts
src/scenes/GameScene.ts
src/scenes/TournamentSetupScene.ts
src/scenes/TournamentHubScene.ts
src/scenes/ResultScene.ts
src/tests/touchInput.test.ts
src/tests/menuLayout.test.ts
src/tests/teamSelect.test.ts
src/tests/project.test.ts
```

Если menuLayout.test.ts отсутствует — не создавать без необходимости.

---

# 1. Найти причину смещения

Проверить все места, где после Mobile Step 1 добавлены enlarged hitArea.

Особенно проверить:

```text
setTouchFriendlyInteractive
Button.ts
language buttons
Back buttons
Rules/About buttons
Tournament bottom buttons
drag-scroll hit zones
```

Возможная ошибка:

```text
hitArea расширяется несимметрично;
hitArea задается в глобальных координатах вместо локальных;
hitArea x/y смещены относительно GameObject origin;
для Text/Button origin 0.5, но hitArea считается как будто origin 0;
drag-scroll overlay лежит поверх кнопок;
scroll zone перекрывает нижние кнопки.
```

---

# 2. Исправить Button hitArea

Для общего `Button.ts` нужно убедиться:

если кнопка визуально имеет прямоугольник:

```text
width × height
origin 0.5
```

то hitArea должен быть локальным и центрированным:

```ts
new Phaser.Geom.Rectangle(
  -hitWidth / 2,
  -hitHeight / 2,
  hitWidth,
  hitHeight,
)
```

Если origin 0 / top-left — использовать:

```ts
new Phaser.Geom.Rectangle(0, 0, hitWidth, hitHeight)
```

Нельзя задавать hitArea в scene/global координатах.

---

# 3. Исправить setTouchFriendlyInteractive

Проверить helper в `touchInput.ts`.

Он должен учитывать origin объекта.

Для Phaser Image/Sprite/Text/Container могут быть разные варианты.

Безопасный подход:

```text
Для Button — использовать отдельную explicit hitArea в Button.ts.
Для простых rectangles/list rows — hitArea должна совпадать с визуальным rect.
Не применять универсальное расширение к объектам, у которых origin/size неизвестны.
```

Если текущий универсальный helper ломает координаты — ограничить его использование или сделать параметры:

```ts
setTouchFriendlyInteractive(gameObject, {
  width,
  height,
  originX,
  originY,
})
```

---

# 4. Rules/About и drag-scroll

Проверить, что drag-scroll зона:

```text
не лежит поверх Back / language buttons;
не лежит поверх main menu buttons;
не перехватывает pointerdown за пределами viewport;
не имеет слишком широкой hitArea;
```

Если scroll-zone создается как invisible rectangle, она должна быть строго внутри scroll viewport.

---

# 5. Tournament bottom buttons

Проверить нижние кнопки в tournament screens.

Проблема может быть та же:

```text
button visual rect != button hitArea
```

Исправить через общий Button, а не локальной компенсацией.

---

# 6. Что НЕ менять

Не менять:

```text
main.ts
index.html
Phaser scale config
canvas CSS
viewport meta
game.scale.refresh/updateBounds
GameEngine
AI
Penalty AI
TournamentEngine
PenaltyShootoutEngine
правила игры
assets registry
kits/covers validation
```

Не возвращать старые M-6.2/M-6.4 scale/input эксперименты.

---

# 7. Сохранить то, что работает

Не ломать:

```text
touch-scroll в Rules/About;
touch-scroll в TeamSelect;
touch-scroll в Teams;
touch-scroll в tournament screens;
отключение input у masked hidden rows.
```

---

# 8. Тесты

Добавить/обновить тесты:

```text
Button hitArea совпадает с visual rect по центру;
Button hitArea не смещен влево/вправо;
setTouchFriendlyInteractive для centered object создает centered hitArea;
setTouchFriendlyInteractive для top-left object создает top-left hitArea;
drag-scroll viewport не перекрывает Back/buttons;
tournament bottom buttons имеют корректную local hitArea;
tap outside visual button не срабатывает;
tap left/center/right inside visual button срабатывает.
```

---

# 9. Проверка

Запустить:

```bash
npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev
```

---

# 10. Ручная проверка после Preview deploy

На телефоне в Android Chrome проверить:

```text
1. Главное меню:
   - нажать левее Game modes — не должно срабатывать;
   - нажать по левой/центральной/правой части Game modes — должно срабатывать;
   - то же для Teams, Rules, About.

2. Game modes:
   - каждая кнопка нажимается точно;
   - Back нажимается точно.

3. Rules/About:
   - scroll пальцем работает;
   - Back нажимается точно;
   - EN/PL/UA нажимаются точно;
   - tap рядом с кнопкой не срабатывает.

4. Tournament menus:
   - нижние кнопки нажимаются точно;
   - tap рядом с кнопками не срабатывает.

5. TeamSelect / Teams:
   - scroll пальцем все еще работает.
```

---

# 11. Формат отчета

После выполнения вывести:

```text
Mobile Step 1.1 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Причина смещения:
- ...

Button hitArea:
- ...

touchInput helper:
- ...

Rules/About drag-scroll:
- ...

Tournament bottom buttons:
- ...

Что сохранено:
- touch-scroll:
- TeamSelect scroll:
- Teams scroll:

Что НЕ менялось:
- main.ts:
- index.html:
- Phaser scale:
- canvas CSS:

Изменялись ли GameEngine / AI / TournamentEngine:
- да / нет

Результат validate:kits:
- ...

Результат validate:covers:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...

После отчета остановиться.
```

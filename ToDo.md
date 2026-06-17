````md
# Total Soccer: Mundial
# Mobile Step 1 — touch-scroll и укрупнение основных UI-элементов

## Ветка

Работать только в ветке:

```text
mobile-landscape
````

Не вносить эти изменения в `main`.

---

## Контекст

Игра уже запускается на телефоне в Google Chrome, и в нее можно играть.

Главные неудобства сейчас:

```text
1. Полосы прокрутки / scroll areas плохо работают пальцем.
2. Кнопки в меню маловаты.
3. Карточки команд в списках команд маловаты.
```

Важно: не повторять старую проблему со смещением input.

---

## Главное ограничение

Не менять глобальные настройки canvas/input/scale.

Не менять:

```text
src/main.ts
index.html
глобальный Phaser scale config
viewport meta
canvas CSS width/height/transform
game.scale.refresh / updateBounds логику
```

Если без этого никак — остановиться и сообщить.

---

## Цель этапа

Сделать минимальные безопасные улучшения:

```text
1. Добавить pointer/touch drag-scroll там, где сейчас работает только wheel-scroll.
2. Немного увеличить кнопки главного меню.
3. Немного увеличить карточки команд в списках выбора команд.
4. Не ломать desktop.
5. Не трогать GameEngine / AI / TournamentEngine.
```

---

## Проверить файлы

```text
src/scenes/MenuScene.ts
src/scenes/TeamSelectScene.ts
src/scenes/SquadSelectScene.ts
src/scenes/TournamentSetupScene.ts
src/scenes/TournamentHubScene.ts
src/ui/Button.ts
src/ui/touchInput.ts
src/tests/*
```

Если `touchInput.ts` был откатан и его нет — можно создать небольшой helper только для scroll/hitArea.

---

# 1. Добавить touch drag-scroll

## Где нужно

Проверить и добавить drag-scroll для:

```text
Rules / About modal в MenuScene
Rules / About overlay в GameScene, если там scroll только wheel
TeamSelect список команд
Teams / SquadSelect список команд
TournamentSetup списки команд / групп, если есть scroll
TournamentHub длинные таблицы / статистика, если есть scroll
ResultScene списки авторов голов, если есть scroll
```

## Требования

```text
wheel-scroll на desktop должен остаться;
pointer drag-scroll должен работать на телефоне;
короткий tap не должен считаться scroll;
после drag не должен случайно срабатывать click по элементу;
scroll должен быть ограничен min/max;
скрытые элементы вне mask не должны перехватывать tap.
```

## Рекомендуемый helper

Можно создать helper:

```ts
createDragScrollArea(...)
```

или добавить локально, если в проекте уже есть похожая логика.

Логика:

```text
pointerdown — запомнить startY/startScroll
pointermove — если движение больше 6–8 px, включить dragging
pointerup — если был dragging, заблокировать случайный click
```

---

# 2. Укрупнить кнопки меню

## Где

```text
MenuScene main buttons:
- Game modes
- Teams
- Rules
- About

Game modes submenu buttons
Back buttons
Language buttons EN / PL / UA
```

## Требования

```text
кнопки должны быть удобнее для пальца;
desktop вид не должен стать грубым;
лучше увеличить hitArea, а не обязательно сильно увеличивать визуал;
если визуал увеличивается — умеренно.
```

Примерно:

```text
минимальная touch-зона: 56–64 px по высоте в игровых координатах
```

---

# 3. Укрупнить карточки команд в списках

## Где

```text
TeamSelectScene
SquadSelectScene / Teams
```

## Требования

```text
карточки команд должны быть удобнее для tap;
текст должен оставаться читаемым;
флаги не должны обрезаться;
список должен оставаться доступным через scroll;
desktop layout не должен ломаться.
```

Не менять глобальную ширину canvas.
Не менять Phaser scale.

---

# 4. Не делать на этом этапе

Не делать:

```text
новый mobile layout всего экрана;
изменение Phaser.Scale;
portrait overlay;
изменение main.ts;
изменение index.html;
изменение canvas CSS;
адаптацию GameScene;
адаптацию турниров целиком;
PWA;
Capacitor;
Android app.
```

---

# 5. Тесты

Добавить/обновить тесты:

```text
drag-scroll helper отличает tap от drag;
drag-scroll ограничивает scroll min/max;
Menu buttons имеют touch-friendly hitArea;
TeamSelect карточки имеют увеличенную touch area;
Teams list rows имеют увеличенную touch area;
desktop поведение не сломано.
```

---

# 6. Проверка

Запустить:

```bash
npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev
```

---

# 7. Ручная проверка

На desktop:

```text
1. Главное меню работает.
2. Кнопки нажимаются там, где визуально находятся.
3. Teams открывается.
4. Team selection работает.
```

На телефоне в Google Chrome:

```text
1. Главное меню — кнопки удобнее нажимать.
2. Rules/About — можно прокручивать пальцем.
3. Team selection — список команд можно прокручивать пальцем.
4. Карточки команд удобнее нажимать.
5. Teams — список команд можно прокручивать пальцем.
6. Нет смещения кликов.
```

---

# 8. Формат отчета

После выполнения вывести:

```text
Mobile Step 1 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Что изменено:
- touch-scroll:
- menu buttons:
- team cards:

Что НЕ менялось:
- main.ts:
- index.html:
- Phaser scale:
- canvas CSS:

Desktop:
- ...

Mobile Chrome:
- ...

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

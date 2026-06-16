````md
# Total Soccer: Mundial
# Поэтапная адаптация игры под мобильный браузер v1

## Цель

Адаптировать игру `Total Soccer: Mundial` под мобильный браузер.

Первая мобильная версия делается только под:

```text
Android Chrome
Pixel 10
Landscape orientation
````

Полноценный portrait layout на этом этапе не делать.

Если игрок открыл игру вертикально, нужно показать экран-подсказку:

```text
Please rotate your device
Use landscape mode
```

или близкий по смыслу текст.

---

## Зафиксированные вводные

```text
1. Первая мобильная версия: только горизонтальный режим.
2. Основное тестовое устройство: Pixel 10.
3. Основной браузер: Android Chrome.
4. iPhone Safari пока не является обязательной платформой.
5. Android APK пока не делать.
6. PWA пока не делать.
7. Capacitor пока не подключать.
8. Google Play build пока не делать.
```

---

## Главный принцип

Не переписывать игру с нуля.

Нужно аккуратно добавить mobile-friendly layout поверх текущей desktop-версии.

Desktop-версия не должна ухудшиться.

---

## Что НЕ делать в рамках этой задачи

Не делать:

```text
portrait game layout;
Android APK;
Capacitor;
PWA;
Google Play build;
новые игровые режимы;
новые правила;
новые ассеты;
перерисовку всех сцен с нуля;
оптимизацию под iPhone Safari как обязательную цель.
```

---

# Этап M-0 — аудит текущего layout и scale

## Цель

Понять, как сейчас устроены размеры canvas, сцены, scale mode и жесткие координаты.

На этом этапе код не менять.

## Проверить файлы

```text
src/main.ts
src/config.ts
index.html
src/style.css или текущий CSS-файл

src/scenes/BootScene.ts
src/scenes/MenuScene.ts
src/scenes/GameScene.ts
src/scenes/TeamSelectScene.ts
src/scenes/SquadSelectScene.ts
src/scenes/TournamentSetupScene.ts
src/scenes/TournamentHubScene.ts
src/scenes/TournamentPenaltyScene.ts
src/scenes/ResultScene.ts

src/ui/*
src/tests/*
PROJECT_SPEC_FOR_CHATGPT.md
MATCH_SCREEN_SPEC.md
```

Если названия отличаются — найти по поиску:

```text
Phaser.Scale
scale
width
height
BASE_GAME_WIDTH
BASE_GAME_HEIGHT
FIELD_LEFT
FIELD_TOP
FIELD_WIDTH
FIELD_HEIGHT
resize
orientation
MenuScene
GameScene
SquadSelectScene
Tournament
```

## Нужно выяснить

```text
1. Текущий базовый размер игры.
2. Какой Phaser scale mode используется сейчас.
3. Где задается parent container для canvas.
4. Как canvas центрируется.
5. Есть ли resize/orientationchange обработчики.
6. Какие сцены используют жесткие координаты.
7. Где задаются размеры игрового поля.
8. Какие UI-элементы слишком мелкие для touch.
9. Какие экраны шире всего и хуже всего помещаются на mobile landscape.
10. Где используются scroll areas.
11. Где есть overlay Rules/About.
12. Где может появиться page scroll вокруг canvas.
```

## Отчет после M-0

После аудита вывести:

```text
Этап M-0 завершен.

Созданные файлы:
- нет

Измененные файлы:
- нет

Текущий базовый размер игры:
- ...

Текущий Phaser scale mode:
- ...

Canvas parent:
- ...

Главные responsive-риски:
- ...

Сцены с жесткими координатами:
- ...

Самые проблемные экраны для Pixel 10 landscape:
- ...

Рекомендованный план изменений:
- ...
```

После отчета остановиться.

---

# Этап M-1 — базовая mobile scale-система

## Цель

Сделать так, чтобы Phaser canvas корректно помещался в мобильный viewport в landscape-режиме.

## Требования

```text
desktop-версия должна выглядеть как раньше;
mobile landscape должен показывать всю игру без обрезки;
canvas должен быть центрирован;
не должно быть page scroll вокруг canvas;
не должно быть лишних белых полей;
touch events должны работать;
```

## Рекомендуемая настройка Phaser scale

Проверить `src/main.ts` / `src/config.ts`.

Если текущая архитектура позволяет, использовать или аккуратно привести к схеме:

```ts
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  parent: 'game-container',
  width: BASE_GAME_WIDTH,
  height: BASE_GAME_HEIGHT,
}
```

Если проект уже использует похожий подход — не ломать, а доработать.

## CSS

Проверить `index.html` и CSS.

Рекомендуемая база:

```css
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #000;
  touch-action: none;
}

#game-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
```

Адаптировать под текущую структуру проекта.

## Тесты

Добавить/обновить тесты:

```text
Phaser config использует mobile-friendly scale mode;
game-container занимает viewport;
body/canvas layout не предполагает scroll;
desktop baseline не ломается.
```

## Проверка

Запустить:

```bash
npm test
npm run build
npm run dev
```

## Отчет после M-1

```text
Этап M-1 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Scale mode:
- ...

Canvas parent:
- ...

CSS changes:
- ...

Desktop compatibility:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...
```

После отчета остановиться.

---

# Этап M-2 — экран поворота устройства

## Цель

Если игра открыта на телефоне в вертикальном режиме, показать overlay с просьбой повернуть устройство.

## Поведение

На mobile portrait показывать:

```text
Please rotate your device
Use landscape mode
```

На mobile landscape overlay скрыт.

На desktop overlay не должен мешать.

## Как определять portrait

Минимальная логика:

```ts
const isPortrait = window.innerHeight > window.innerWidth;
```

Дополнительно можно учитывать mobile-like viewport:

```ts
const isSmallViewport = Math.min(window.innerWidth, window.innerHeight) < 700;
```

Не показывать overlay на обычном desktop только потому, что окно браузера стало узким, если это будет мешать разработке.

## Реализация

Предпочтительно сделать HTML/CSS overlay в `index.html` / CSS / небольшом bootstrap script.

Плюсы:

```text
работает до загрузки Phaser scenes;
не зависит от текущей сцены;
не ломает GameScene;
легче управлять через resize/orientationchange.
```

## Требования

```text
overlay поверх canvas;
overlay не уничтожает текущую сцену;
при повороте в landscape игра снова видна;
touch/click под overlay не проходит;
overlay имеет темный фон и читаемый текст;
на desktop разработке не мешает.
```

## Тесты

Проверить:

```text
portrait overlay создается;
landscape overlay скрывается;
resize/orientationchange обновляет состояние;
desktop не блокируется без необходимости.
```

## Проверка

```bash
npm test
npm run build
npm run dev
```

В браузере через DevTools проверить mobile viewport portrait/landscape.

## Отчет после M-2

```text
Этап M-2 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Portrait overlay:
- ...

Landscape behavior:
- ...

Desktop behavior:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...
```

После отчета остановиться.

---

# Этап M-3 — touch-friendly input

## Цель

Сделать основные интерактивные элементы удобными для пальца.

## Минимальная touch-зона

```text
44 × 44 px
```

Если визуальный элемент меньше, hit area должна быть больше.

## Проверить

```text
карты на поле;
колоды;
midfield gap;
кнопки Menu / Result / Rules / About;
Back-кнопки;
кнопки Game modes / Teams / Rules / About;
language buttons EN / PL / UA;
AI checkbox;
слоты команд в tournament setup;
кнопки в penalty scene;
scroll areas;
Rules/About overlays.
```

## Что сделать

```text
увеличить hitArea маленьких кнопок;
не обязательно увеличивать визуальный размер;
проверить pointerdown/pointerup на touch;
проверить, что overlay блокирует input под собой;
после закрытия overlay input возвращается;
scroll areas должны работать пальцем.
```

## Не менять

Не менять правила игры.

Не менять GameEngine.

Не менять AI.

## Тесты

Проверить:

```text
основные кнопки имеют touch-friendly hitArea;
карты остаются кликабельными;
overlay блокирует input;
после закрытия overlay input восстанавливается;
AI не делает лишний ход из-за touch/overlay.
```

## Проверка

```bash
npm test
npm run build
npm run dev
```

## Отчет после M-3

```text
Этап M-3 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Увеличенные hit areas:
- ...

Проверенные элементы:
- ...

Overlay input blocking:
- ...

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
- да / нет

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...
```

После отчета остановиться.

---

# Этап M-4 — mobile landscape layout для GameScene

## Цель

Сделать экран матча читаемым и удобным на Pixel 10 в Android Chrome landscape.

## Главная задача

Текущий desktop layout сохранить, но добавить compact/mobile-landscape layout для меньших viewport.

## Проверить элементы GameScene

```text
верхнее табло;
индикатор превосходства;
кнопки Menu / Result;
кнопки Rules / About;
игровое поле;
карты;
колоды;
мяч-индикатор атаки;
Goals panels;
tooltip игроков;
Rules/About overlay во время матча;
GOAL animation;
AI turn behavior.
```

## Рекомендуемый подход

Создать или расширить layout helper:

```ts
getMatchLayout(viewportWidth, viewportHeight)
```

или аналогичный helper, если в проекте уже есть layout constants.

Он должен возвращать:

```text
field rect;
scoreboard rect;
advantage bar rect;
top buttons rects;
goals panels rects;
deck positions;
card scale;
safe margins.
```

## Требования

```text
desktop layout остается прежним;
mobile landscape получает компактный layout;
игровое поле остается в центре;
карты не выходят за экран;
верхние кнопки не перекрывают табло;
табло остается читаемым;
Goals panels не обрезаются;
Rules/About overlay помещается;
tooltip не вылезает за экран;
не появляется page scroll.
```

## Рекомендуемые тестовые размеры

Проверить layout для:

```text
1280 × 720
1024 × 576
932 × 430
915 × 412
844 × 390
```

Pixel 10 landscape проверить отдельно вручную.

## Тесты

Добавить тесты на чистые layout-функции:

```text
для каждого mobile-size все ключевые rect остаются внутри viewport;
field rect внутри viewport;
scoreboard внутри viewport;
buttons внутри viewport;
deck positions внутри viewport;
goals panels внутри viewport;
минимальные расстояния между элементами соблюдены.
```

## Проверка

```bash
npm test
npm run build
npm run dev
```

Вручную:

```text
1. Открыть quick match.
2. Запустить HUMAN vs AI.
3. Проверить на mobile landscape viewport.
4. Нажать карты.
5. Открыть Rules.
6. Закрыть Back.
7. Открыть About.
8. Проверить, что AI не ходит под overlay.
9. Проверить GOAL animation.
```

## Отчет после M-4

```text
Этап M-4 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

GameScene mobile layout:
- ...

Desktop layout:
- сохранен / изменен

Проверенные viewport sizes:
- ...

Touch behavior:
- ...

Rules/About overlay:
- ...

AI behavior:
- ...

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
- да / нет

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...
```

После отчета остановиться.

---

# Этап M-5 — мобильная адаптация меню

## Цель

Сделать главное меню и вложенные меню удобными на мобильном landscape.

## Проверить

```text
MenuScene;
Game modes;
Rules modal;
About modal;
language switch EN / PL / UA;
Back buttons;
logo scoreboard;
menu buttons.
```

## Требования

```text
logo не обрезается;
кнопки не выходят за экран;
кнопки достаточно крупные для touch;
Back доступен;
Rules/About читаются;
scroll работает пальцем;
desktop вид не ломается.
```

## Особое внимание

У тебя в меню используется scoreboard logo. Нужно убедиться, что на mobile landscape:

```text
табло не слишком большое;
кнопки помещаются под ним;
нет обрезки по высоте;
Back-кнопка видна в модальных окнах.
```

## Тесты

Проверить:

```text
MenuScene помещается в mobile landscape;
game modes buttons видны;
Rules/About modal помещается;
Back button доступен;
language buttons touch-friendly.
```

## Проверка

```bash
npm test
npm run build
npm run dev
```

## Отчет после M-5

```text
Этап M-5 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Menu mobile layout:
- ...

Rules/About:
- ...

Back buttons:
- ...

Desktop compatibility:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...
```

После отчета остановиться.

---

# Этап M-6 — мобильная адаптация TeamSelect и Teams

## Цель

Сделать выбор команд и страницу Teams удобными на mobile landscape.

## Проверить сцены

```text
TeamSelectScene
SquadSelectScene / Teams
```

## TeamSelect требования

```text
список 65 команд должен быть доступен;
команды должны быть touch-friendly;
если сетка не помещается — должен работать scroll или paging;
флаги видны;
названия читаемы;
AI checkbox удобен для touch;
кнопки Back / Start доступны.
```

## Teams требования

```text
список команд слева должен скроллиться;
таблица состава должна читаться;
Back-кнопка видна;
цветные кружки Colors видны;
preview формы виден;
preview рубашки колоды виден;
ничего не обрезается;
scroll работает пальцем.
```

## Важно

Сейчас Teams уже показывает:

```text
Back;
Colors;
preview формы;
preview рубашки колоды;
состав;
индивидуальные kits;
индивидуальные covers.
```

Нужно сохранить это поведение.

## Тесты

Проверить:

```text
TeamSelect открывается на mobile landscape;
Teams открывается на mobile landscape;
список команд доступен;
Back работает;
Colors swatches видны;
preview kit/cover не ломаются;
командные kits/covers продолжают использовать resolver.
```

## Проверка

```bash
npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev
```

Вручную проверить команды:

```text
Ukraine
Armenia
Northern Ireland
France
Spain
England
```

## Отчет после M-6

```text
Этап M-6 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

TeamSelect mobile:
- ...

Teams mobile:
- ...

Scroll:
- ...

Colors:
- ...

Kits/covers:
- ...

Проверенные команды:
- Ukraine:
- Armenia:
- Northern Ireland:
- France:
- Spain:
- England:

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
```

После отчета остановиться.

---

# M-6.2 — исправить mobile input offset и ширину TeamSelect grid

## Контекст

После проверки на телефоне в Android Chrome landscape обнаружены проблемы:

1. Нажатия по кнопкам/командам регистрируются со смещением: фактическая зона клика находится левее визуального элемента.
2. В TeamSelect список команд по ширине уже, чем верхние карточки выбранных команд.
3. На скриншоте видно, что team grid занимает слишком узкую центральную область, хотя сверху выбранные Team 1 / Team 2 карточки шире и выглядят корректнее.

Целевая платформа:
- Pixel 10
- Android Chrome
- landscape only

---

## Главная цель

Исправить:
- соответствие визуальных элементов и Phaser input/hit areas;
- ширину team grid в TeamSelect;
- видимость и удобство выбора команд на телефоне.

---

## Проверить файлы

```text
src/main.ts
src/config.ts
src/styles/main.css
src/ui/teamScreenLayout.ts
src/ui/touchInput.ts
src/scenes/TeamSelectScene.ts
src/scenes/SquadSelectScene.ts
src/tests/teamScreenLayout.test.ts
src/tests/teamSelect.test.ts
src/tests/touchInput.test.ts
1. Исправить смещение input относительно визуального canvas
Проблема

На мобильном устройстве tap по визуальной кнопке срабатывает так, будто hitArea находится левее кнопки.

Это может быть связано с:

CSS 100dvw/100dvh;
canvas centering;
Phaser.Scale.FIT;
разницей между visual viewport и layout viewport;
черными боковыми полями;
неправильным boundingClientRect;
ручным CSS sizing canvas;
safe-area / browser chrome;
Что проверить

Проверить, нет ли конфликта между:

Phaser.Scale.FIT + CENTER_BOTH
и
CSS width/height на canvas или game-container

Особенно проверить:

#game-container canvas
canvas

Если canvas получает ручные CSS width/height, которые конфликтуют с Phaser scale manager, убрать или скорректировать.

Требования
визуальная кнопка и ее hitArea должны совпадать;
tap по центру кнопки должен срабатывать;
tap левее кнопки не должен срабатывать как кнопка;
проблема должна быть исправлена для TeamSelect, Teams и Menu;
desktop не должен сломаться.
Рекомендуемая диагностика

Добавить временный debug только локально или через тестируемый helper:

canvas.getBoundingClientRect()
game.scale.displaySize
game.scale.gameSize
game.scale.canvasBounds

Проверить, что Phaser input manager использует актуальные bounds после resize/orientation.

Если нужно, после resize/orientation вызвать:

this.scale.refresh();

или аналогичный безопасный Phaser Scale refresh, если он есть в текущей версии Phaser.

Важно: не оставлять debug UI в финальном коде.

2. Проверить CSS после добавления 100dvw / 100dvh

В M-6.1 были добавлены:

100dvw / 100dvh

Нужно проверить, не это ли вызвало input offset.

Рекомендуемый подход:

html,
body,
#app,
#game-container {
  width: 100%;
  height: 100%;
  min-width: 100vw;
  min-height: 100vh;
}

Или использовать 100dvh аккуратно только там, где это не ломает Phaser input.

Если 100dvw/100dvh вызывает offset на Android Chrome, заменить на более стабильную схему:

width: 100vw;
height: 100vh;
height: 100dvh;

но не задавать transform/scale вручную.

Запрещено:

CSS transform: scale(...)
ручное позиционирование canvas, которое не знает Phaser input
3. Расширить TeamSelect grid
Проблема

На скриншоте team grid визуально уже, чем верхние карточки Team 1 / Team 2.

Нужно расширить область списка команд.

Требования
team grid должен быть шире;
grid должен визуально соответствовать ширине верхней зоны выбора команд;
использовать доступную ширину между левым и правым safe margin;
не выходить за canvas;
не перекрывать нижние Menu / Start penalties;
scroll должен сохраниться;
drag-scroll должен сохраниться;
tap по команде должен работать.
Рекомендуемое решение

В teamScreenLayout.ts для mobile TeamSelect:

уменьшить боковые отступы;
увеличить gridRect.width;
пересчитать columnWidth;
возможно уменьшить gap между колонками;
оставить 5 колонок, если помещается;
если 5 колонок слишком тесно — использовать 4 более широкие колонки.

На скриншоте сейчас 5 колонок есть, но сами карточки/колонки выглядят слишком узкими. Лучше:

сохранить 5 колонок;
расширить общий grid;
увеличить ширину team row/card;

Проверить, чтобы:

левая граница grid была примерно на уровне левой верхней карточки Team 1;
правая граница grid была примерно на уровне правой верхней карточки Team 2;
4. Исправить hitArea после scroll/mask

Уже было сделано отключение input у элементов вне viewport. Проверить, что после расширения grid:

masked hidden elements не перехватывают tap;
tap по видимой команде срабатывает;
drag не вызывает случайный select;
после scroll позиции hitArea соответствуют новым визуальным позициям.

Если input offset связан с container scroll, проверить, что hitArea задана в локальных координатах объекта, а не в старых глобальных координатах.

5. Проверить TeamSelect нижние кнопки

После расширения grid убедиться:

Menu виден;
Start penalties виден;
нижние кнопки не перекрываются grid;
нижние кнопки имеют нормальную touch-зону;
tap по центру Menu / Start срабатывает.
6. Проверить Teams screen

Такой же input offset может быть и в Teams.

Проверить:

Back нажимается там, где визуально находится;
tap по команде в списке работает по визуальной строке;
Colors / kit / cover не затронуты;
scroll list не перехватывает Back.
7. Тесты

Обновить тесты:

teamScreenLayout mobile grid width больше прежнего и находится внутри canvas;
grid left/right соответствуют safe area;
grid не пересекает action bar;
Back/Start внутри canvas;
touch hit areas считаются от актуальных визуальных rect;
hidden masked rows не интерактивны;
desktop baseline не изменен критично.

Если возможно, добавить smoke test в mobile viewport:

tap по центру Start penalties срабатывает;
tap по центру team row выбирает команду;
tap немного левее row не выбирает, если находится вне row.
8. Не менять

Не менять:

GameEngine
AI
Penalty AI
TournamentEngine
PenaltyShootoutEngine
правила игры
составы
assets registry
kits/covers validation
GameScene layout
MenuScene layout, кроме CSS/input offset фикса если он общий
9. Проверка

Запустить:

npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev
10. Ручная проверка на телефоне

После deploy проверить на Pixel 10 / Android Chrome landscape:

1. Открыть Penalty teams / TeamSelect.
2. Проверить, что tap по центру Menu срабатывает.
3. Проверить, что tap по центру Start penalties срабатывает.
4. Проверить, что tap по команде срабатывает именно по визуальной карточке.
5. Проверить, что tap левее карточки не выбирает ее.
6. Проскроллить team grid.
7. Выбрать команду после scroll.
8. Открыть Teams.
9. Проверить Back.
10. Проверить выбор команды в списке.
11. Формат отчета

После выполнения вывести:

Этап M-6.2 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Причина input offset:
- ...

CSS / Phaser scale:
- ...

TeamSelect grid width:
- ...

Нижние кнопки:
- ...

Touch alignment:
- ...

Scroll/mask input:
- ...

Teams:
- ...

Проверенные размеры:
- ...

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
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
```
---

# M-6.3 — исправить системное смещение Phaser input на мобильном Chrome

## Проблема

На Pixel 10 / Android Chrome landscape все кнопки и карточки реагируют на нажатие со смещением влево.

Симптомы:

```text
1. Правая сторона кнопки не реагирует.
2. Нажатие по правой части карточки команды может выбирать карточку справа.
3. Проблема есть не только в TeamSelect, а во всех кнопках.

Это значит, что проблема системная: координаты Phaser input не совпадают с визуальным положением canvas.

Главная цель

Исправить соответствие:

visual canvas position/size
=
Phaser input coordinates

Нельзя пытаться чинить это расширением hitArea отдельных кнопок.

Проверить файлы
index.html
src/main.ts
src/styles/main.css
src/ui/touchInput.ts
src/ui/Button.ts
src/scenes/TeamSelectScene.ts
src/scenes/SquadSelectScene.ts
src/ui/teamScreenLayout.ts
src/tests/touchInput.test.ts
src/tests/teamSelect.test.ts
src/tests/teamScreenLayout.test.ts
1. Временно отключить recent risky changes

Проверить изменения из M-6.2:

viewport meta maximum-scale=1.0, user-scalable=no, viewport-fit=cover
game.scale.refresh() на resize/orientationchange/visualViewport.resize
100dvw removal
visual-aligned hitArea

Нужно выяснить, что именно вызывает смещение.

Особенно подозрительно:

visualViewport.resize + game.scale.refresh()

Если refresh() вызывается в момент, когда Android Chrome toolbar еще анимируется, Phaser может запомнить неправильные bounds.

2. Убрать ручное вмешательство в Phaser Scale, если оно ломает input

Нужно проверить: не ухудшил ли ситуацию добавленный game.scale.refresh().

Сделать безопасный вариант:

не вызывать scale.refresh() напрямую на каждый resize/visualViewport.resize;
если refresh нужен — делать debounced refresh через setTimeout/requestAnimationFrame после стабилизации viewport;
или убрать refresh полностью, если Phaser.Scale.FIT сам корректно обновляет bounds.

Рекомендуемый вариант:

let resizeTimer: number | undefined;

function scheduleScaleRefresh(game: Phaser.Game) {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    game.scale.refresh();
  }, 250);
}

Но если даже это дает offset — убрать custom refresh.

3. Проверить CSS canvas/container

Убедиться, что нет CSS, который визуально меняет canvas отдельно от Phaser:

Запрещено / подозрительно:

canvas {
  width: 100%;
  height: 100%;
  transform: ...
  scale: ...
  position with manual offsets
}

Для Phaser.Scale.FIT лучше не задавать canvas width/height вручную.

Рекомендуемо:

html,
body,
#app,
#game-container {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  touch-action: none;
}

#game-container canvas {
  display: block;
  touch-action: none;
}

Не задавать canvas:

width: 100vw;
height: 100vh;
width: 100%;
height: 100%;

если Phaser сам управляет размером canvas.

4. Убрать viewport meta, если он влияет на layout viewport

Если после M-6.2 был добавлен:

maximum-scale=1.0, user-scalable=no, viewport-fit=cover

проверить вариант без maximum-scale и user-scalable=no.

Более безопасный вариант:

<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

Не блокировать масштабирование, если это вызывает странности Android Chrome.

5. Добавить debug-режим для проверки input alignment

Добавить временный debug helper, который можно включить через query param:

?debugInput=1

В debug mode показывать:

1. canvas.getBoundingClientRect()
2. game.scale.displaySize
3. game.scale.gameSize
4. pointer screen/client coordinates
5. pointer world/game coordinates
6. marker circle в точке Phaser pointer

При tap по экрану рисовать маленький крестик именно в координате, которую видит Phaser.

Это позволит понять:

Phaser pointer оказывается левее реального пальца?
на сколько px?
смещение постоянное?
смещение растет к правому краю?

Если смещение растет к правому краю, это проблема scale factor.
Если смещение постоянное, это проблема left offset / canvas bounds.

Debug mode не должен быть включен по умолчанию.

6. Проверить Phaser input scale

Проверить, обновляется ли input manager после resize.

В Phaser может быть проблема, если canvas bounds stale. Найти безопасный способ обновления bounds:

game.scale.refresh()
game.input.manager.updateInputPlugins()
canvasBounds refresh

Использовать только подтвержденный метод из текущей версии Phaser.

Не использовать приватные поля без необходимости.

7. После исправления вернуть правильные hitArea

Когда systemic input offset исправлен:

hitArea кнопок должна совпадать с визуалом или быть симметрично расширена;
нельзя оставлять перекошенные или компенсирующие hitArea;
TeamSelect карточки не должны выбирать соседнюю карточку.
8. TeamSelect grid

Ширина grid из M-6.2 может остаться:

x=128, width=1344

Но проверить, что:

card visual rect = input rect;
нажатие по правой части карточки выбирает эту же карточку;
нажатие в gap между карточками ничего не выбирает;
нажатие по соседней карточке выбирает соседнюю.
9. Smoke test на реальном mobile viewport

Нужен smoke test, который кликает не только по центру, но и по правой стороне.

Добавить проверки:

tap 80% width внутри TeamSelect card -> выбирает эту же команду;
tap 95% width внутри button -> срабатывает эта же button;
tap в gap между двумя cards -> не выбирает соседнюю;
tap на правой стороне Start/Menu -> срабатывает Start/Menu.

Если headless не ловит Android Chrome issue, все равно добавить тест layout/hitArea consistency.

10. Не менять

Не менять:

GameEngine
AI
Penalty AI
TournamentEngine
PenaltyShootoutEngine
правила игры
составы
assets registry
kits/covers validation
11. Проверка

Запустить:

npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev

После push обязательно проверить на Pixel 10 / Android Chrome.

12. Отчет

После выполнения вывести:

Этап M-6.3 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Реальная причина input offset:
- ...

Что было убрано/изменено из M-6.2:
- ...

CSS canvas/container:
- ...

Viewport meta:
- ...

Scale refresh:
- ...

Debug input mode:
- добавлен / не добавлен
- как включить:

TeamSelect:
- ...

Menu/buttons:
- ...

Проверки правой стороны кнопок:
- ...

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
- да / нет

Результат validate:kits:
- ...

Результат validate:covers:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Что проверить на Pixel 10:
- tap по левой/центральной/правой части кнопки
- tap по правой части карточки команды
- tap в gap между карточками
- Teams Back
- Menu buttons
```
---
````md
# Total Soccer: Mundial
# M-6.4 — окончательно исправить системное смещение Phaser input на mobile

## Проблема

На мобильной версии Android Chrome / Pixel 10 input сильно смещен.

По скриншоту главного меню видно:

- визуально кнопка `Rules` находится правее;
- если нажать левее кнопки, в темной зоне, срабатывает `Rules`;
- правая часть реальной кнопки плохо реагирует;
- такая же проблема есть у всех кнопок и карточек команд.

Это значит, что проблема НЕ в отдельных hitArea и НЕ в TeamSelect layout.

Проблема системная:

```text
Phaser pointer coordinates не совпадают с визуально отображенным canvas.
````

---

## Главная цель

Добиться полного совпадения:

```text
место касания пальцем
=
Phaser pointer position
=
визуальная позиция элемента на canvas
```

Нельзя чинить это расширением hitArea.

---

## Проверить файлы

```text
index.html
src/main.ts
src/styles/main.css
src/ui/touchInput.ts
src/ui/Button.ts
src/scenes/MenuScene.ts
src/scenes/TeamSelectScene.ts
src/scenes/SquadSelectScene.ts
src/tests/touchInput.test.ts
src/tests/project.test.ts
```

---

# 1. Не принимать текущий M-6.3 как исправление

Текущий M-6.3 добавил:

```text
debounced scale.refresh()
debugInput mode
viewport meta cleanup
```

Но реальная проблема осталась.

Нужно продолжить диагностику и найти настоящий источник.

---

# 2. Проверить CSS canvas и parent

Нужно убедиться, что Phaser canvas НЕ масштабируется CSS-ом отдельно от Phaser Scale Manager.

Проверить `main.css`.

Запрещено для canvas:

```css
canvas {
  width: 100%;
  height: 100%;
  width: 100vw;
  height: 100vh;
  transform: ...;
  scale: ...;
  object-fit: ...;
}
```

Для `#game-container canvas` оставить максимум:

```css
#game-container canvas {
  display: block;
  touch-action: none;
}
```

Если canvas получает CSS width/height — убрать.

Phaser.Scale.FIT должен сам выставлять canvas display size.

---

# 3. Проверить parent container

`#game-container` должен занимать viewport, но не должен центрировать canvas через CSS transform.

Допустимо:

```css
html,
body,
#app,
#game-container {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  touch-action: none;
}
```

Не использовать для canvas/parent:

```css
transform
zoom
scale
translate
```

Если есть flex/grid centering, проверить, не конфликтует ли он с Phaser `autoCenter`.

Если Phaser уже использует:

```ts
autoCenter: Phaser.Scale.CENTER_BOTH
```

то CSS не должен дополнительно центрировать canvas через transform.

---

# 4. Проверить viewport meta

Оставить безопасный вариант:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Не использовать:

```html
maximum-scale=1.0
user-scalable=no
```

---

# 5. Проверить Phaser input manager bounds

В debugInput нужно вывести реальные значения:

```text
canvas.getBoundingClientRect().left
canvas.getBoundingClientRect().top
canvas.getBoundingClientRect().width
canvas.getBoundingClientRect().height

game.scale.displaySize.width
game.scale.displaySize.height

game.scale.gameSize.width
game.scale.gameSize.height

game.scale.canvasBounds.left
game.scale.canvasBounds.top
game.scale.canvasBounds.width
game.scale.canvasBounds.height

pointer.event.clientX
pointer.event.clientY
pointer.x
pointer.y
```

Главное сравнить:

```text
canvas.getBoundingClientRect()
vs
game.scale.canvasBounds
```

Если они отличаются — это и есть причина offset.

---

# 6. Принудительно обновлять canvas bounds корректным способом

Найти в текущей версии Phaser правильный публичный способ обновить bounds.

Проверить варианты:

```ts
game.scale.refresh()
game.input.manager.updateBounds()
```

Если доступен публичный метод:

```ts
game.input.manager.updateBounds()
```

использовать его после resize/orientation.

Рекомендуемая логика:

```ts
function refreshScaleAndInputBounds(game: Phaser.Game) {
  game.scale.refresh();

  if (game.input?.manager && 'updateBounds' in game.input.manager) {
    game.input.manager.updateBounds();
  }
}
```

Если TypeScript ругается — сделать безопасный type guard.

Важно:

```text
scale.refresh() без input bounds refresh может быть недостаточно.
```

---

# 7. Проверить порядок refresh

На Android Chrome toolbar/viewport может меняться постепенно.

Использовать несколько отложенных refresh:

```ts
function scheduleMobileScaleRefresh(game: Phaser.Game) {
  window.setTimeout(() => refreshScaleAndInputBounds(game), 50);
  window.setTimeout(() => refreshScaleAndInputBounds(game), 250);
  window.setTimeout(() => refreshScaleAndInputBounds(game), 600);
}
```

Только на mobile/coarse pointer.

Для desktop можно оставить один обычный refresh или вообще не трогать.

---

# 8. Проверить, не блокирует ли debug marker реальный input

Debug marker должен быть чисто визуальным.

Он не должен:

```text
иметь interactive;
перехватывать pointer events;
лежать поверх кнопок как input target.
```

---

# 9. Добавить визуальный debug crosshair

В `?debugInput=1` при tap рисовать:

```text
красный крестик — где Phaser считает pointer.x/y;
синий кружок — где был clientX/clientY пересчитанный вручную через getBoundingClientRect.
```

Ручной пересчет:

```ts
const rect = canvas.getBoundingClientRect();

const manualX =
  ((event.clientX - rect.left) / rect.width) * game.scale.gameSize.width;

const manualY =
  ((event.clientY - rect.top) / rect.height) * game.scale.gameSize.height;
```

Если красный и синий расходятся — Phaser input bounds stale.

Если синий совпадает с пальцем, а красный нет — нужно обновлять Phaser input bounds.

---

# 10. Если Phaser input bounds невозможно стабилизировать

Как fallback, можно перехватывать pointer координаты и корректировать через manual mapping.

Но это только если публичный `updateBounds()` не помогает.

Предпочтение:

```text
1. убрать CSS-конфликт;
2. обновить Phaser input bounds;
3. только потом manual fallback.
```

---

# 11. Тест на right-side clicks

Добавить smoke/logic tests:

```text
Menu button Rules:
- tap по 20% ширины кнопки;
- tap по 50%;
- tap по 80%;
все должны попадать в Rules.

TeamSelect card:
- tap по 20%;
- tap по 50%;
- tap по 80%;
все должны выбирать эту же команду.

Gap between cards:
- tap в gap не выбирает соседнюю карточку.
```

Даже если headless не воспроизводит mobile bug, тесты должны закрепить layout/hitArea consistency.

---

# 12. Не менять

Не менять:

```text
GameEngine
AI
Penalty AI
TournamentEngine
PenaltyShootoutEngine
правила игры
составы
assets registry
kits/covers validation
TeamSelect visual layout
Menu visual layout
```

Можно менять только:

```text
CSS canvas/container
Phaser bootstrap scale/input refresh
debugInput
tests
```

---

# 13. Проверка

Запустить:

```bash
npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev
```

---

# 14. Обязательная проверка на Pixel 10

После deploy открыть:

```text
https://total-soccer-mundial.vercel.app/?debugInput=1
```

Проверить:

```text
1. Нажать левее Rules — Rules НЕ должен срабатывать.
2. Нажать по левой части Rules — должен сработать Rules.
3. Нажать по центру Rules — должен сработать Rules.
4. Нажать по правой части Rules — должен сработать Rules.
5. Красный и синий debug markers должны совпадать или почти совпадать.
6. TeamSelect: правая часть карточки выбирает эту же карточку, не соседнюю.
7. Gap между карточками не выбирает соседнюю.
```

---

# 15. Формат отчета

После выполнения вывести:

```text
Этап M-6.4 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Настоящая причина offset:
- ...

CSS canvas/container:
- ...

Phaser scale/input bounds:
- ...

updateBounds:
- использован / недоступен / не нужен

Refresh strategy:
- ...

Debug markers:
- ...

Menu buttons:
- ...

TeamSelect cards:
- ...

Right-side click behavior:
- ...

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
- да / нет

Результат validate:kits:
- ...

Результат validate:covers:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Что проверить на Pixel 10:
- ...
```

После отчета остановиться.

```
```
---

# Этап M-7 — мобильная адаптация турниров и пенальти

## Цель

Сделать турнирные экраны и пенальти доступными на mobile landscape.

## Проверить сцены

```text
TournamentSetupScene
TournamentHubScene
TournamentPenaltyScene
ResultScene
```

## TournamentSetup требования

```text
форматы турниров видны;
слоты команд touch-friendly;
выбор команд работает;
AI checkbox доступен;
кнопки Back / Start доступны;
scroll работает, если нужен.
```

## TournamentHub требования

```text
группы/таблицы читаемы;
кнопки матчей доступны;
плей-офф bracket не обрезается критично;
если нужно — добавить scroll/paging;
Back доступен.
```

## Penalty требования

```text
карты пенальти видны;
кнопки/колоды нажимаются пальцем;
AI vs AI не зависает;
HUMAN vs AI работает;
результат серии виден;
Back/continue доступен.
```

## ResultScene требования

```text
финальный счет виден;
авторы голов видны;
статистика не обрезается;
кнопки next/back/rematch доступны, если есть.
```

## Не менять

Не менять:

```text
PenaltyShootoutEngine;
TournamentEngine;
AI logic;
правила пенальти;
симуляцию турнира.
```

Разрешены только UI/layout/touch изменения.

## Тесты

Проверить:

```text
TournamentSetup помещается в mobile landscape;
TournamentHub помещается или скроллится;
Penalty scene помещается;
ResultScene помещается;
основные кнопки touch-friendly;
AI penalty controller не ломается.
```

## Проверка

```bash
npm test
npm run build
npm run dev
```

Вручную:

```text
1. Создать Cup M.
2. Выбрать несколько AI-команд.
3. Запустить матч.
4. Дойти до результата.
5. Проверить пенальти отдельно.
```

## Отчет после M-7

```text
Этап M-7 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

TournamentSetup mobile:
- ...

TournamentHub mobile:
- ...

Penalty mobile:
- ...

Result mobile:
- ...

AI behavior:
- ...

Изменялись ли TournamentEngine / PenaltyShootoutEngine / AI:
- да / нет

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...
```

После отчета остановиться.

---

# Этап M-8 — финальная mobile QA для Android Chrome / Pixel 10

## Цель

Проверить первую мобильную версию на целевой платформе.

## Обязательная платформа

```text
Pixel 10
Android Chrome
Landscape orientation
```

## Обязательная проверка

```text
1. Главное меню.
2. Game modes.
3. Quick match.
4. HUMAN vs HUMAN.
5. HUMAN vs AI.
6. AI vs HUMAN.
7. AI vs AI.
8. Rules/About в меню.
9. Rules/About во время матча.
10. Teams.
11. TeamSelect.
12. Tournament setup.
13. Tournament match.
14. Penalty shootout.
15. Result screen.
16. Portrait rotate overlay.
17. Возврат в landscape.
```

## Проверить технически

```text
нет page scroll вокруг canvas;
нет обрезки canvas;
нет лишних белых полей;
touch-клики срабатывают;
нет случайных двойных кликов;
overlay блокирует input;
AI не делает ход под overlay;
звук запускается после первого touch;
kits грузятся;
covers грузятся;
flags грузятся;
Vercel deploy работает на телефоне.
```

## Команды

Перед финальной проверкой запустить:

```bash
npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev
```

## Финальный отчет

```text
Финальная mobile-регрессия завершена.

Целевая платформа:
- Pixel 10 / Android Chrome

Проверенные размеры:
- ...

Portrait overlay:
- ...

Landscape gameplay:
- ...

Главное меню:
- ...

GameScene:
- ...

Teams:
- ...

TeamSelect:
- ...

Tournament:
- ...

Penalty:
- ...

Rules/About:
- ...

Assets:
- flags:
- kits:
- covers:

Touch input:
- ...

AI behavior:
- ...

Vercel:
- ...

Результат validate:kits:
- ...

Результат validate:covers:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Что осталось улучшить:
- ...
```

После отчета остановиться.

---

# Критерии приемки mobile web v1

Первая мобильная версия считается готовой, если:

```text
1. Игра открывается на Pixel 10 в Android Chrome.
2. В landscape виден весь canvas.
3. В portrait показывается rotate overlay.
4. Главное меню работает.
5. Quick match работает.
6. HUMAN vs AI работает.
7. AI vs AI работает.
8. Карты удобно нажимать пальцем.
9. Основные кнопки не слишком мелкие.
10. Rules/About читаются.
11. Teams открывается и скроллится.
12. TeamSelect доступен.
13. Tournament setup доступен.
14. Пенальти работают.
15. Result screen читается.
16. Нет page scroll вокруг canvas.
17. Нет критичной обрезки UI.
18. Kits/covers/flags грузятся.
19. Vercel-версия работает на телефоне.
20. npm test проходит.
21. npm run build проходит.
```

---

# Важное ограничение

Все этапы выполнять последовательно.

После каждого этапа:

```text
1. запустить проверки;
2. вывести отчет;
3. остановиться;
4. ждать подтверждения.
```

Не переходить к следующему этапу без подтверждения.

```
```
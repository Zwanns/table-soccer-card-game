# Total Soccer: Mundial
# Mobile Step 2 — стабилизировать размер canvas после смены ориентации

## Контекст

В ветке `mobile-landscape` после Step 1 / Step 1.1:

- клики работают без смещения;
- прокрутка пальцем работает;
- матчи играются нормально.

Осталась старая проблема, которая была еще до мобильной адаптации:

```text
при запуске игра открывается на все окно браузера;
если повернуть телефон вертикально и потом обратно горизонтально,
canvas иногда становится меньше;
приходится несколько раз крутить телефон, чтобы игра снова увеличилась.

Целевая платформа:

Android Chrome
mobile browser
landscape gameplay
Главная цель

После смены ориентации:

portrait -> landscape
landscape -> portrait -> landscape

Phaser canvas должен снова корректно занимать доступное окно браузера.

Важно

Не сломать уже исправленное:

клики без смещения;
touch-scroll;
точные hitArea;
desktop baseline.
Не менять

Не менять:

Button hitArea;
touchInput drag-scroll;
TeamSelect list input;
Menu button input;
GameEngine;
AI;
TournamentEngine;
Penalty AI;
правила игры;
assets registry;
kits/covers validation.

Не возвращать старые проблемные правки:

visualViewport.resize listener;
aggressive repeated scale refresh;
manual canvas CSS width/height;
CSS transform/scale для canvas;
расширенные hitArea кнопок.
Проверить файлы
src/main.ts
src/styles/main.css
index.html
src/tests/project.test.ts

Если можно решить без index.html, лучше не трогать его.

1. Проверить текущие scale/CSS настройки

Убедиться, что Phaser всё еще использует:

Phaser.Scale.FIT
Phaser.Scale.CENTER_BOTH
base size 1600x720
parent: game-container

Canvas не должен получать ручные CSS:

width: 100%;
height: 100%;
transform: scale(...);
2. Добавить мягкий orientation resize refresh

Добавить безопасный helper в main.ts, например:

function scheduleScaleResize(game: Phaser.Game) {
  window.setTimeout(() => {
    game.scale.resize(BASE_GAME_WIDTH, BASE_GAME_HEIGHT);
    game.scale.refresh();
  }, 250);
}

Но использовать только публичные методы Phaser и только если они не вызывают input offset.

Лучше начать с самого мягкого варианта:

function scheduleScaleRefresh(game: Phaser.Game) {
  window.setTimeout(() => {
    game.scale.refresh();
  }, 250);
}

Слушатели:

window.addEventListener('orientationchange', () => scheduleScaleRefresh(game));
window.addEventListener('resize', () => scheduleScaleRefresh(game));

Не использовать visualViewport.resize на этом этапе.

3. Возможно добавить двойной delayed refresh

Android Chrome может менять viewport не мгновенно. Если один refresh недостаточен, использовать два отложенных вызова:

function scheduleOrientationScaleRefresh(game: Phaser.Game) {
  window.setTimeout(() => game.scale.refresh(), 250);
  window.setTimeout(() => game.scale.refresh(), 700);
}

Не делать бесконечных циклов и частых refresh.

4. CSS viewport

Проверить, что контейнер занимает окно:

html,
body,
#app,
#game-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

Если уже есть 100vh, можно аккуратно добавить fallback:

height: 100vh;
min-height: 100dvh;

Но не использовать 100dvw, если есть риск.

Не задавать canvas width/height вручную.

5. Тесты

Добавить/обновить тесты:

main.ts регистрирует resize/orientationchange refresh;
не используется visualViewport.resize;
canvas CSS не задает width/height/transform;
Button hitArea не изменялись;
touchInput не изменялся.
6. Проверка

Запустить:

npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev
7. Ручная проверка на телефоне

После deploy Preview проверить:

1. Открыть игру в Android Chrome landscape.
2. Проверить, что canvas на все доступное окно.
3. Повернуть телефон vertical.
4. Повернуть обратно landscape.
5. Проверить, что canvas снова занимает всё доступное окно.
6. Повторить 3–5 раз.
7. Проверить, что клики НЕ сместились.
8. Проверить главное меню, TeamSelect, матч.
9. Проверить touch-scroll.
8. Формат отчета

После выполнения вывести:

Mobile Step 2 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Resize/orientation handling:
- ...

CSS:
- ...

Что НЕ менялось:
- Button hitArea:
- touchInput:
- Phaser scale mode:
- canvas CSS transform/width/height:

Проверки:
- validate:kits:
- validate:covers:
- npm test:
- npm build:
- npm dev:

Что проверить на телефоне:
- ...

После отчета остановиться.


После этого снова пуш в `mobile-landscape`, проверка через Preview, и только если клики не сместятся — принимаем.
А можем ли мы зафиксировать окно приложения только в горизонтальном положении? 
Myślał przez 17s

В обычном мобильном браузере надежно зафиксировать ориентацию нельзя.

Что можно сделать:

1. В браузере — показать overlay:
   “Please rotate your device”
   если телефон вертикально.

2. В PWA — иногда можно задать landscape в manifest.json,
   но это работает только когда приложение установлено на телефон.

3. В Android-приложении через Capacitor / APK —
   можно нормально зафиксировать landscape.

Для нашей текущей web-версии в Chrome лучший вариант:

не пытаться насильно блокировать поворот,
а показывать экран-подсказку при vertical orientation.

То есть: если телефон вертикально — игра скрыта, виден экран “Поверните устройство”. Если горизонтально — игра работает. Это безопаснее, чем снова лезть в scale/input и рисковать смещением кликов.

Тогда давай используем экран-подсказку при вертикальном положении телефона. Добавь это в ТЗ и напиши обновлённое тз
Myślał kilka sekund

Да, это самый безопасный вариант: не фиксировать ориентацию насильно, а показывать overlay-подсказку в vertical mode. Ниже обновленное ТЗ для следующего маленького шага.

# Total Soccer: Mundial
# Mobile Step 2 — portrait rotate overlay и стабильное возвращение в landscape

## Ветка

Работать только в ветке:

```text
mobile-landscape

Не вносить эти изменения в main.

Контекст

После Mobile Step 1 / Step 1.1:

клики работают без смещений;
прокрутка пальцем работает;
матчи играются нормально;
глобальный Phaser scale/canvas/input не трогался.

Осталась старая проблема:

при запуске игра открывается на все окно браузера;
если повернуть телефон вертикально и потом обратно горизонтально,
canvas иногда становится меньше;
приходится несколько раз крутить телефон, чтобы игра снова увеличилась.

Также принято решение:

не пытаться насильно фиксировать ориентацию в обычном браузере;
если телефон вертикально — показывать экран-подсказку;
если телефон горизонтально — показывать игру.
Цель

Добавить безопасный экран-подсказку для portrait orientation:

Please rotate your device
Use landscape mode

или аналогичный текст.

При этом:

не сломать точность кликов;
не ломать touch-scroll;
не менять Phaser scale mode;
не делать агрессивный refresh/updateBounds;
не возвращать старые проблемные mobile-правки.
Главное ограничение

Не менять:

Button hitArea;
touchInput drag-scroll;
TeamSelect list input;
Menu button input;
GameEngine;
AI;
TournamentEngine;
Penalty AI;
правила игры;
assets registry;
kits/covers validation;
Phaser.Scale.FIT;
Phaser.Scale.CENTER_BOTH;
base game size 1600x720.

Не возвращать старые проблемные решения:

visualViewport.resize listener;
aggressive repeated scale refresh;
game.scale.updateBounds experiments;
manual canvas CSS width/height;
CSS transform/scale для canvas;
расширенные hitArea кнопок.
Проверить файлы
index.html
src/styles/main.css
src/main.ts
src/tests/project.test.ts

Предпочтительно реализовать overlay через index.html + CSS + маленький bootstrap script.

Если можно сделать без изменения src/main.ts, лучше не трогать src/main.ts.

1. Добавить HTML overlay

В index.html добавить overlay рядом с #game-container, например:

<div id="orientation-overlay" hidden>
  <div class="orientation-overlay__card">
    <div class="orientation-overlay__icon">↻</div>
    <div class="orientation-overlay__title">Please rotate your device</div>
    <div class="orientation-overlay__text">Use landscape mode</div>
  </div>
</div>

Требования:

overlay находится поверх canvas;
overlay скрыт в landscape;
overlay виден в portrait на mobile/touch device;
overlay не уничтожает Phaser scene;
overlay не пересоздает игру;
overlay блокирует input под собой только когда виден;
на desktop-разработке не мешает.
2. CSS overlay

В src/styles/main.css добавить стили.

Пример:

#orientation-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #06130f;
  color: #f7d35a;
  font-family: Arial, sans-serif;
  text-align: center;
  touch-action: none;
}

#orientation-overlay[hidden] {
  display: none;
}

.orientation-overlay__card {
  max-width: 420px;
  padding: 28px 32px;
  border: 2px solid rgba(247, 211, 90, 0.8);
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.45);
}

.orientation-overlay__icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.orientation-overlay__title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.orientation-overlay__text {
  font-size: 16px;
  color: #ffffff;
}

Можно адаптировать стиль под игру.

3. Логика показа overlay

Добавить небольшой script в index.html или bootstrap-файл.

Логика:

function isMobileLikeDevice() {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

function updateOrientationOverlay() {
  const overlay = document.getElementById('orientation-overlay');
  if (!overlay) return;

  const shouldShow = isMobileLikeDevice() && isPortrait();

  overlay.hidden = !shouldShow;
}

Слушатели:

window.addEventListener('resize', updateOrientationOverlay);
window.addEventListener('orientationchange', updateOrientationOverlay);
window.addEventListener('DOMContentLoaded', updateOrientationOverlay);

Можно также вызвать один раз через setTimeout(updateOrientationOverlay, 100) после загрузки.

4. Не делать forced orientation lock

Не использовать:

screen.orientation.lock(...)

Причина:

в обычном мобильном браузере это ненадежно;
может требовать fullscreen/user gesture;
может вести себя по-разному;
может ухудшить UX.
5. Стабилизация landscape после возврата из portrait

На этом шаге не делать агрессивных scale/input фиксов.

Допустимо только очень мягкое поведение:

при возврате в landscape скрыть overlay;
дать Phaser самому пересчитать scale;
если нужно — один мягкий resize event через window.dispatchEvent(new Event('resize')) после 150–250 ms.

Но предпочтительно сначала добавить только overlay без вмешательства в Phaser.

Если canvas после возврата в landscape остается маленьким, зафиксировать это в отчете и не пытаться чинить агрессивно на этом шаге.

6. Тесты

Добавить/обновить тесты:

orientation overlay существует в index.html;
overlay содержит текст Please rotate your device;
overlay содержит текст Use landscape mode;
project не использует screen.orientation.lock;
project не использует visualViewport.resize;
canvas CSS не содержит transform/scale/manual width/height;
Button hitArea не изменялись;
touchInput не изменялся.
7. Проверка

Запустить:

npm run validate:kits
npm run validate:covers
npm test
npm run build
npm run dev
8. Ручная проверка после Vercel Preview

На телефоне в Android Chrome:

1. Открыть игру в landscape.
2. Игра видна.
3. Клики не смещены.
4. Touch-scroll работает.
5. Повернуть телефон в portrait.
6. Появляется overlay Please rotate your device.
7. Клики по игре под overlay не проходят.
8. Повернуть обратно в landscape.
9. Overlay исчезает.
10. Игра снова видна.
11. Проверить меню, TeamSelect и матч.

Если после возврата в landscape canvas иногда остается маленьким:

не чинить вслепую;
зафиксировать поведение;
после этого сделать отдельный Step 2.1 с точной диагностикой.
9. Что НЕ менять в отчете

В отчете обязательно подтвердить:

main.ts:
- изменялся / не изменялся

Phaser scale:
- не менялся

Button hitArea:
- не менялся

touchInput:
- не менялся

canvas CSS:
- не получил transform/scale/manual width/height
10. Формат отчета

После выполнения вывести:

Mobile Step 2 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Orientation overlay:
- ...

Portrait behavior:
- ...

Landscape behavior:
- ...

Input blocking:
- ...

Что НЕ менялось:
- main.ts:
- Phaser scale:
- Button hitArea:
- touchInput:
- canvas CSS transform/width/height:

Используется ли screen.orientation.lock:
- да / нет

Используется ли visualViewport.resize:
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

Что проверить на телефоне:
- ...

После отчета остановиться.

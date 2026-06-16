````md
# Total Soccer: Mundial
# Доработать меню выбора команд

## Цель

Доработать экран выбора команд перед матчем / пенальти:

1. Выровнять верхние карточки выбранных команд и нижние кнопки по краям блока списка команд.
2. Вместо флага в карточке выбранной команды показывать несколько карт рубашкой вверх, разложенных веером.
3. Между карточкой выбранной команды и `VS` показывать экипировку выбранной команды.
4. Заменить однотонный фон на футбольное поле с разметкой и полосатым газоном.

---

## Проверить файлы

```text
src/scenes/TeamSelectScene.ts
src/ui/teamScreenLayout.ts
src/assets/teamCover.ts
src/data/teamKits.ts
src/game/kitAssetResolver.ts
src/ui/CardView.ts
src/ui/DeckView.ts
src/ui/KitCardFaceView.ts
src/tests/teamSelect.test.ts
src/tests/teamScreenLayout.test.ts
PROJECT_SPEC_FOR_CHATGPT.md
````

Если часть логики находится в других файлах — найти по поиску:

```text
Team selection
Penalty teams
Team 1
Team 2
VS
Start penalties
Start
teamCover
cover
kit
getTeamKitAssetKey
resolveTeamCoverLoadResult
```

---

# 1. Выровнять карточки выбранных команд и нижние кнопки по ширине списка команд

## Текущее состояние

На экране выбора команд список команд занимает широкий центральный блок, но:

```text
верхние карточки Team 1 / Team 2
и нижние кнопки Menu / Start
не выровнены по краям этого блока.
```

## Новое поведение

Использовать общий layout anchor:

```text
teamGridLeft
teamGridRight
teamGridWidth
```

Верхние карточки и нижние кнопки должны быть выровнены по этим же краям.

Требования:

```text
левая карточка Team 1 начинается по левому краю блока команд;
правая карточка Team 2 заканчивается по правому краю блока команд;
кнопка Menu начинается по левому краю блока команд;
кнопка Start / Start penalties заканчивается по правому краю блока команд;
VS остается по центру между карточками;
desktop baseline должен остаться аккуратным.
```

Если текущий grid имеет:

```text
x = 132
width = 1336
```

то:

```text
Team 1 card left = grid.x
Team 2 card right = grid.x + grid.width
Menu button left = grid.x
Start button right = grid.x + grid.width
```

Не использовать случайные ручные координаты, если можно брать их из layout helper.

---

# 2. В карточке выбранной команды вместо флага показывать веер карт рубашкой вверх

## Текущее состояние

В карточке выбранной команды слева показывается флаг команды.

## Новое состояние

Вместо флага показывать 3–4 карты с рубашкой колоды выбранной команды.

Карты должны быть:

```text
рубашкой вверх;
разложены небольшим веером;
частично перекрывать друг друга;
могут немного выходить за пределы карточки выбранной команды;
использовать индивидуальную рубашку команды;
если рубашки нет — использовать cover-none.
```

## Требования

Для Team 1 использовать cover выбранной Team 1.
Для Team 2 использовать cover выбранной Team 2.

Пример визуальной идеи:

```text
[  /// cards fan  ] Team 1 France
```

или:

```text
несколько маленьких карт, слегка повернутых:
-8°, 0°, +8°
```

## Реализация

Использовать текущую систему covers:

```text
resolveTeamCoverLoadResult
getTeamCoverAssetKey
cover-<flagCode>
cover-none
```

Не создавать новый asset pipeline.

Можно сделать helper внутри `TeamSelectScene`, например:

```ts
createSelectedTeamCoverFan(...)
```

Параметры:

```ts
scene
x
y
coverTextureKey
scale
depth
```

Веер:

```text
3 карты — достаточно;
4 карты — если визуально помещается.
```

Рекомендуемо начать с 3 карт.

Карты могут быть нарисованы как Phaser Image с одной текстурой cover:

```ts
scene.add.image(x, y, coverKey)
  .setDisplaySize(cardW, cardH)
  .setAngle(...)
```

Если нужен контур, использовать существующий card frame helper или graphics rectangle под картой.

---

# 3. Между карточкой выбранной команды и VS показывать экипировку команды

## Цель

Добавить рядом с `VS` маленький preview экипировки выбранных команд.

Для Team 1:

```text
между Team 1 card и VS
```

Для Team 2:

```text
между VS и Team 2 card
```

## Что показывать

Использовать kit image выбранной команды:

```text
public/kits/images/<flagCode>.webp
```

Через текущий resolver:

```text
getTeamKitAssetKey(team.flagCode)
```

или аналог.

## Внешний вид

Экипировка должна быть:

```text
не слишком крупной;
без номера;
на белом фоне, как asset;
визуально вписана в верхнюю зону;
не перекрывать VS;
не перекрывать карточку выбранной команды.
```

Рекомендуемый размер:

```text
примерно 70–90 px по высоте на desktop;
меньше, если не помещается.
```

Можно использовать `setDisplaySize(...)`.

## Fallback

Если kit не найден:

```text
использовать kit-none;
экран не должен падать.
```

---

# 4. Фон меню выбора команд: футбольное поле

## Текущее состояние

Фон однотонный темно-зеленый.

## Новое состояние

Фон должен выглядеть как футбольное поле:

```text
полосатый газон;
разметка поля;
центральная линия;
центральный круг;
штрафные зоны по краям, если помещаются;
тонкие белые/полупрозрачные линии.
```

## Требования

```text
фон не должен мешать читаемости кнопок и списка команд;
цвета должны быть темные/приглушенные;
разметка поля должна быть декоративной;
не использовать новые изображения;
рисовать через Phaser Graphics;
фон должен работать и для Team selection, и для Penalty teams, если это та же сцена.
```

## Реализация

Сделать helper, например:

```ts
createTeamSelectFieldBackground(scene)
```

или общий:

```ts
drawFootballFieldBackground(scene, width, height)
```

Рекомендуемо:

```text
1. залить фон темно-зеленым;
2. нарисовать 12–14 вертикальных или горизонтальных полос газона;
3. поверх — линии поля с alpha 0.22–0.35;
4. центральный круг вокруг VS-зоны;
5. центральная линия через VS.
```

Важно:

```text
фон должен быть на depth ниже всех UI-элементов.
```

---

# 5. Сохранить поддержку Team selection и Penalty teams

На скриншоте есть обычный экран:

```text
Team selection
Start
```

Ранее был также экран:

```text
Penalty teams
Start penalties
```

Нужно убедиться, что правки работают в обоих вариантах, если они используют одну сцену.

Требования:

```text
в обычном выборе команд кнопка Start;
в выборе команд для пенальти кнопка Start penalties;
оба варианта используют новый фон;
оба варианта используют cover fan;
оба варианта используют kit preview.
```

---

# 6. Layout helper

Обновить `teamScreenLayout.ts`.

Добавить/проверить в layout:

```ts
teamGridRect
team1SelectedCardRect
team2SelectedCardRect
menuButtonRect
startButtonRect
team1CoverFanRect
team2CoverFanRect
team1KitPreviewRect
team2KitPreviewRect
vsPosition
```

Требования:

```text
selected cards and bottom buttons align with teamGridRect edges;
kit preview rects are between selected cards and VS;
all rects stay inside canvas;
desktop layout remains clean;
mobile-related broken input changes should not be reintroduced.
```

Важно: после отката мобильной адаптации не возвращать проблемные изменения:

```text
не менять main.ts scale/input;
не менять index.html viewport/input;
не менять CSS canvas scale;
не делать mobile refresh/updateBounds;
```

---

# 7. Не менять

Не менять:

```text
GameEngine
AI
Penalty AI
TournamentEngine
PenaltyShootoutEngine
правила игры
составы игроков
регистрацию kits/covers
размер team kit contract 702×900
main.ts scale/input
index.html viewport
глобальный CSS canvas/input
```

Эта задача только про визуальный UI `TeamSelectScene` и связанные layout-тесты.

---

# 8. Тесты

Обновить или добавить тесты.

Проверить:

```text
Team 1 selected card left aligns with team grid left;
Team 2 selected card right aligns with team grid right;
Menu button left aligns with team grid left;
Start button right aligns with team grid right;
VS remains centered;
cover fan uses team cover key;
kit preview uses team kit key;
fallback cover/kit не ломает сцену;
field background создается;
desktop layout не выходит за canvas;
Penalty teams mode keeps Start penalties button.
```

Если трудно тестировать Phaser images напрямую, тестировать layout helper и smoke create scene.

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

# 10. Ручная проверка

В браузере проверить:

```text
1. Открыть Team selection.
2. Убедиться, что Team 1 card слева выровнена с краем списка команд.
3. Убедиться, что Team 2 card справа выровнена с краем списка команд.
4. Убедиться, что Menu слева выровнена с краем списка команд.
5. Убедиться, что Start справа выровнена с краем списка команд.
6. Проверить, что вместо флагов в selected cards виден веер карт с рубашками команд.
7. Проверить France / Spain.
8. Проверить Ukraine / Brazil.
9. Проверить, что между Team 1 и VS видна экипировка Team 1.
10. Проверить, что между VS и Team 2 видна экипировка Team 2.
11. Проверить фон футбольного поля.
12. Проверить Penalty teams, если он открывается отдельно.
13. Проверить, что кнопки нажимаются нормально после отката мобильных правок.
```

---

# 11. Формат отчета

После выполнения вывести:

```text
Доработка Team selection завершена.

Созданные файлы:
- ...

Измененные файлы:
- ...

Alignment:
- Team 1 card:
- Team 2 card:
- Menu:
- Start:

Selected team cards:
- flag removed:
- cover fan added:
- cards count:
- cover source:

Kit previews:
- Team 1:
- Team 2:
- kit source:

Field background:
- striped grass:
- field markings:

Penalty teams mode:
- ...

Изменялись ли main.ts / index.html / global CSS scale/input:
- да / нет

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

После отчета остановиться.

```
```


---

## Важно
In-app Browser недоступен (iab), поэтому визуальный скрин/клик-тест через него не делать.
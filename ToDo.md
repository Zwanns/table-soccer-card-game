Ниже ТЗ для Codex на исправление.

# Total Soccer: Mundial
# Исправить отображение цветных кружков на странице Teams

## Проблема

На странице `Teams` появился заголовок:

```text
Colors

но сами цветные кружки команды не видны.

Нужно исправить отображение swatches так, чтобы под заголовком Colors были видны 4 цветных кружка:

primaryColor
secondaryColor
shirtNumberColor
shirtNumberStrokeColor
Файлы

Проверить:

src/scenes/SquadSelectScene.ts
src/data/teamKits.ts
src/tests/squadEditor.test.ts
PROJECT_SPEC_FOR_CHATGPT.md

Если логика вынесена в helper — проверить и его.

1. Найти текущий код блока Colors

Найти в SquadSelectScene.ts код, который создает:

Colors

и color swatches.

Проверить:

создаются ли Graphics-объекты кружков;
добавляются ли они в scene / container;
не уничтожаются ли сразу;
не имеют ли alpha = 0;
не находятся ли под preview-картой;
не рисуются ли за границами экрана;
не рисуются ли тем же цветом, что фон;
не имеют ли радиус 0;
не создаются ли с координатами NaN.
2. Сделать явный layout для кружков

Разместить кружки прямо под заголовком Colors, над preview-картой формы.

Рекомендуемая схема:

Colors
● ● ● ●
[preview card]
[cover card]

Пример координат:

const colorsTitleX = previewCenterX;
const colorsTitleY = previewCardY - 36;

const swatchY = colorsTitleY + 24;
const swatchRadius = 9;
const swatchGap = 10;
const swatchDiameter = swatchRadius * 2;

const totalWidth =
  swatches.length * swatchDiameter +
  (swatches.length - 1) * swatchGap;

const startX = previewCenterX - totalWidth / 2 + swatchRadius;

Для каждого кружка:

const x = startX + index * (swatchDiameter + swatchGap);
const y = swatchY;
3. Рисовать кружки через Graphics

Для каждого цвета создать отдельный Phaser.GameObjects.Graphics или один общий graphics.

Пример:

graphics.lineStyle(2, strokeColor, 1);
graphics.fillStyle(fillColor, 1);
graphics.fillCircle(x, y, swatchRadius);
graphics.strokeCircle(x, y, swatchRadius);

Важно:

fillCircle должен вызываться после fillStyle;
strokeCircle должен вызываться после lineStyle;
Graphics должен быть добавлен выше фона и ниже/рядом с preview;
depth должен быть достаточно высоким.

Рекомендуемо:

graphics.setDepth(previewDepth + 1);

или использовать общий depth для UI правой панели.

4. Белый цвет должен быть видимым

Для белого или очень светлого цвета использовать темный контур:

const strokeColor = isLightColor(fillColor)
  ? 0x1f2a2e
  : 0xffffff;

Проверить, что для #FFFFFF кружок действительно виден.

5. Проверить преобразование HEX

Если цвета приходят как строки:

'#005BBB'
'#FFD500'
'#FFFFFF'
'#111111'

нужно корректно преобразовать их в число Phaser:

function parseHexColor(hex: string): number | null {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
  }

  return Number.parseInt(hex.slice(1), 16);
}

Не передавать строку '#FFFFFF' напрямую в fillStyle, если текущий Phaser-код ожидает number.

6. Не размещать кружки за preview-картой

По текущему скриншоту есть риск, что кружки рисуются, но скрываются карточкой формы.

Нужно убедиться:

swatchY находится между заголовком Colors и верхом preview-карты;
preview-карта начинается ниже кружков;
кружки не перекрываются preview-картой;
кружки не имеют depth ниже карточки.

Если места мало, немного опустить preview-карту или поднять заголовок Colors.

7. Не менять данные цветов

Не менять значения в teamKits.ts.

Исправление касается только отображения.

8. Тесты

Обновить тесты так, чтобы они ловили текущую ошибку.

Проверить:

при выборе команды создается не только заголовок Colors, но и 4 swatch-объекта;
swatches используют цвета из getTeamKitStyle(team.flagCode);
swatches имеют radius > 0;
swatches имеют валидные x/y;
swatches расположены ниже заголовка Colors;
swatches расположены выше preview-карты;
белый swatch имеет темный контур;
если цвет невалидный, он пропускается без падения.

Если тесты не могут проверить Phaser Graphics напрямую, добавить тестируемый helper:

buildTeamColorSwatches(style)

или:

getTeamColorSwatchLayout(...)
9. Проверка

Запустить:

npm test
npm run build
npm run dev

В браузере проверить:

1. Открыть Teams.
2. Выбрать Ukraine.
3. Под заголовком Colors должны быть видны 4 кружка.
4. Проверить Armenia.
5. Проверить Northern Ireland.
6. Проверить France.
7. Проверить Spain.
8. Белый кружок должен быть виден за счет контура.
9. Preview формы и рубашки колоды не должны сдвинуться некрасиво.
10. Формат отчета

После выполнения вывести:

Отображение цветных кружков на странице Teams исправлено.

Созданные файлы:
- ...

Измененные файлы:
- ...

Причина, почему кружки не были видны:
- ...

Что исправлено:
- ...

Количество отображаемых кружков:
- ...

Позиция:
- ...

Белый цвет:
- ...

Проверенные команды:
- Ukraine:
- Armenia:
- Northern Ireland:
- France:
- Spain:

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
- да / нет

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...

После отчета остановиться.


Скорее всего, причина простая: либо `#RRGGBB` передается в `fillStyle` как строка, либо кружки рисуются в координатах, которые оказываются под preview-картой или за пределами контейнера.

---

## Важно
In-app Browser недоступен (iab), поэтому визуальный скрин/клик-тест через него не делать.
# Total Soccer: Mundial

# Поэтапное внедрение экипировок сборных, составов и отдельной GK-колоды

## 0. Общие правила выполнения

Проект:

```text
Total Soccer: Mundial
```

Стек:

```text
TypeScript
Phaser 3
Vite
Vitest
```

Работу выполнять строго по этапам.

После каждого этапа обязательно запускать:

```bash
npm test
npm run build
```

Для этапов с UI дополнительно:

```bash
npm run dev
```

После каждого этапа остановиться и вывести отчет.

Не переходить к следующему этапу автоматически.

Формат отчета:

```text
Этап N завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Что реализовано:
- ...

Добавленные тесты:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Что проверить вручную:
- ...

Что остается на следующий этап:
- ...
```

Не выполнять массовый рефакторинг без необходимости.

---

# 1. Зафиксированные продуктовые решения

## 1.1 Одна основная форма на сборную

У каждой сборной используется только один комплект полевой формы:

```text
main kit
```

Не использовать на текущем этапе:

```text
home
away
third
retro
```

Для каждой сборной вручную подготавливается один PNG.

## 1.2 Общая папка ассетов

Все изображения экипировок хранятся в одной папке:

```text
public/kits/images/
```

Полевые формы именуются по `flagCode` из:

```text
src/data/nationalTeams.ts
```

Примеры:

```text
public/kits/images/pl.png
public/kits/images/ua.png
public/kits/images/br.png
public/kits/images/gb-eng.png
public/kits/images/gb-sct.png
public/kits/images/gb-wls.png
```

Универсальные GK-комплекты:

```text
public/kits/images/gk-1.png
public/kits/images/gk-2.png
```

## 1.3 Состав PNG формы

Каждый PNG содержит:

```text
футболку;
шорты.
```

Не содержит:

```text
гетры;
номер игрока;
номинал карты;
имя игрока;
фон карты;
человеческую фигуру;
лицо;
текст;
подписи.
```

Рекомендуемый размер:

```text
384 × 420 px
```

Предпочтительный фон:

```text
прозрачный.
```

Допустимый временный вариант:

```text
однотонный белый.
```

Не удалять белый фон через chroma key в runtime.

## 1.4 Лицевая сторона карты

Открытая карта рендерится слоями:

```text
1. белый фон карты;
2. PNG экипировки или fallback;
3. номер игрока на груди;
4. номинал карты в левом верхнем углу;
5. существующие интерактивные состояния.
```

Не рендерить:

```text
нижний перевернутый номинал;
масти;
имя игрока непосредственно на карте;
декоративный фон;
гетры.
```

## 1.5 Единая координата номера

Для всех форм используется одна координата номера:

```ts
export const SHIRT_NUMBER_ANCHOR = {
  x: 0.5,
  y: 0.31,
} as const;
```

Интерпретация:

```text
x = 0.5 -> центр футболки;
y = 0.31 -> приблизительно уровень груди.
```

Не создавать индивидуальные координаты для разных сборных.

## 1.6 Цвет номера

Для каждой сборной задаются:

```text
shirtNumberColor;
shirtNumberStrokeColor.
```

Цвет номера должен хорошо читаться на основной форме.

Цвет обводки используется для читаемости на маленьких карточках.

## 1.7 Два универсальных GK-комплекта

Для голкиперов используются только:

```text
gk-1
gk-2
```

В начале матча каждой команде случайно назначается один из двух комплектов через существующий seeded random.

Выбранный GK-комплект:

```text
не меняется при перерендере;
не меняется после гола;
не меняется после сэйва;
не меняется после штанги;
сохраняется до конца матча.
```

## 1.8 Экспериментальный импортёр

Существующий импортёр Wikipedia / Commons сохранить:

```text
scripts/wiki-kits/
public/kits/imported/
reports/
```

Но runtime игры не должен:

```text
использовать public/kits/imported/;
запускать импортёр;
обращаться к Wikipedia API;
обращаться к Wikimedia Commons API;
зависеть от sharp.
```

`sharp` разрешен только для dev-утилит.

---

# 2. Этап 0 — аудит текущего проекта

## Статус

```text
ВЫПОЛНЕНО
```

## Зафиксированные выводы аудита

Проект использует:

```text
TypeScript;
Vite;
Phaser;
Vitest;
strict: true;
noEmit: true.
```

Существуют:

```text
GameEngine.ts;
MatchTeamSetup;
модульная архитектура;
wiki-kits импортёр;
sharp в зависимостях.
```

На момент аудита отсутствует:

```text
src/data/teamKits.ts
```

`sharp` не должен попадать в браузерный runtime.

Не требуется заранее подготавливать все 64 PNG.

Система должна работать по принципу:

```text
PNG существует -> показать PNG;
PNG отсутствует -> показать fallback.
```

---

# 3. Этап 1 — data contract экипировок

## Цель

Создать централизованный конфиг форм и цветов без изменения UI и игровой механики.

## Создать

```text
src/data/teamKits.ts
src/tests/teamKits.test.ts
```

## Не менять на этом этапе

```text
BootScene.ts
CardView.ts
GameScene.ts
GameEngine.ts
Player.ts
PlayerField.ts
MatchTeamSetup
scripts/wiki-kits/
```

## Типы

Добавить:

```ts
export type ShirtNumberAnchor = {
  x: number;
  y: number;
};

export type TeamKitStyle = {
  flagCode: string;

  assetKey: string;
  path: string;

  primaryColor: string;
  secondaryColor: string;

  shirtNumberColor: string;
  shirtNumberStrokeColor: string;
};

export type GoalkeeperKitId =
  | 'gk-1'
  | 'gk-2';

export type GoalkeeperKitStyle = {
  id: GoalkeeperKitId;

  assetKey: string;
  path: string;

  primaryColor: string;
  secondaryColor: string;

  shirtNumberColor: string;
  shirtNumberStrokeColor: string;
};
```

## Общие константы

Добавить:

```ts
export const SHIRT_NUMBER_ANCHOR: ShirtNumberAnchor = {
  x: 0.5,
  y: 0.31,
};

export const KIT_IMAGE_SIZE = {
  width: 384,
  height: 420,
} as const;

export const DEFAULT_KIT_IMAGE_SCALE = 1;

export const DEFAULT_SHIRT_NUMBER_STYLE = {
  fontFamily: 'Arial Black',
  fontSize: 17,
  strokeThickness: 2,
} as const;
```

## Таблица TEAM_KIT_STYLES

Добавить:

```ts
export const TEAM_KIT_STYLES: readonly TeamKitStyle[] = [
  ['al', '#D71920', '#111111', '#FFFFFF', '#111111'],
  ['dz', '#FFFFFF', '#00843D', '#00843D', '#FFFFFF'],
  ['ar', '#75AADB', '#FFFFFF', '#111111', '#FFFFFF'],
  ['am', '#D90012', '#0033A0', '#FFFFFF', '#111111'],
  ['au', '#FFCD00', '#00843D', '#006747', '#FFFFFF'],
  ['at', '#ED2939', '#FFFFFF', '#FFFFFF', '#111111'],
  ['by', '#D22730', '#007C4C', '#FFFFFF', '#111111'],
  ['be', '#E30613', '#FFCD00', '#FFCD00', '#111111'],
  ['br', '#FFDF00', '#009C3B', '#002776', '#FFFFFF'],
  ['cm', '#007A5E', '#FCD116', '#FCD116', '#111111'],
  ['ca', '#D80621', '#FFFFFF', '#FFFFFF', '#111111'],
  ['cl', '#D52B1E', '#0039A6', '#FFFFFF', '#111111'],
  ['co', '#FCD116', '#003893', '#003893', '#FFFFFF'],
  ['cr', '#CE1126', '#002B7F', '#FFFFFF', '#111111'],
  ['hr', '#FFFFFF', '#FF0000', '#0033A0', '#FFFFFF'],
  ['cz', '#D7141A', '#11457E', '#FFFFFF', '#111111'],
  ['dk', '#C60C30', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ec', '#FFD100', '#034EA2', '#034EA2', '#FFFFFF'],
  ['eg', '#CE1126', '#000000', '#FFFFFF', '#111111'],
  ['gb-eng', '#FFFFFF', '#1C2C5B', '#1C2C5B', '#FFFFFF'],
  ['fr', '#002654', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ge', '#FFFFFF', '#E30A17', '#E30A17', '#FFFFFF'],
  ['de', '#FFFFFF', '#111111', '#111111', '#FFFFFF'],
  ['gr', '#0D5EAF', '#FFFFFF', '#FFFFFF', '#0D3B73'],
  ['hu', '#CE2939', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ir', '#FFFFFF', '#239F40', '#239F40', '#FFFFFF'],
  ['iq', '#017B3D', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ie', '#169B62', '#FFFFFF', '#FFFFFF', '#111111'],
  ['it', '#0066CC', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ci', '#F77F00', '#009E60', '#006B3F', '#FFFFFF'],
  ['jp', '#003478', '#FFFFFF', '#FFFFFF', '#111111'],
  ['kz', '#00AFCA', '#FEC50C', '#003B5C', '#FFFFFF'],
  ['ml', '#FCD116', '#14B53A', '#007A33', '#FFFFFF'],
  ['mx', '#006847', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ma', '#C1272D', '#006233', '#FFFFFF', '#111111'],
  ['nl', '#F36C21', '#111111', '#111111', '#FFFFFF'],
  ['ng', '#008753', '#FFFFFF', '#FFFFFF', '#111111'],
  ['no', '#BA0C2F', '#00205B', '#FFFFFF', '#111111'],
  ['pa', '#DA121A', '#FFFFFF', '#FFFFFF', '#111111'],
  ['py', '#D52B1E', '#FFFFFF', '#0038A8', '#FFFFFF'],
  ['pe', '#FFFFFF', '#D91023', '#D91023', '#FFFFFF'],
  ['pl', '#FFFFFF', '#DC143C', '#DC143C', '#FFFFFF'],
  ['pt', '#E42518', '#046A38', '#F7D117', '#111111'],
  ['qa', '#8A1538', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ro', '#FCD116', '#002B7F', '#002B7F', '#FFFFFF'],
  ['sa', '#006C35', '#FFFFFF', '#FFFFFF', '#111111'],
  ['gb-sct', '#003876', '#FFFFFF', '#FFFFFF', '#111111'],
  ['sn', '#FFFFFF', '#00853F', '#00853F', '#FFFFFF'],
  ['rs', '#C6363C', '#0C4076', '#FFFFFF', '#111111'],
  ['sk', '#0052B4', '#FFFFFF', '#FFFFFF', '#111111'],
  ['si', '#FFFFFF', '#005DA4', '#005DA4', '#FFFFFF'],
  ['za', '#FFB81C', '#007749', '#007749', '#FFFFFF'],
  ['kr', '#E6002D', '#111111', '#111111', '#FFFFFF'],
  ['es', '#AA151B', '#F1BF00', '#F1BF00', '#111111'],
  ['se', '#FFCD00', '#006AA7', '#006AA7', '#FFFFFF'],
  ['ch', '#D52B1E', '#FFFFFF', '#FFFFFF', '#111111'],
  ['tn', '#FFFFFF', '#E70013', '#E70013', '#FFFFFF'],
  ['tr', '#E30A17', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ua', '#FFD700', '#0057B8', '#0057B8', '#FFFFFF'],
  ['uy', '#5BC0EB', '#111111', '#111111', '#FFFFFF'],
  ['us', '#FFFFFF', '#002868', '#002868', '#FFFFFF'],
  ['uz', '#FFFFFF', '#0099B5', '#006B8F', '#FFFFFF'],
  ['ve', '#8A1538', '#F4C430', '#F4C430', '#111111'],
  ['gb-wls', '#C8102E', '#FFFFFF', '#FFFFFF', '#111111'],
].map(
  ([
    flagCode,
    primaryColor,
    secondaryColor,
    shirtNumberColor,
    shirtNumberStrokeColor,
  ]) => ({
    flagCode,
    assetKey: `kit-${flagCode}`,
    path: `kits/images/${flagCode}.png`,
    primaryColor,
    secondaryColor,
    shirtNumberColor,
    shirtNumberStrokeColor,
  }),
);
```

Если TypeScript теряет точные типы из-за `.map()`, использовать:

```ts
satisfies readonly TeamKitStyle[]
```

или записать массив объектов явно.

Главное: сохранить строгую типизацию.

## GK-комплекты

Добавить:

```ts
export const GOALKEEPER_KIT_STYLES: readonly GoalkeeperKitStyle[] = [
  {
    id: 'gk-1',
    assetKey: 'kit-gk-1',
    path: 'kits/images/gk-1.png',

    primaryColor: '#111111',
    secondaryColor: '#3A3A3A',

    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: '#111111',
  },
  {
    id: 'gk-2',
    assetKey: 'kit-gk-2',
    path: 'kits/images/gk-2.png',

    primaryColor: '#FFB81C',
    secondaryColor: '#111111',

    shirtNumberColor: '#111111',
    shirtNumberStrokeColor: '#FFFFFF',
  },
] as const;
```

## Registry ручных PNG

Добавить:

```ts
export const AVAILABLE_MANUAL_KIT_FLAG_CODES =
  new Set<string>([
    // Добавлять flagCode только после ручного размещения PNG.
  ]);

export const AVAILABLE_GOALKEEPER_KIT_IDS =
  new Set<GoalkeeperKitId>([
    // Добавлять id только после ручного размещения PNG.
  ]);
```

Пустой registry является валидным состоянием.

## Helper-функции

Добавить:

```ts
export function getTeamKitStyle(
  flagCode: string,
): TeamKitStyle | undefined;

export function getGoalkeeperKitStyle(
  id: GoalkeeperKitId,
): GoalkeeperKitStyle | undefined;

export function hasManualTeamKit(
  flagCode: string,
): boolean;

export function hasManualGoalkeeperKit(
  id: GoalkeeperKitId,
): boolean;

export function validateTeamKitStylesAgainstNationalTeams(): void;
```

## Валидация

Проверять:

```text
TEAM_KIT_STYLES содержит ровно 64 записи;
NATIONAL_TEAMS содержит ровно 64 записи;
для каждого flagCode из NATIONAL_TEAMS есть стиль;
лишних flagCode нет;
дубликатов flagCode нет;
дубликатов assetKey нет;
дубликатов path нет;
цвета соответствуют #RRGGBB;
path начинается с kits/images/;
path заканчивается .png;
assetKey начинается с kit-;
SHIRT_NUMBER_ANCHOR.x находится в диапазоне 0..1;
SHIRT_NUMBER_ANCHOR.y находится в диапазоне 0..1;
есть ровно gk-1 и gk-2;
gk-3 и gk-4 отсутствуют.
```

## Тесты

Проверить:

```text
ровно 64 стиля сборных;
соответствие NATIONAL_TEAMS;
валидность цветов;
валидность путей;
валидность anchor;
pl;
ua;
br;
gb-eng;
gb-sct;
gb-wls;
ровно 2 GK-комплекта;
пустой registry валиден;
sharp не импортируется в runtime.
```

---

# 4. Этап 2 — папка ассетов, README, Attribution и validator

## Цель

Подготовить контракт ручного добавления PNG.

## Создать

```text
public/kits/images/
public/kits/README.md
public/kits/ATTRIBUTION.json
scripts/validate-kits.ts
src/tests/validateKits.test.ts
```

## README

Описать:

```text
размер PNG = 384 × 420;
прозрачный фон предпочтителен;
белый фон допустим;
только футболка и шорты;
без гетр;
без номера;
без номинала;
без текста;
имя файла = <flagCode>.png;
GK-файлы = gk-1.png и gk-2.png;
номер добавляется программно;
номер размещается по SHIRT_NUMBER_ANCHOR;
```

Добавить пояснение:

```text
scripts/wiki-kits/ является экспериментальной dev-утилитой.
public/kits/imported/ не используется runtime игры.
Ручные PNG нужно копировать в public/kits/images/.
```

## ATTRIBUTION.json

Создать:

```json
{}
```

Пример записи:

```json
{
  "images/pl.png": {
    "sourcePage": "",
    "sourceFilePage": "",
    "source": "Wikipedia / Wikimedia Commons",
    "author": "",
    "license": "",
    "licenseUrl": "",
    "modified": true,
    "modificationNotes": "Manually cropped and adapted for use in Total Soccer: Mundial"
  }
}
```

## Validator

Добавить npm-команду:

```json
{
  "scripts": {
    "validate:kits": "tsx scripts/validate-kits.ts"
  }
}
```

Проверять только registry:

```text
AVAILABLE_MANUAL_KIT_FLAG_CODES;
AVAILABLE_GOALKEEPER_KIT_IDS.
```

Проверять:

```text
файл существует;
формат PNG;
размер 384 × 420;
изображение читается;
assetKey уникален;
path уникален;
есть attribution entry.
```

Если PNG непрозрачный:

```text
WARNING:
Opaque PNG accepted because card face background is white.
```

Это не ошибка.

Если лицензия не заполнена:

```text
WARNING
```

При ошибках:

```text
exit code = 1
```

При warnings без ошибок:

```text
exit code = 0
```

---

# 5. Этап 3 — типы составов и дефолтные составы

## Цель

Добавить данные игроков сборных без UI и без изменения матча.

## Создать

```text
src/data/squadTypes.ts
src/data/defaultSquads.ts
src/data/squadValidation.ts
src/tests/squads.test.ts
```

## Полевые игроки

Игрок привязан к номиналу карты внутри сборной.

Ранги:

```text
2
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
JOKER
```

Добавить:

```ts
export type FieldSquadMember = {
  rank: CardRank;
  name: string;
  shirtNumber: number;
};

export type GoalkeeperSquadMember = {
  id: string;
  name: string;
  shirtNumber: number;
};

export type NationalTeamSquad = {
  flagCode: string;

  fieldPlayers: Record<CardRank, FieldSquadMember>;

  goalkeepers: [
    GoalkeeperSquadMember,
    GoalkeeperSquadMember,
  ];

  defaultStartingGoalkeeperId: string;
};
```

## Дефолты

Для каждой из 64 сборных создать placeholder-состав.

Пример номеров:

```text
GK 1       -> 1
GK 2       -> 12

2          -> 2
3          -> 3
4          -> 4
5          -> 5
6          -> 6
7          -> 7
8          -> 8
9          -> 9
10         -> 10
J          -> 11
Q          -> 14
K          -> 15
A          -> 17
JOKER      -> 99
```

Имена:

```text
Игрок 2
Игрок 3
...
Игрок JOKER
Вратарь 1
Вратарь 2
```

## Валидация

Проверять:

```text
имя обязательно;
trim;
от 1 до 24 символов;
номер целый;
номер 0..99;
номера уникальны внутри сборной;
есть 14 полевых игроков;
есть 2 GK;
defaultStartingGoalkeeperId существует.
```

---

# 6. Этап 4 — localStorage составов

## Создать

```text
src/services/squadStorage.ts
src/tests/squadStorage.test.ts
```

## API

```ts
loadSquad(flagCode: string): NationalTeamSquad;
saveSquad(squad: NationalTeamSquad): void;
resetSquad(flagCode: string): NationalTeamSquad;
loadAllSquads(): NationalTeamSquad[];
```

## Правила

```text
если данных нет -> дефолт;
если JSON поврежден -> дефолт;
если структура невалидна -> дефолт;
reset -> удалить пользовательскую версию;
возвращать deep copy;
не мутировать дефолты.
```

Ключ:

```text
total-soccer-mundial:squads:v1
```

---

# 7. Этап 5 — UI редактора составов

## Создать

```text
src/scenes/SquadSelectScene.ts
src/scenes/SquadEditorScene.ts
```

## Изменить

```text
src/scenes/MenuScene.ts
src/main.ts
```

## MenuScene

Добавить кнопку:

```text
Составы
```

## SquadSelectScene

Показать 64 сборные:

```text
флаг;
название;
кнопка открытия.
```

## SquadEditorScene

Показать:

```text
таблицу полевых игроков;
таблицу двух GK;
radio выбора основного GK;
Сохранить;
Сбросить;
Назад.
```

Использовать DOM inputs.

Если нужно:

```ts
dom: {
  createContainer: true,
}
```

---

# 8. Этап 6 — resolver экипировок

## Создать

```text
src/game/kitAssetResolver.ts
src/tests/kitAssetResolver.test.ts
```

## Тип результата

```ts
export type ResolvedKitAsset =
  | {
      type: 'image';
      assetKey: string;
      shirtNumberColor: string;
      shirtNumberStrokeColor: string;
    }
  | {
      type: 'fallback';
      primaryColor: string;
      secondaryColor: string;
      shirtNumberColor: string;
      shirtNumberStrokeColor: string;
    };
```

## API

```ts
resolveTeamKitAsset(flagCode: string): ResolvedKitAsset;

resolveGoalkeeperKitAsset(
  goalkeeperKitId: GoalkeeperKitId,
): ResolvedKitAsset;
```

## Правила

```text
PNG зарегистрирован -> image;
PNG отсутствует -> fallback;
неизвестный flagCode -> безопасный fallback;
runtime не читает файловую систему;
runtime не делает сетевые запросы.
```

---

# 9. Этап 7 — загрузка ассетов в BootScene

## Изменить

```text
src/scenes/BootScene.ts
```

Загружать только:

```text
AVAILABLE_MANUAL_KIT_FLAG_CODES;
AVAILABLE_GOALKEEPER_KIT_IDS.
```

Не загружать:

```text
public/kits/imported/
```

Не импортировать:

```text
sharp;
wiki-kits.
```

---

# 10. Этап 8 — рендер лицевой стороны карт

## Создать при необходимости

```text
src/ui/KitCardFaceView.ts
```

## Изменить

```text
src/ui/CardView.ts
```

## Рендер

```text
1. белый фон;
2. PNG или fallback;
3. shirtNumber на груди;
4. rank слева сверху;
5. существующие интерактивные эффекты.
```

## Требования

```text
имя не выводится на карте;
нижний rank отсутствует;
гетры отсутствуют;
номер использует SHIRT_NUMBER_ANCHOR;
цвет номера берется из resolver;
обводка номера берется из resolver;
tooltip показывает имя игрока.
```

Tooltip полевой карты:

```text
<Имя>
№<номер>
Номинал: <rank>
```

---

# 11. Этап 9 — переход от редактируемых составов к статическим составам сборных

## Цель этапа

Упростить систему составов.

Ранее в игре была реализована возможность редактировать имена и номера игроков через UI и сохранять данные в `localStorage`.

От этой функции нужно отказаться.

Теперь у каждой сборной есть заранее подготовленный статический современный состав:

```text
14 полевых игроков
+
1 голкипер
=
15 игроков
```

Раздел:

```text
Составы
```

сохраняется в главном меню, но становится только информационным.

Пользователь может:

```text
выбрать сборную;
посмотреть ее состав;
вернуться назад.
```

Пользователь больше не может:

```text
редактировать имена;
редактировать номера;
выбирать основного GK;
сохранять изменения;
сбрасывать состав;
использовать localStorage для составов.
```

---

# 1. Зафиксированные продуктовые правила

## 1.1 Полевые игроки

У каждой сборной есть ровно `14` полевых игроков.

Каждый полевой игрок привязан к номиналу карты:

```text
2
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
JOKER
```

Для каждого игрока хранить:

```ts
type FieldSquadMember = {
  rank: CardRank;
  name: string;
  shirtNumber: number;
};
```

## 1.2 Голкипер

У каждой сборной есть ровно один голкипер.

Голкипер не привязан к номиналу карты.

Для него хранить:

```ts
type GoalkeeperSquadMember = {
  id: string;
  name: string;
  shirtNumber: number;
};
```

Использовать единый стабильный идентификатор:

```text
gk
```

Пример:

```ts
{
  id: 'gk',
  name: 'Wojciech Szczęsny',
  shirtNumber: 1,
}
```

## 1.3 Номер игрока JOKER

Для placeholder-составов и базового шаблона использовать:

```text
JOKER -> 18
```

Не использовать:

```text
JOKER -> 99
```

Номер `18` должен применяться в текущих дефолтных placeholder-данных до последующей загрузки реальных современных составов.

## 1.4 Уникальность номеров

Внутри одной сборной номера должны быть уникальными среди:

```text
14 полевых игроков;
1 голкипера.
```

Всего проверять:

```text
15 уникальных номеров.
```

## 1.5 Современные составы

Архитектура должна быть готова к последующей замене placeholder-данных на реальные современные фиксированные составы всех `64` сборных.

В рамках этого этапа:

```text
не собирать данные из интернета;
не обновлять реальные составы автоматически;
не добавлять сетевые запросы;
не придумывать новые реальные составы самостоятельно.
```

Если реальные составы еще не переданы пользователем, сохранить placeholder-данные, но привести их к новой структуре:

```text
14 полевых игроков;
1 GK;
JOKER -> 18.
```

---

# 2. Обновить типы составов

## Изменить

```text
src/data/squadTypes.ts
```

## Было

Ожидаемо сейчас существует структура с двумя GK:

```ts
goalkeepers: [
  GoalkeeperSquadMember,
  GoalkeeperSquadMember,
];

defaultStartingGoalkeeperId: string;
```

## Нужно сделать

Перейти на одного GK:

```ts
export type GoalkeeperSquadMember = {
  id: 'gk';
  name: string;
  shirtNumber: number;
};

export type NationalTeamSquad = {
  flagCode: string;

  fieldPlayers: Record<CardRank, FieldSquadMember>;

  goalkeeper: GoalkeeperSquadMember;

  /**
   * Временно оставить только при необходимости обратной совместимости.
   * Не использовать в новой логике.
   */
  teamId?: string;
};
```

Удалить из основной модели:

```text
goalkeepers;
defaultStartingGoalkeeperId;
startingGoalkeeperId;
выбор основного GK.
```

## Compatibility

Если существующие модули временно требуют старые поля для компиляции:

1. сначала изучить зависимости;
2. аккуратно обновить потребителей;
3. не сохранять старую структуру только ради удобства;
4. допускается временный adapter-helper;
5. adapter должен быть явно помечен как временный.

Не оставлять два источника истины.

---

# 3. Обновить дефолтные составы

## Изменить

```text
src/data/defaultSquads.ts
```

## Требования

Для каждой из `64` сборных создать placeholder-состав:

```text
14 полевых игроков;
1 голкипер.
```

Использовать номера:

```text
GK     -> 1

2      -> 2
3      -> 3
4      -> 4
5      -> 5
6      -> 6
7      -> 7
8      -> 8
9      -> 9
10     -> 10
J      -> 11
Q      -> 14
K      -> 15
A      -> 17
JOKER  -> 18
```

Использовать placeholder-имена:

```text
Игрок 2
Игрок 3
Игрок 4
Игрок 5
Игрок 6
Игрок 7
Игрок 8
Игрок 9
Игрок 10
Игрок J
Игрок Q
Игрок K
Игрок A
Игрок JOKER
Вратарь
```

Пример:

```ts
{
  flagCode: 'pl',

  fieldPlayers: {
    '2': {
      rank: '2',
      name: 'Игрок 2',
      shirtNumber: 2,
    },

    // ...

    JOKER: {
      rank: 'JOKER',
      name: 'Игрок JOKER',
      shirtNumber: 18,
    },
  },

  goalkeeper: {
    id: 'gk',
    name: 'Вратарь',
    shirtNumber: 1,
  },
}
```

Не использовать номер `99`.

---

# 4. Обновить валидацию составов

## Изменить

```text
src/data/squadValidation.ts
src/tests/squads.test.ts
```

## Проверять

```text
flagCode существует;
есть ровно 14 полевых игроков;
есть каждый обязательный rank;
есть ровно один goalkeeper;
goalkeeper.id = 'gk';
defaultStartingGoalkeeperId отсутствует;
goalkeepers[] отсутствует;
имя каждого игрока непустое;
имя trim;
длина имени 1..24;
номер целый;
номер 0..99;
номера уникальны среди 15 игроков;
JOKER placeholder использует shirtNumber = 18.
```

## Важно

Валидация должна работать и для будущих реальных составов.

Не требовать, чтобы реальный игрок `JOKER` обязательно имел номер `18`.

Правило:

```text
JOKER -> 18
```

обязательно только для текущего placeholder-шаблона.

В реальных составах допускается другой уникальный номер.

---

# 5. Удалить пользовательское хранение составов

## Изменить или удалить

```text
src/services/squadStorage.ts
src/tests/squadStorage.test.ts
```

## Требование

Пользовательские составы больше не сохраняются.

Удалить использование:

```text
localStorage;
saveSquad;
resetSquad;
loadAllSquads как источник пользовательских данных;
SQUAD_STORAGE_KEY;
total-soccer-mundial:squads:v1.
```

## Рекомендуемый вариант

Удалить:

```text
src/services/squadStorage.ts
src/tests/squadStorage.test.ts
```

если они больше нигде не нужны.

## Если сервис пока нужен существующим модулям

Допускается временно заменить его простым read-only adapter:

```ts
export function loadSquad(
  flagCode: string,
): NationalTeamSquad {
  return getDefaultSquad(flagCode);
}
```

При этом:

```text
не читать localStorage;
не писать localStorage;
не экспортировать saveSquad;
не экспортировать resetSquad;
не хранить SQUAD_STORAGE_KEY.
```

В отчете обязательно указать:

```text
удален ли squadStorage полностью;
или оставлен временный read-only adapter;
почему adapter пока необходим.
```

---

# 6. Превратить редактор составов в экран просмотра

## Изменить

```text
src/scenes/SquadSelectScene.ts
src/scenes/SquadEditorScene.ts
src/scenes/MenuScene.ts
src/main.ts
```

## MenuScene

Сохранить кнопку:

```text
Составы
```

Она по-прежнему открывает:

```text
SquadSelectScene
```

## SquadSelectScene

Сохранить:

```text
список 64 сборных;
флаг;
название;
кнопку открытия;
кнопку "Назад".
```

При необходимости изменить подпись кнопки:

```text
Открыть
```

или:

```text
Посмотреть состав
```

## SquadEditorScene

Сохранить сцену, но превратить ее в read-only экран.

Допускается переименовать файл и класс:

```text
SquadEditorScene
->
SquadViewScene
```

Но только если изменение не усложняет текущую архитектуру.

Если переименование требует слишком много несвязанных правок, оставить имя:

```text
SquadEditorScene
```

и добавить комментарий:

```text
Read-only squad viewer. Editing was removed intentionally.
```

## Экран состава должен показывать

```text
флаг;
название сборной;
заголовок "Состав сборной";
14 полевых игроков;
номинал карты;
имя игрока;
номер игрока;
одного GK;
кнопку "Назад".
```

## Таблица полевых игроков

| Номинал | Игрок       | Номер |
| ------- | ----------- | ----: |
| 2       | Игрок 2     |     2 |
| ...     | ...         |   ... |
| JOKER   | Игрок JOKER |    18 |

## Таблица GK

| Роль | Игрок   | Номер |
| ---- | ------- | ----: |
| GK   | Вратарь |     1 |

## Удалить

```text
DOM inputs;
radio buttons;
кнопку "Сохранить";
кнопку "Сбросить состав";
валидацию формы UI;
listener ввода;
сохранение через squadStorage;
reset через squadStorage;
сообщения об ошибке редактирования.
```

Использовать обычные Phaser Text-элементы.

После ухода со сцены не должно оставаться DOM-контейнеров от старого редактора.

---

# 7. Удалить draft-helper редактора

## Проверить

```text
src/scenes/squadEditorDraft.ts
src/tests/squadEditor.test.ts
```

Если helper обслуживает только редактирование:

```text
удалить его;
удалить устаревшие тесты;
создать новые тесты read-only просмотра.
```

Если часть helper полезна для формирования строк просмотра:

```text
переименовать;
оставить только чистую read-only логику;
удалить мутации;
удалить save/reset flow.
```

Не сохранять неиспользуемый код.

---

# 8. Обновить профиль игрока карты

## Изменить при необходимости

```text
src/ui/cardPlayerProfile.ts
src/ui/kitCardFaceModel.ts
src/ui/CardView.ts
src/ui/KitCardFaceView.ts
src/tests/cardFace.test.ts
```

## Полевые карты

Логика остается:

```text
flagCode команды;
rank карты;
->
полевой игрок;
->
имя;
номер;
tooltip;
номер на груди.
```

## GK

На этом этапе отдельная GK-колода еще не внедряется.

Но helper-профиль должен быть готов получить одного голкипера:

```ts
squad.goalkeeper
```

вместо:

```ts
squad.goalkeepers[index]
```

Не внедрять новую механику GK-карт сейчас.

---

# 9. Обновить MatchTeamSetup

## Изменить

```text
src/game/MatchTeamSetup.ts
src/tests/gameEngine.test.ts
src/tests/tournamentFlow.test.ts
```

## Новая структура

Подготовить минимальный snapshot:

```ts
export type MatchTeamSetup = {
  flagCode: string;

  squad: NationalTeamSquad;

  goalkeeperKitId: GoalkeeperKitId;

  /**
   * Временно оставить только при необходимости совместимости.
   */
  teamId?: string;
};
```

Удалить:

```text
startingGoalkeeperId;
defaultStartingGoalkeeperId;
выбор основного GK.
```

## Важно

В этом этапе:

```text
не внедрять отдельную GK-колоду;
не менять правила матча;
не менять обработку гола;
не менять обработку сэйва;
не менять обработку штанги.
```

Если текущий `MatchTeamSetup` уже используется матчем, обновить его аккуратно, сохранив существующее поведение.

---

# 10. Обновить тесты проекта

## Изменить или удалить устаревшие тесты

Проверить:

```text
src/tests/squads.test.ts
src/tests/squadStorage.test.ts
src/tests/squadEditor.test.ts
src/tests/cardFace.test.ts
src/tests/gameEngine.test.ts
src/tests/tournamentFlow.test.ts
src/tests/project.test.ts
```

## Добавить проверки

### Статические составы

```text
есть ровно 64 состава;
у каждой сборной 14 полевых игроков;
у каждой сборной 1 GK;
у GK id = 'gk';
у placeholder JOKER номер 18;
номер 99 отсутствует в placeholder-составах;
номера уникальны.
```

### Read-only UI

```text
кнопка "Составы" остается в меню;
SquadSelectScene показывает 64 сборные;
экран состава показывает 14 полевых игроков;
экран состава показывает 1 GK;
нет input;
нет radio;
нет кнопки "Сохранить";
нет кнопки "Сбросить состав";
есть кнопка "Назад".
```

### localStorage

```text
runtime состава не читает localStorage;
runtime состава не пишет localStorage;
SQUAD_STORAGE_KEY удален или не используется.
```

### Карты

```text
полевой профиль по rank работает;
JOKER placeholder возвращает shirtNumber = 18;
tooltip показывает корректный номер;
рендер карты не ломается.
```

---

# 11. Не изменять в рамках этапа

Не менять:

```text
src/scenes/BootScene.ts
src/scenes/bootKitAssets.ts
src/game/kitAssetResolver.ts
src/data/teamKits.ts
scripts/wiki-kits/
scripts/validate-kits.ts
public/kits/
отдельную GK-колоду
логику гола
логику сэйва
логику штанги
статистику голов
турнирную механику
правила карт
```

---

# 12. Проверка

После реализации выполнить:

```bash
npm run validate:kits
npm test
npm run build
npm run dev
```

## Ручная проверка

Проверить в браузере:

```text
1. В меню есть кнопка "Составы".
2. Открывается список 64 сборных.
3. Можно открыть Польшу, Украину и Бразилию.
4. Экран показывает read-only список игроков.
5. На экране нет input.
6. На экране нет radio.
7. Нет кнопки "Сохранить".
8. Нет кнопки "Сбросить состав".
9. У команды показан один GK.
10. У JOKER показан номер 18.
11. Кнопка "Назад" работает.
12. После выхода DOM inputs не остаются.
13. Матч запускается.
14. Карты продолжают отображаться.
15. Tooltip продолжает работать.
16. На карте JOKER отображается номер 18.
```

---

# 13. Критерии приемки

Этап считается выполненным, если:

1. Редактирование составов удалено.
2. Кнопка `Составы` сохранена.
3. Раздел составов работает в read-only режиме.
4. У каждой из 64 сборных есть 14 полевых игроков.
5. У каждой сборной есть один GK.
6. Голкипер не привязан к rank.
7. `defaultStartingGoalkeeperId` удален.
8. `startingGoalkeeperId` удален.
9. Массив из двух GK удален.
10. UI не содержит inputs.
11. UI не содержит radio.
12. UI не содержит сохранения и сброса.
13. Пользовательский `localStorage` составов не используется.
14. Для placeholder JOKER используется номер `18`.
15. Номер `99` не используется в placeholder-составах.
16. Рендер карт продолжает работать.
17. Tooltip продолжает работать.
18. `npm run validate:kits` проходит.
19. `npm test` проходит.
20. `npm run build` проходит.

---

# 14. Финальный отчет Codex

После выполнения вывести:

```text
Этап 9 завершен.

Созданные файлы:
- ...

Измененные файлы:
- ...

Удаленные файлы:
- ...

Что сделано со squadStorage:
- удален полностью / оставлен read-only adapter;
- причина.

Что сделано с SquadEditorScene:
- переименован / оставлен как read-only viewer;
- причина.

Количество сборных:
- ...

Полевых игроков на сборную:
- ...

GK на сборную:
- ...

Номер placeholder JOKER:
- ...

Используется ли localStorage составов:
- да / нет

Результат npm run validate:kits:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...

Что проверить вручную:
- ...

Что остается на следующий этап:
- ...
```

После отчета остановиться.

Не переходить к внедрению отдельной GK-колоды автоматически.


# Следующие этапы после Этапа 9

---

# 10. Обновленные продуктовые решения по ассетам экипировок

## 10.1 Формат изображений

Все изображения экипировок должны использовать формат:

```text
WEBP
```

Размер каждого изображения:

```text
130 × 150 px
```

Не использовать для runtime:

```text
PNG;
SVG;
384 × 420 px;
home.png;
away.png.
```

Экспериментальный wiki-importer может продолжать хранить собственные промежуточные PNG внутри служебных каталогов, но эти файлы не используются игрой.

## 10.2 Общая папка

Все игровые изображения экипировок лежат в одной папке:

```text
public/kits/images/
```

## 10.3 Основная форма сборной

Для каждой сборной существует только один основной комплект.

Имя файла совпадает с `flagCode` сборной:

```text
public/kits/images/pl.webp
public/kits/images/ua.webp
public/kits/images/br.webp
public/kits/images/gb-eng.webp
public/kits/images/gb-sct.webp
public/kits/images/gb-wls.webp
```

Не создавать вложенные каталоги для отдельных команд.

## 10.4 Файл-затычка

Если для сборной отсутствует ручное изображение экипировки, игра должна использовать:

```text
public/kits/images/none.webp
```

Файл `none.webp` является обязательным runtime-ассетом.

Нормальный fallback теперь:

```text
нет файла сборной
->
использовать none.webp
```

Не использовать цветную fallback-форму через Phaser Graphics как основной механизм.

Допускается оставить минимальный emergency fallback через Graphics только на случай критической ошибки загрузки самого `none.webp`, чтобы сцена не падала. Но в штатной работе он не должен использоваться.

## 10.5 Экипировки GK

Для голкиперов используются два универсальных изображения:

```text
public/kits/images/gk1.webp
public/kits/images/gk2.webp
```

Использовать именно такие имена:

```text
gk1.webp
gk2.webp
```

Не использовать:

```text
gk-1.webp
gk-2.webp
gk-3.webp
gk-4.webp
```

Размер:

```text
130 × 150 px
```

Формат:

```text
WEBP
```

## 10.6 Состав изображения

Каждый игровой WEBP должен содержать:

```text
футболку;
шорты.
```

Не должен содержать:

```text
гетры;
номер игрока;
номинал карты;
имя игрока;
фон карты;
человеческую фигуру;
подписи;
текст.
```

## 10.7 Программные слои карты

Лицевая сторона открытой карты рендерится так:

```text
1. белый фон карты;
2. WEBP экипировки сборной или none.webp;
3. номер игрока на груди футболки;
4. номинал карты в левом верхнем углу;
5. существующие интерактивные эффекты.
```

Для GK:

```text
1. белый фон карты;
2. gk1.webp или gk2.webp;
3. номер голкипера на груди;
4. текущий номинал GK-карты в левом верхнем углу;
5. существующие интерактивные эффекты.
```

---

# Этап 10 — миграция data contract экипировок на WEBP

## Цель

Обновить конфигурацию экипировок под новый формат файлов без изменения рендера и игровой механики.

## Изменить

```text
src/data/teamKits.ts
src/tests/teamKits.test.ts
```

## Не изменять

```text
BootScene.ts
bootKitAssets.ts
CardView.ts
KitCardFaceView.ts
GameEngine.ts
Player.ts
PlayerField.ts
GK-колоду
составы
wiki-importer
```

## Обновить размер ассетов

Заменить:

```ts
export const KIT_IMAGE_SIZE = {
  width: 384,
  height: 420,
} as const;
```

на:

```ts
export const KIT_IMAGE_SIZE = {
  width: 130,
  height: 150,
} as const;
```

## Обновить пути сборных

Для каждой из `64` записей:

```ts
path: `kits/images/${flagCode}.webp`
```

Пример:

```ts
{
  flagCode: 'pl',
  assetKey: 'kit-pl',
  path: 'kits/images/pl.webp',
  primaryColor: '#FFFFFF',
  secondaryColor: '#DC143C',
  shirtNumberColor: '#DC143C',
  shirtNumberStrokeColor: '#FFFFFF',
}
```

## Обновить идентификаторы GK

Заменить тип:

```ts
export type GoalkeeperKitId =
  | 'gk-1'
  | 'gk-2';
```

на:

```ts
export type GoalkeeperKitId =
  | 'gk1'
  | 'gk2';
```

## Обновить GK-конфигурацию

Использовать:

```ts
export const GOALKEEPER_KIT_STYLES: readonly GoalkeeperKitStyle[] = [
  {
    id: 'gk1',
    assetKey: 'kit-gk1',
    path: 'kits/images/gk1.webp',

    primaryColor: '#111111',
    secondaryColor: '#3A3A3A',

    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: '#111111',
  },
  {
    id: 'gk2',
    assetKey: 'kit-gk2',
    path: 'kits/images/gk2.webp',

    primaryColor: '#FFB81C',
    secondaryColor: '#111111',

    shirtNumberColor: '#111111',
    shirtNumberStrokeColor: '#FFFFFF',
  },
] as const;
```

## Добавить конфигурацию none.webp

Добавить:

```ts
export const NONE_KIT_ASSET = {
  assetKey: 'kit-none',
  path: 'kits/images/none.webp',
} as const;
```

## Registry

Сохранить registry доступных форм:

```ts
export const AVAILABLE_MANUAL_KIT_FLAG_CODES =
  new Set<string>([
    // Добавлять flagCode после размещения WEBP.
  ]);

export const AVAILABLE_GOALKEEPER_KIT_IDS =
  new Set<GoalkeeperKitId>([
    // Добавить после размещения файлов:
    // 'gk1',
    // 'gk2',
  ]);
```

## Валидация конфига

Обновить проверки:

```text
все пути сборных заканчиваются на .webp;
все пути начинаются с kits/images/;
размер = 130 × 150;
есть NONE_KIT_ASSET;
NONE_KIT_ASSET.path = kits/images/none.webp;
есть только gk1 и gk2;
gk-1, gk-2, gk-3, gk-4 отсутствуют;
пути GK:
  kits/images/gk1.webp
  kits/images/gk2.webp.
```

## Тесты

Проверить:

```text
64 TEAM_KIT_STYLES;
каждый path заканчивается .webp;
KIT_IMAGE_SIZE = 130 × 150;
NONE_KIT_ASSET;
gk1;
gk2;
нет gk-1;
нет gk-2;
нет gk-3;
нет gk-4;
registry допускает пустое состояние.
```

## Проверка

Выполнить:

```bash
npm test
npm run build
```

После отчета остановиться.

---

# Этап 11 — обновление README, ATTRIBUTION и validator под WEBP

## Цель

Обновить контракт ручного добавления ассетов.

## Изменить

```text
public/kits/README.md
public/kits/ATTRIBUTION.json
scripts/validate-kits.ts
src/tests/validateKits.test.ts
```

## README

Зафиксировать:

```text
формат WEBP;
размер 130 × 150;
единая папка public/kits/images/;
один файл на сборную;
имя файла = <flagCode>.webp;
обязательный fallback = none.webp;
GK-файлы = gk1.webp и gk2.webp;
файл содержит футболку и шорты;
гетры отсутствуют;
номер игрока отсутствует;
номинал карты отсутствует;
номер и номинал добавляются программно.
```

## ATTRIBUTION

Использовать ключи:

```text
images/pl.webp
images/ua.webp
images/br.webp
images/none.webp
images/gk1.webp
images/gk2.webp
```

Пример:

```json
{
  "images/pl.webp": {
    "sourcePage": "",
    "sourceFilePage": "",
    "source": "Wikipedia / Wikimedia Commons",
    "author": "",
    "license": "",
    "licenseUrl": "",
    "modified": true,
    "modificationNotes": "Manually cropped, simplified and converted to WEBP for Total Soccer: Mundial"
  }
}
```

## Validator

Проверять:

```text
none.webp существует всегда;
none.webp имеет формат WEBP;
none.webp имеет размер 130 × 150;
none.webp читается;

для registry сборных:
  <flagCode>.webp существует;
  формат WEBP;
  размер 130 × 150;
  файл читается;
  attribution entry существует;

для registry GK:
  gk1.webp / gk2.webp существует;
  формат WEBP;
  размер 130 × 150;
  файл читается;
  attribution entry существует.
```

Если ручная форма сборной отсутствует и flagCode не зарегистрирован:

```text
это не ошибка;
будет использован none.webp.
```

Если `none.webp` отсутствует:

```text
ERROR;
exit code = 1.
```

## Тесты

Проверить:

```text
валидный none.webp;
отсутствующий none.webp -> error;
неверный размер none.webp -> error;
валидный team WEBP;
неверный формат team asset -> error;
валидный gk1.webp;
валидный gk2.webp;
отсутствующая незарегистрированная команда не является ошибкой;
README содержит новый контракт.
```

## Проверка

Выполнить:

```bash
npm run validate:kits
npm test
npm run build
```

После отчета остановиться.

---

# Этап 12 — загрузка WEBP и none.webp в BootScene

## Цель

Обновить runtime-загрузку ассетов.

## Изменить

```text
src/scenes/bootKitAssets.ts
src/scenes/BootScene.ts
src/tests/bootScene.test.ts
```

## Правила загрузки

Всегда загружать:

```text
kits/images/none.webp
```

под ключом:

```text
kit-none
```

Для сборных загружать только зарегистрированные WEBP:

```text
AVAILABLE_MANUAL_KIT_FLAG_CODES
```

Для GK загружать только зарегистрированные:

```text
AVAILABLE_GOALKEEPER_KIT_IDS
```

## Не загружать

```text
PNG;
public/kits/imported/;
wiki-importer;
sharp;
fs;
внешние URL;
Wikipedia API;
Commons API.
```

## Пустой registry

При пустом registry:

```text
none.webp загружается;
игра запускается;
формы сборных используют none.webp;
GK временно используют none.webp, если gk1/gk2 не зарегистрированы.
```

## Тесты

Проверить:

```text
none.webp всегда ставится в очередь;
зарегистрированные team WEBP ставятся в очередь;
незарегистрированные team WEBP не загружаются;
зарегистрированные gk1/gk2 загружаются;
старые .png пути не используются;
imported/ не используется.
```

## Проверка

Выполнить:

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 13 — resolver: использовать none.webp вместо обычного fallback

## Цель

Перевести штатный fallback с Phaser Graphics на `none.webp`.

## Изменить

```text
src/game/kitAssetResolver.ts
src/tests/kitAssetResolver.test.ts
```

## Новый результат resolver

Использовать:

```ts
export type ResolvedKitAsset =
  | {
      type: 'image';
      assetKey: string;
      shirtNumberColor: string;
      shirtNumberStrokeColor: string;
      source: 'team' | 'goalkeeper' | 'none';
    }
  | {
      type: 'emergency-fallback';
      primaryColor: string;
      secondaryColor: string;
      shirtNumberColor: string;
      shirtNumberStrokeColor: string;
    };
```

## Team resolver

Если форма сборной зарегистрирована:

```text
вернуть image;
assetKey команды;
source = team.
```

Если форма отсутствует:

```text
вернуть image;
assetKey = kit-none;
source = none;
цвет номера и обводки взять из TEAM_KIT_STYLES конкретной сборной.
```

Это важно: даже при использовании `none.webp` цвет номера остается командным.

Если `flagCode` неизвестен:

```text
вернуть image;
assetKey = kit-none;
source = none;
shirtNumberColor = #111111;
shirtNumberStrokeColor = #FFFFFF.
```

## GK resolver

Если GK-ассет зарегистрирован:

```text
вернуть image;
assetKey = kit-gk1 или kit-gk2;
source = goalkeeper.
```

Если отсутствует:

```text
вернуть image;
assetKey = kit-none;
source = none.
```

## Emergency fallback

`emergency-fallback` используется только если текстура:

```text
kit-none
```

фактически не загружена или недоступна во время runtime.

Это аварийная защита.

## Тесты

Проверить:

```text
зарегистрированная команда -> team image;
незарегистрированная команда -> kit-none;
unknown flagCode -> kit-none;
зарегистрированный gk1 -> kit-gk1;
незарегистрированный gk1 -> kit-none;
незарегистрированный gk2 -> kit-none;
старый type = fallback больше не используется как штатный путь.
```

## Проверка

Выполнить:

```bash
npm test
npm run build
```

После отчета остановиться.

---

# Этап 14 — обновление рендера карт под WEBP и none.webp

## Цель

Использовать `WEBP`-текстуры в лицевой стороне карты.

## Изменить

```text
src/ui/kitCardFaceModel.ts
src/ui/KitCardFaceView.ts
src/ui/CardView.ts
src/tests/cardFace.test.ts
```

## Рендер

Для обычного случая:

```text
1. белый фон;
2. image asset:
   - kit-<flagCode>;
   - или kit-none;
3. номер на груди;
4. rank слева сверху.
```

Для аварийного случая:

```text
если kit-none отсутствует в textures:
  использовать минимальный emergency fallback через Graphics.
```

## Размер

Учитывать источник:

```text
130 × 150 px
```

Подобрать scale так, чтобы экипировка:

```text
не выходила за карту;
не перекрывала rank;
оставляла номер читаемым;
занимала основную часть белого фона.
```

## Anchor

Сохранить одну общую координату номера:

```ts
SHIRT_NUMBER_ANCHOR = {
  x: 0.5,
  y: 0.31,
};
```

Если из-за нового размера потребуется небольшая корректировка:

```text
изменить только глобальную константу;
не добавлять индивидуальные координаты сборных.
```

## Tooltip

Сохранить:

```text
имя;
номер;
номинал карты.
```

## Тесты

Проверить:

```text
kit-none используется для команды без ассета;
WEBP команды используется при регистрации;
номер выводится поверх none.webp;
номер выводится поверх team WEBP;
rank слева сверху;
нет гетр;
нет нижнего rank;
emergency fallback существует;
tooltip работает.
```

## Ручная проверка

Проверить:

```text
команда без WEBP показывает none.webp;
команда с WEBP показывает свой комплект;
номер виден поверх обеих версий;
клики работают;
анимации не ломаются.
```

## Проверка

Выполнить:

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 15 — реальные статические составы 64 сборных

## Цель

Заменить placeholder-составы на фиксированные современные составы.

## Важно

Dataset должен быть передан готовым.

Codex не должен:

```text
самостоятельно искать игроков в интернете;
придумывать составы;
автоматически обновлять составы;
назначать rank по собственному усмотрению;
обращаться к внешним API.
```

## Формат состава

Для каждой сборной:

```text
14 полевых игроков;
1 GK.
```

Полевые ранги:

```text
2
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
JOKER
```

Голкипер:

```text
отдельно;
id = gk;
без rank.
```

## Изменить

```text
src/data/defaultSquads.ts
src/tests/squads.test.ts
```

При необходимости:

```text
src/ui/cardPlayerProfile.ts
src/tests/cardFace.test.ts
```

## Валидация

Проверить:

```text
64 состава;
14 полевых игроков;
1 GK;
15 уникальных номеров;
имена непустые;
номера 0..99;
каждый обязательный rank заполнен;
голкипер не имеет rank.
```

## Примечание по JOKER

Для реальных составов:

```text
JOKER не обязан иметь номер 18.
```

Номер `18` был только placeholder-значением.

Для реального футболиста использовать его фактический номер в подготовленном dataset.

## Проверка

Выполнить:

```bash
npm test
npm run build
npm run dev
```

Проверить несколько сборных вручную:

```text
Польша;
Украина;
Бразилия;
Англия;
Япония;
Нигерия.
```

После отчета остановиться.

---

# Этап 16 — упрощенный MatchTeamSetup для статических составов

## Цель

Зафиксировать статический snapshot состава на матч без localStorage.

## Изменить

```text
src/game/MatchTeamSetup.ts
src/game/squadResolver.ts
src/game/GameEngine.ts
src/tests/matchTeamSetup.test.ts
src/tests/gameEngine.test.ts
```

## MatchTeamSetup

Использовать:

```ts
export type MatchTeamSetup = {
  flagCode: string;

  squad: NationalTeamSquad;

  goalkeeperKitId: GoalkeeperKitId;

  /**
   * Временно оставить только при необходимости совместимости.
   */
  teamId?: string;
};
```

## При старте матча

```text
получить статический состав по flagCode;
сделать deep copy;
случайно выбрать gk1 или gk2 через seeded random;
сохранить setup на весь матч.
```

## Требования

```text
не читать localStorage;
не менять состав во время матча;
одинаковый seed -> одинаковый GK-kit;
у двух команд независимые snapshot;
захваченная полевая карта использует игрока новой команды того же rank.
```

## Не внедрять

```text
отдельную GK-колоду;
логику recycle GK;
изменение правил удара.
```

## Проверка

Выполнить:

```bash
npm test
npm run build
```

После отчета остановиться.

---

# Этап 17 — изолированная реализация GK-колоды

## Цель

Создать отдельную GK-колоду без подключения к полю.

## Создать

```text
src/cards/GoalkeeperCard.ts
src/cards/GoalkeeperDeck.ts
src/cards/createGoalkeeperDeck.ts
src/tests/goalkeeperDeck.test.ts
```

## Номиналы

GK-колода содержит:

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

Всего:

```text
12 карт.
```

## Типы

```ts
export type GoalkeeperRank =
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export type GoalkeeperCard = {
  kind: 'goalkeeper';
  rank: GoalkeeperRank;
};
```

## API

```ts
drawTop(): GoalkeeperCard;
returnToBottom(card: GoalkeeperCard): void;
peekTop(): GoalkeeperCard | undefined;
getSize(): number;
```

## Правила

```text
отдельная колода на команду;
seeded random;
циклическая работа;
защита от пустого состояния.
```

## Тесты

Проверить:

```text
12 карт;
есть все ожидаемые ranks;
нет 2;
нет JOKER;
drawTop;
returnToBottom;
циклический порядок;
одинаковый seed;
ошибка пустой колоды.
```

После отчета остановиться.

---

# Этап 18 — подключение GK-колоды к полю

## Цель

Изменить источник карты для позиции goalkeeper.

## Изменить

```text
src/game/Player.ts
src/game/PlayerField.ts
src/game/GameState.ts
src/game/fieldRules.ts
src/game/GameEngine.ts
src/game/GameEvent.ts
src/ui/FieldView.ts
src/tests/gameEngine.test.ts
```

## Player

Добавить:

```ts
goalkeeperDeck: GoalkeeperDeck;
```

## PlayerField

Позиция:

```text
goalkeeper
```

должна содержать:

```ts
GoalkeeperCard | null
```

Полевые позиции продолжают содержать обычные карты.

## Восстановление поля

Сохранить порядок:

```text
1. goalkeeper;
2. defenders;
3. midfielders.
```

Источники:

```text
goalkeeper -> goalkeeperDeck;
defenders -> main deck;
midfielders -> main deck.
```

## Запреты

Не допускать:

```text
обычную карту в GK;
GK-карту в защиту;
GK-карту в полузащиту;
GK-карту в атаку;
GK-карту в attackBank;
GK-карту в main deck.
```

## События

Расширить событие восстановления или добавить отдельное:

```text
GOALKEEPER_CARD_RESTORED
```

## Проверка

Выполнить:

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 19 — жизненный цикл GK после гола, сэйва и штанги

## Цель

Корректно обрабатывать GK-карту после исхода удара.

## Изменить

```text
src/game/GameEngine.ts
src/game/GameEvent.ts
src/ui/FieldView.ts
src/ui/CardView.ts
src/tests/gameEngine.test.ts
```

## После гола

```text
снять GK-карту с позиции goalkeeper;
вернуть ее вниз GK-колоды защищавшейся команды;
не добавлять в attackBank;
не передавать атакующему;
не перекрашивать;
не добавлять в main deck.
```

Добавить событие:

```text
GOALKEEPER_CARD_RECYCLED
```

## После сэйва

```text
GK остается на поле;
rank не меняется;
gk1.webp / gk2.webp не меняется;
голкипер состава не меняется.
```

## После штанги

```text
GK остается на поле;
rank не меняется;
gk1.webp / gk2.webp не меняется;
голкипер состава не меняется.
```

## Рендер GK-карты

```text
белый фон;
gk1.webp или gk2.webp;
номер голкипера на груди;
rank GK слева сверху;
tooltip:
  имя GK;
  номер;
  GK: <rank>.
```

Если GK WEBP отсутствует:

```text
использовать none.webp.
```

## Проверка

Выполнить:

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 20 — авторы голов и статистика

## Цель

Показывать реальных авторов голов.

## Изменить

```text
src/game/GameEvent.ts
src/game/matchStats.ts
src/ui/TeamStatsView.ts
src/scenes/ResultScene.ts
src/tests/gameEngine.test.ts
```

## Snapshot автора

Добавить:

```ts
export type ScorerSnapshot = {
  playerName: string;
  shirtNumber: number;
  rank: CardRank;
  flagCode: string;
};
```

## При голе

```text
взять текущую атакующую карту;
определить владельца;
по snapshot команды и rank получить игрока;
сохранить scorer snapshot в GOAL_SCORED.
```

## Экран матча

Показывать:

```text
Голы: Lewandowski (#9), Zieliński (#10)
```

Если голов нет:

```text
Голы: пока нет
```

## ResultScene

Показывать авторов голов.

При наличии места:

```text
Lewandowski (#9), ход 18
```

Не добавлять виртуальные футбольные минуты.

## Проверка

Выполнить:

```bash
npm test
npm run build
npm run dev
```

После отчета остановиться.

---

# Этап 21 — финальная регрессия

## Выполнить

```bash
npm run validate:kits
npm test
npm run build
npm run dev
```

## Проверить ассеты

```text
none.webp загружается;
команда без WEBP использует none.webp;
команда с WEBP использует свой файл;
gk1.webp загружается;
gk2.webp загружается;
старые PNG не используются runtime;
public/kits/imported/ не используется runtime.
```

## Проверить карты

```text
белый фон;
экипировка;
номер на груди;
rank слева сверху;
tooltip;
нет гетр;
нет мастей;
нет нижнего rank.
```

## Проверить составы

```text
64 команды;
14 полевых игроков;
1 GK;
раздел "Составы" read-only;
нет localStorage;
нет редактирования.
```

## Проверить матч

```text
атаки;
захват карт;
восстановление поля;
GK deck;
гол;
сэйв;
штанга;
recycle GK;
статистика;
финальный экран;
турнирный режим.
```

## Проверить зависимости

```text
runtime не импортирует sharp;
runtime не читает fs;
runtime не обращается к Wikipedia;
runtime не обращается к Commons;
wiki-importer остается dev-утилитой.
```

---

# 22. Что намеренно не входит в текущие этапы

Не реализовывать:

```text
away kit;
third kit;
retro kit;
выбор формы перед матчем;
гетры;
редактирование составов;
localStorage составов;
замены игроков;
замены GK;
травмы;
рейтинги игроков;
разную силу сборных;
автоматическое обновление составов;
hotlinking;
сетевые запросы из браузера;
ленивую загрузку форм;
отдельный визуальный stack GK-колоды.
```

---

# 23. Порядок выполнения

Выполнять строго по одному этапу:

```text
Этап 10 -> data contract WEBP;
Этап 11 -> README, ATTRIBUTION, validator;
Этап 12 -> BootScene;
Этап 13 -> resolver none.webp;
Этап 14 -> Card renderer;
Этап 15 -> реальные составы;
Этап 16 -> MatchTeamSetup;
Этап 17 -> изолированная GK-колода;
Этап 18 -> подключение GK к полю;
Этап 19 -> жизненный цикл GK;
Этап 20 -> статистика;
Этап 21 -> финальная регрессия.
```

После каждого этапа:

```bash
npm test
npm run build
```

Для runtime-этапов дополнительно:

```bash
npm run dev
```

После каждого отчета остановиться.

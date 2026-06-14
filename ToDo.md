# Total Soccer: Mundial
# Добавить сборную Северной Ирландии

## Цель

Добавить в игру новую сборную:

```text
Northern Ireland / Северная Ирландия

Важно: в игре уже есть сборная Ирландии / Republic of Ireland. Новая команда должна быть отдельной сущностью и не должна конфликтовать с существующей Ирландией.

1. Проверить текущую структуру команд

Перед изменениями изучить файлы:

src/data/nationalTeams.ts
src/data/teamKits.ts
src/data/realSquads.ts
src/data/defaultSquads.ts
src/data/squadTypes.ts
src/data/squadValidation.ts
src/scenes/TeamSelectScene.ts
src/scenes/TournamentSetupScene.ts
src/scenes/SquadSelectScene.ts
src/scenes/SquadEditorScene.ts
src/tests/*
PROJECT_SPEC_FOR_CHATGPT.md

Найти все места, где может быть зафиксировано количество команд:

64
8x8
team count
nationalTeams.length

Если где-то тест или UI жестко ожидает 64 команды — обновить под новое значение.

После добавления Северной Ирландии ожидаемое количество команд должно стать:

65

Если проект принципиально требует ровно 64 команды, остановиться и сообщить, какую команду нужно заменить. Но по текущему запросу нужно именно добавить новую команду, а не заменить существующую.

2. Код команды

Добавить уникальный flagCode / id:

'nir'

Не использовать:

'irl'
'ireland'

потому что это должно остаться за существующей Ирландией.

Рекомендуемые поля:

{
  id: 'northern-ireland',
  flagCode: 'nir',
  name: 'Northern Ireland',
  shortName: 'Northern Ireland',
  countryName: 'Northern Ireland',
}

Адаптировать под фактическую структуру nationalTeams.ts.

3. Название команды

Использовать в игре:

Northern Ireland

4. Флаг

Добавить флаг для Северной Ирландии в ту же систему, где хранятся остальные флаги.

Ожидаемый файл зависит от проекта. Проверить существующую структуру:

public/flags/
public/kits/
src/data/nationalTeams.ts

Если флаги лежат как изображения, добавить:

nir.png

или формат, который используется в проекте.

Важно:

флаг Северной Ирландии не должен перезаписать флаг Ирландии;
Ireland / Republic of Ireland должна продолжать использовать свой текущий flagCode;
Northern Ireland должна использовать отдельный flagCode: nir.

Для спортивного представления можно использовать флаг/эмблему, принятую в футбольных источниках для Northern Ireland. Если в текущем наборе флагов есть стандартный NIR, использовать его.

5. Цвета команды

Добавить цвета для Северной Ирландии.

Рекомендуемые основные цвета:

primaryColor: '#006A3A'       // насыщенный зеленый
secondaryColor: '#FFFFFF'     // белый
accentColor: '#C8102E'        // красный акцент

Для текста номера на форме:

shirtNumberColor: '#FFFFFF'
shirtNumberStrokeColor: '#0B2F1D'

Если на форме белый номер плохо читается — использовать:

shirtNumberColor: '#FFFFFF'
shirtNumberStrokeColor: '#111111'

Основная игровая форма должна быть зеленой с белыми и красными деталями.

6. Форма команды

Если для каждой команды используется WebP-ассет формы:

public/kits/images/<flagCode>.webp

добавить:

public/kits/images/nir.webp

Требования к ассету:

формат: WebP
размер: как у остальных форм проекта
фон: прозрачный или как принято в проекте
без номера на форме
стиль: как у остальных игровых форм

Визуальное описание формы:

зеленая футболка;
белые детали;
красный небольшой акцент;
темно-зеленые или белые шорты;
общий стиль должен соответствовать остальным формам игры.

Если ассет формы пока отсутствует:

команда должна использовать fallback-форму;
игра не должна падать;
добавить nir в список доступных manual kit codes только после появления nir.webp, если в проекте есть такой список.
7. Состав Северной Ирландии

Добавить состав в:

src/data/realSquads.ts

или фактический файл, где сейчас хранятся реальные составы.

Структура должна соответствовать текущему формату проекта:

fieldPlayers: {
  rank: CardRank;
  name: string;
  shirtNumber: number;
}[];

goalkeeper: {
  id: 'gk';
  name: string;
  shirtNumber: 1;
};

Если в проекте используются другие поля — адаптировать.

8. Рекомендуемый игровой состав

Использовать актуальную заявку Северной Ирландии как основу, но выбрать 14 полевых игроков + 1 вратаря под формат игры.

Goalkeeper
goalkeeper: {
  id: 'gk',
  name: 'Bailey Peacock-Farrell',
  shirtNumber: 1,
}
Field players
fieldPlayers: [
  { rank: '2', name: 'Terry Devlin', shirtNumber: 2 },
  { rank: '3', name: 'Ruairi McConville', shirtNumber: 3 },
  { rank: '4', name: 'Brodie Spencer', shirtNumber: 4 },
  { rank: '5', name: 'Ciaron Brown', shirtNumber: 5 },

  { rank: '6', name: 'Eoin Toal', shirtNumber: 6 },
  { rank: '7', name: 'Ethan Galbraith', shirtNumber: 7 },
  { rank: '8', name: 'Justin Devenny', shirtNumber: 8 },
  { rank: '9', name: 'Jamie Donley', shirtNumber: 9 },

  { rank: '10', name: 'Isaac Price', shirtNumber: 10 },
  { rank: 'J', name: 'Callum Marshall', shirtNumber: 11 },
  { rank: 'Q', name: 'Dion Charles', shirtNumber: 12 },
  { rank: 'K', name: 'Trai Hume', shirtNumber: 14 },
  { rank: 'A', name: 'Shea Charles', shirtNumber: 15 },
  { rank: 'JOKER', name: 'Josh Magennis', shirtNumber: 18 },
]

Примечания:

1. Номера — игровые стабильные номера для карточек, а не обязательно официальные номера последней заявки.
2. Conor Bradley не добавлять в эту версию состава, так как в актуальной мартовской заявке он отсутствовал из-за травмы.
3. Если в проекте принято ставить звездного игрока на JOKER, можно поменять:
   JOKER = Shea Charles
   A = Trai Hume
   K = Dion Charles
   Q = Isaac Price
   Но предпочтительно сохранить предложенную выше структуру, чтобы JOKER был ветеранским/особым вариантом.
9. Обновить teamKits

В src/data/teamKits.ts или соответствующем файле добавить запись:

{
  flagCode: 'nir',
  primaryColor: '#006A3A',
  secondaryColor: '#FFFFFF',
  accentColor: '#C8102E',
  shirtNumberColor: '#FFFFFF',
  shirtNumberStrokeColor: '#111111',
}

Адаптировать под фактическую структуру.

10. Обновить nationalTeams

В src/data/nationalTeams.ts добавить новую команду.

Важно:

команда должна появляться в выборе команд;
команда должна появляться в выборе команд турнира;
команда должна иметь уникальный flagCode;
команда не должна конфликтовать с Ирландией.

Если список команд отсортирован:

добавить Северную Ирландию рядом с Ireland / Republic of Ireland;
или сохранить текущий принцип сортировки.
11. Обновить squad validation

Проверить, что новый состав проходит валидацию:

14 полевых игроков;
ровно один игрок на каждый rank:
2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, JOKER;
1 goalkeeper;
у всех игроков есть name;
у всех игроков есть shirtNumber;
flagCode = nir;
12. Обновить тесты

Обновить существующие тесты и добавить проверки.

Проверить:

Northern Ireland есть в nationalTeams;
Northern Ireland имеет flagCode nir;
Ireland и Northern Ireland имеют разные flagCode;
общее количество команд увеличилось с 64 до 65;
real squad для nir существует;
real squad для nir проходит validation;
у nir есть 14 field players;
у nir есть goalkeeper;
в составе есть Bailey Peacock-Farrell;
в составе есть Trai Hume;
в составе есть Shea Charles;
в составе есть Dion Charles;
teamKits содержит nir;
цвета nir валидны в формате #RRGGBB;
выбор команды не ломается при 65 командах;
турнирный random team selection работает с 65 командами;
build проходит.

Если текущие тесты жестко ожидают 64, заменить ожидание на:

expect(nationalTeams.length).toBeGreaterThanOrEqual(65);

или, если нужен точный контроль:

expect(nationalTeams).toHaveLength(65);
13. Проверить UI

Проверить вручную:

1. Открыть выбор команд.
2. Найти Northern Ireland.
3. Убедиться, что Ireland осталась отдельной командой.
4. Выбрать Northern Ireland против Ireland.
5. Запустить матч.
6. Проверить флаг Northern Ireland.
7. Проверить форму Northern Ireland или fallback.
8. Проверить номера на форме.
9. Проверить tooltip игроков.
10. Проверить, что команда доступна в турнире.
14. Не менять

Не изменять:

GameEngine
AI обычного матча
Penalty AI
TournamentEngine
PenaltyShootoutEngine
правила карт
правила полузащитников
главное меню
match UI
Rules / About

Задача касается только добавления новой команды, ее цветов, флага, формы и состава.

15. Команды проверки

Запустить:

npm run validate:kits
npm test
npm run build
npm run dev
16. Формат отчета

После выполнения вывести:

Сборная Северной Ирландии добавлена.

Созданные файлы:
- ...

Измененные файлы:
- ...

Команда:
- id:
- flagCode:
- name:

Количество команд:
- было:
- стало:

Флаг:
- добавлен / использован fallback:

Форма:
- добавлен nir.webp / используется fallback:

Цвета:
- primary:
- secondary:
- accent:
- shirtNumberColor:
- shirtNumberStrokeColor:

Состав:
- goalkeeper:
- field players:

Проверка конфликта с Ireland:
- ...

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
- да / нет

Результат npm run validate:kits:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...

---

## Важно
In-app Browser недоступен (iab), поэтому визуальный скрин/клик-тест через него не делать.
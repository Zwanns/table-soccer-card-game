````md
# Total Soccer: Mundial
# Разделить About и Rules + исправить украинскую локализацию

## Цель

Обновить информационные разделы главного меню:

1. Исправить украинскую версию раздела `About`: сейчас при выборе украинского языка показывается английский текст.
2. Убрать правила игры из раздела `About`.
3. Добавить новую кнопку `Rules` в главное меню.
4. В новом разделе `Rules` показать актуальные правила игры.
5. Раздел `Rules` должен иметь три языковые версии:
   - English;
   - Polski;
   - Українська.

---

## Ожидаемые файлы

Проверить:

```text
src/scenes/MenuScene.ts
src/config.ts
src/tests/project.test.ts
src/tests/menuScene.test.ts
PROJECT_SPEC_FOR_CHATGPT.md
````

Также найти фактическое место хранения текстов `About`:

```text
About
ABOUT
aboutText
aboutContent
language
locale
English
Polski
Українська
```

Если тексты вынесены в отдельный файл — изменить его.

---

# 1. Главное меню: добавить кнопку Rules

В главном меню сейчас есть кнопки:

```text
Game modes
Teams
About
```

Добавить новую кнопку:

```text
Rules
```

Рекомендуемый порядок:

```text
Game modes
Teams
Rules
About
```

Требования:

```text
кнопка Rules использует тот же стиль, что и остальные кнопки;
ширина кнопки Rules равна ширине остальных кнопок меню;
кнопка Rules открывает отдельный экран/панель правил;
кнопка Back возвращает в главное меню;
кнопки не перекрывают друг друга;
логотип-табло остается на месте;
мигание логотипа не меняется.
```

Если после добавления четвертой кнопки вертикально становится тесно — немного уменьшить отступ между кнопками или опустить блок кнопок, но не менять общий стиль меню.

---

# 2. Раздел About: оставить только описание игры

Из раздела `About` убрать правила игры.

`About` должен быть коротким информационным разделом:

```text
что это за игра;
что она вдохновлена футболом, карточными дуэлями и международными турнирами;
что это ретро-аркадная карточная игра;
можно упомянуть локальный матч, турнир, AI.
```

Не описывать в `About`:

* как бить карты;
* спецправила;
* полузащитников;
* вратарскую колоду;
* пенальти;
* турнирные правила.

Эти тексты должны быть только в `Rules`.

---

# 3. Исправить украинскую версию About

Сейчас украинская версия `About` почему-то показывает английский текст.

Нужно:

* найти ошибку в mapping/localization;
* убедиться, что украинский язык использует украинский текст;
* не дублировать английский текст в украинском ключе;
* покрыть тестом.

Пример украинского `About`:

```text
TOTAL SOCCER: MUNDIAL — це ретро-карткова футбольна гра про міжнародні матчі, турніри та драматичні серії пенальті.

Обирай збірні, проводь атаки, захищайся, підключай півзахисників і змагайся проти людини або AI.

Гра натхненна футбольними альбомами, аркадними іграми 80-х і атмосферою великих міжнародних турнірів.
```

---

# 4. Добавить отдельный раздел Rules

Раздел `Rules` должен открываться из главного меню.

Варианты реализации:

* отдельное состояние внутри `MenuScene`;
* отдельная scene;
* существующая modal/panel система, если она уже есть.

Предпочтительно использовать существующий подход, которым сейчас открывается `About`.

## UI требования

В разделе `Rules` должны быть:

```text
заголовок Rules;
текст правил;
переключатель языка или существующий механизм выбора языка;
кнопка Back.
```

Если в `About` уже есть переключение языка — использовать тот же механизм.

Если текст длинный:

* сделать прокрутку;
* или разбить на страницы;
* или сделать компактный текст с заголовками.

Не допускать выхода текста за экран.

---

# 5. Тексты Rules

Добавить три версии правил.

## English

```text
TOTAL SOCCER: MUNDIAL — Rules

Goal of the game
Score more goals than your opponent before the match ends.

Teams and cards
Each team has field players linked to card ranks: 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A and JOKER.
Each team also has a goalkeeper card drawn from a separate goalkeeper deck.

Basic attack
The attacking player draws or plays an attacking card and tries to beat a card in the current defensive line.
A normal deck card beats a defender if its rank is equal or higher.

Special rules
Some lower cards can beat high cards:
2 beats JOKER.
6 beats A.
7 beats K.
8 beats Q.
9 beats J.

Defensive lines
An attack moves through the opponent’s lines step by step.
The attacker must choose legal targets from the current line.

Midfield support
While attacking through the midfield line, a player may use one of their own midfielders in the matching corridor.
A committed midfielder must strictly beat the opposite midfielder, or use a special rule.
Equal ranks do not work for committed midfielders.
If the attack is lost after using midfielders, the opponent may receive one open midfield zone for the next counterattack.

Open midfield zone
An open midfield zone works like a weak rank-2 gap.
It can be used only when the rules allow it.
The AI should prefer beating a real defensive card before using an open zone.

Goalkeeper
The goalkeeper is resolved with a separate goalkeeper card.
After a goal, the goalkeeper card returns to the bottom of the goalkeeper deck.
The goalkeeper card is never captured by the attacker.

Shot result
A shot can end as:
Goal.
Goalkeeper save.
Post.
Turnover.

Penalty shootout
Penalty shootouts use a separate penalty system.
Penalty AI is separate from normal match AI.
The goalkeeper deck from the normal match is not used in penalties.

Tournament
Tournament mode supports group matches, knockout matches and penalty shootouts when needed.
Teams may be controlled by a human player or AI.
```

---

## Polski

```text
TOTAL SOCCER: MUNDIAL — Zasady

Cel gry
Zdobądź więcej bramek niż przeciwnik przed końcem meczu.

Drużyny i karty
Każda drużyna ma zawodników z pola przypisanych do rang kart: 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A oraz JOKER.
Każda drużyna ma też bramkarza dobieranego z osobnej talii bramkarza.

Podstawowy atak
Gracz atakujący dobiera lub zagrywa kartę ataku i próbuje pokonać kartę w aktualnej linii obrony przeciwnika.
Zwykła karta z talii pokonuje obrońcę, jeśli ma taką samą lub wyższą rangę.

Zasady specjalne
Niektóre niższe karty mogą pokonać wysokie karty:
2 pokonuje JOKERA.
6 pokonuje A.
7 pokonuje K.
8 pokonuje Q.
9 pokonuje J.

Linie obrony
Atak przechodzi przez kolejne linie przeciwnika.
Atakujący musi wybierać legalne cele z aktualnej linii.

Wsparcie pomocnika
Podczas ataku przez linię pomocy gracz może użyć jednego ze swoich pomocników w tym samym korytarzu.
Podłączony pomocnik musi być wyraźnie silniejszy od przeciwnego pomocnika albo użyć zasady specjalnej.
Równe rangi nie działają dla podłączonych pomocników.
Jeśli atak zostanie stracony po użyciu pomocników, przeciwnik może otrzymać jedną otwartą strefę w środku pola do następnej kontry.

Otwarta strefa w środku pola
Otwarta strefa działa jak słaba luka o randze 2.
Można jej użyć tylko wtedy, gdy pozwalają na to zasady.
AI powinno najpierw próbować pokonać prawdziwą kartę obrony, a dopiero potem używać otwartej strefy.

Bramkarz
Bramkarz jest rozstrzygany osobną kartą bramkarza.
Po golu karta bramkarza wraca na spód talii bramkarza.
Karta bramkarza nigdy nie jest przejmowana przez atakującego.

Wynik strzału
Strzał może zakończyć się jako:
Gol.
Obrona bramkarza.
Słupek.
Strata piłki.

Rzuty karne
Serie rzutów karnych używają osobnego systemu.
AI rzutów karnych jest oddzielne od AI zwykłego meczu.
Talia bramkarza ze zwykłego meczu nie jest używana w rzutach karnych.

Turniej
Tryb turniejowy obsługuje mecze grupowe, fazę pucharową i serie rzutów karnych, gdy są potrzebne.
Drużyny mogą być kontrolowane przez gracza lub AI.
```

---

## Українська

```text
TOTAL SOCCER: MUNDIAL — Правила

Мета гри
Забий більше голів, ніж суперник, до завершення матчу.

Команди і карти
Кожна команда має польових гравців, прив’язаних до рангів карт: 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A та JOKER.
Кожна команда також має воротаря, який бере карту з окремої воротарської колоди.

Базова атака
Гравець, який атакує, бере або розігрує атакувальну карту і намагається побити карту в поточній лінії захисту суперника.
Звичайна карта з колоди б’є захисника, якщо її ранг дорівнює або вищий.

Спеціальні правила
Деякі нижчі карти можуть побити високі карти:
2 б’є JOKER.
6 б’є A.
7 б’є K.
8 б’є Q.
9 б’є J.

Лінії захисту
Атака проходить через лінії суперника поетапно.
Атакувальний гравець має вибирати легальні цілі з поточної лінії.

Підключення півзахисника
Під час атаки через лінію півзахисту гравець може використати одного зі своїх півзахисників у відповідному коридорі.
Підключений півзахисник має бути строго сильнішим за карту навпроти або використати спеціальне правило.
Рівні ранги для підключених півзахисників не працюють.
Якщо після використання півзахисників атака завершується втратою м’яча, суперник може отримати одну відкриту зону в півзахисті для наступної контратаки.

Відкрита зона в півзахисті
Відкрита зона працює як слабка прогалина з рангом 2.
Її можна використати лише тоді, коли це дозволено правилами.
AI має спочатку намагатися побити справжню карту захисту, а вже потім використовувати відкриту зону.

Воротар
Дія воротаря розігрується окремою воротарською картою.
Після гола карта воротаря повертається вниз воротарської колоди.
Карта воротаря ніколи не захоплюється атакувальним гравцем.

Результат удару
Удар може завершитися як:
Гол.
Сейв воротаря.
Штанга.
Втрата м’яча.

Серія пенальті
Серії пенальті використовують окрему систему.
AI для пенальті відокремлений від AI звичайного матчу.
Воротарська колода звичайного матчу не використовується в пенальті.

Турнір
Турнірний режим підтримує групові матчі, плей-оф і серії пенальті, коли вони потрібні.
Команди можуть керуватися гравцем або AI.
```

---

# 6. Локализация названий кнопок

Если сейчас кнопки меню локализованы, добавить перевод для `Rules`.

```text
English: Rules
Polski: Zasady
Українська: Правила
```

Если меню сейчас не локализовано и кнопки всегда английские — оставить `Rules`, чтобы не расширять задачу.

---

# 7. Не ломать ширину кнопок

Новая кнопка `Rules` должна использовать существующий расчет ширины:

```text
getMenuButtonWidth()
```

Не добавлять отдельную ширину.

Требования:

```text
Game modes, Teams, Rules, About имеют одинаковую ширину;
меню режимов игры не меняется;
логотип не растягивается;
мигание логотипа не меняется.
```

---

# 8. Не менять

Не изменять:

```text
GameEngine
PenaltyShootoutEngine
AI обычного матча
Penalty AI
TournamentEngine
карты
составы
формы
ассеты меню
menu-logo1.png
menu-logo2.png
мигание логотипа
ширину кнопок меню режимов игры
```

---

# 9. Тесты

Обновить или добавить тесты.

Проверить:

```text
кнопка Rules есть в главном меню;
Rules открывает отдельный раздел правил;
Back из Rules возвращает в главное меню;
About больше не содержит правил игры;
About содержит украинский текст, а не английский;
Rules содержит английскую версию;
Rules содержит польскую версию;
Rules содержит украинскую версию;
Rules содержит актуальные special rules: 2 > JOKER, 6 > A, 7 > K, 8 > Q, 9 > J;
Rules содержит strict-rule для подключенного полузащитника;
Rules содержит информацию об open midfield zone;
Rules содержит информацию о GK deck;
Rules содержит информацию о penalty shootout;
новая кнопка Rules использует общую ширину кнопок;
старые кнопки Game modes, Teams, About работают;
menu-logo.png не возвращается в runtime.
```

Если есть тесты локализации:

* добавить проверку, что Ukrainian About не равен English About;
* добавить проверку, что Ukrainian Rules не равен English Rules;
* добавить проверку, что Polish Rules не равен English Rules.

---

# 10. Проверка

Запустить:

```bash
npm test
npm run build
npm run dev
```

В браузере вручную проверить:

```text
1. Главное меню открывается.
2. Появилась кнопка Rules.
3. Кнопка Rules такой же ширины, как остальные.
4. Rules открывает правила.
5. Правила не вылезают за экран.
6. Можно прочитать английскую, польскую и украинскую версии.
7. Украинская версия действительно украинская.
8. About больше не содержит правил.
9. About на украинском больше не показывает английский текст.
10. Back работает из About и Rules.
```

---

# 11. Формат отчета

После выполнения вывести:

```text
Разделение About и Rules завершено.

Созданные файлы:
- ...

Измененные файлы:
- ...

Кнопка Rules:
- добавлена / не добавлена

Порядок кнопок главного меню:
- ...

About:
- правила удалены:
- украинская версия исправлена:

Rules:
- English:
- Polski:
- Українська:

Локализация кнопки Rules:
- ...

Использует ли Rules общую ширину кнопок:
- да / нет

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
- да / нет

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...

Что проверить вручную:
- ...
```

После отчета остановиться.

```
```

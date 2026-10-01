# HOME/AWAY — звіт про реалізацію

Базова версія: 1.4.5. Версію не змінено. Commit і push не виконувалися.

## Реалізовані етапи

1. **Реєстр і ресурси.** HOME читається з `<flagCode>1.webp`, AWAY — з
   `<flagCode>2.webp`. Синхронізація формує незалежні списки доступності.
   Preload завантажує лише наявні комплекти, кожен один раз. Fallback:
   відсутня AWAY → HOME → `none.webp`. Наявність кольорів не обмежує preload.
2. **Відображення.** `MatchTeamSetup.fieldKit` зберігає вибір для конкретного
   матчу. Польові карти на полі, у колоді атаки, під час захисту, відновлення
   й анімацій отримують ключ вибраної форми. Явний ключ AWAY має пріоритет
   перед HOME, яку раніше міг підставити профіль футболіста. Номер і обведення
   беруться з того самого комплекту. Restart і прямий Play Again зберігають вибір.
3. **Quick Match.** Над кожним прев’ю є HOME/AWAY. Вибір незалежний для двох
   команд; відсутня AWAY недоступна. Інша збірна або новий екран вибору скидає
   комплект на HOME. Перемикання зберігає позицію прокручування списку.
   Вибір передається також в окремі пенальті.
4. **Турнір.** Чиста функція перевіряє HOME/HOME → HOME/AWAY → AWAY/HOME →
   AWAY/AWAY. Перша комбінація без конфлікту перемагає; якщо таких немає,
   береться найменший конфлікт із тим самим порядком переваг при рівності.
   Порядок команд береться з турнірної пари. Кожен новий матч визначає форму
   заново; Restart не викликає алгоритм. Пенальті отримують форми за кодами команд.
5. **Перевірка.** Виконані цільові тести й TypeScript на проміжних етапах,
   потім повний набір тестів, production build, перевірка ресурсів і diff.

## Структура даних і ручне введення кольорів

`src/data/teamKits.ts` зберігає чинний HOME-реєстр `TEAM_KIT_STYLES` без змін
кольорів. HOME має ключ `kit-<flagCode>`, AWAY — `kit-<flagCode>-away`.
Метадані AWAY розміщені окремо в `AWAY_KIT_METADATA`; початковий запис — `de: {}`.

У цьому записі власник додає **реальні** значення `primaryColor` і
`secondaryColor` у форматі `#RRGGBB`. Вигаданих значень і копій HOME немає.
Обидва кольори плюс наявне зображення автоматично допускають комплект до
турнірного алгоритму після перезапуску dev-сервера або нової збірки.
Для інших збірних додайте запис із відповідним `flagCode`.

Додатково можна задати `shirtNumberColor` і `shirtNumberStrokeColor`.
Без них успадковуються тільки параметри номера HOME.
`shirtNumberStrokeColor: null` явно вимикає обведення.

Готовність до автоматичного порівняння перевіряється окремо від доступності
зображення. Зараз `de2.webp` доступна вручну, але не бере участі в турнірному
порівнянні через відсутність кольорів.

Метрика: відстань Oklab, вага основного кольору 0.75, додаткового 0.25,
окрема оцінка переставленої пари кольорів. Поріг і ваги — іменовані константи
в `src/game/tournamentKitSelection.ts`. Номери, акцентні кольори, назви команд
і зображення в оцінці не використовуються. Нових залежностей немає.

## Результати перевірок

- `npm run sync:kits`: 48 HOME, 1 AWAY.
- `npm test`: **1082 тести пройшли, 66 файлів тестів**.
- `npm run build`: успішно, включно з TypeScript.
- `npm run validate:kits`: успішно, 0 попереджень.
- `git diff --check`: без помилок.
- Кольорові рядки HOME й реєстр GK порівняні з HEAD і не змінені.
- Байти всіх перейменованих HOME, `none.webp`, `gk1.webp`, `gk2.webp`
  збігаються з оригінальними файлами в HEAD. Зображення не редагувалися.
- Експериментальний wiki-імпортер записує PNG в `public/kits/imported/`,
  окремо від runtime WebP; він не записував старі `<flagCode>.webp`, тому
  зміна його формату не потрібна. Масовий імпорт не запускався.
- Початкові сторонні видалення файлів, перейменування форм і `.vscode/`
  збережені. У `cardFace.test.ts` і `kitCardFaceModel.ts` внесені лише
  потрібні для комплектів правки; візуальні параметри не змінювалися.

## Обмеження перевірки

Browser не підключився через помилку середовища `missing field sandboxPolicy`.
Реальний візуальний прогін у браузері та на телефоні не виконаний.
Поведінка сцен і геометрія перемикачів для desktop/mobile landscape перевірені
автоматизованими тестами з підміною Phaser. Це не замінює огляд на пристрої.

Vite повідомляє про великий JS-файл збірки (>500 kB); збірка успішна.
Поріг конфлікту форм можна уточнювати під час ігрового тестування після
введення реальних кольорів AWAY.

## Змінені та додані файли

Нижче лише файли цієї реалізації; початкові видалення та додані зображення
власника не включені.

- `public/kits/README.md`
- `scripts/sync-kit-registry.ts`
- `scripts/validate-kits.ts`
- `src/data/generated/availableManualKitFlagCodes.ts`
- `src/data/teamKits.ts`
- `src/game/GameEngine.ts`
- `src/game/MatchTeamSetup.ts`
- `src/game/kitAssetResolver.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/ResultScene.ts`
- `src/scenes/TeamSelectScene.ts`
- `src/scenes/TournamentHubScene.ts`
- `src/scenes/TournamentPenaltyScene.ts`
- `src/scenes/bootKitAssets.ts`
- `src/tests/bootScene.test.ts`
- `src/tests/cardFace.test.ts`
- `src/tests/matchTeamSetup.test.ts`
- `src/tests/stage17.test.ts`
- `src/tests/teamKits.test.ts`
- `src/tests/teamSelect.test.ts`
- `src/tests/validateKits.test.ts`
- `src/ui/CardView.ts`
- `src/ui/FieldView.ts`
- `src/ui/kitCardFaceModel.ts`
- `src/game/tournamentKitSelection.ts`
- `src/tests/fieldKitVariants.test.ts`
- `docs/field-kit-variants.md`

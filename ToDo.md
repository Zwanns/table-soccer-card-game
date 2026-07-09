Task: Add random artwork to Post notification, unify artwork scaling, and expose Post preview in Dev Lab

Context
Project: Total Soccer: Mundial.
Work in main.

Goal
Розширити подію "Штанга" так, щоб окрім текстового notification "Post!" за ним показувалось випадкове зображення з двох доступних:
- public/menu/gk-post-1.webp
- public/menu/gk-post-2.webp

Також:
- усі зображення для подій Goal / Save / Post мають масштабуватися однаково
- для події Post треба зробити типографіку ближчою до Save notification: більший шрифт і той самий стиль побудови напису
- додати/оновити preview цієї події в Dev Lab

Important visual rules
- Усі event artworks для Goal / Save / Post мають вихідний розмір 1254x1254 px.
- Вони повинні рендеритися через єдиний scale contract, щоб візуальний розмір у грі був узгоджений між усіма трьома подіями.
- Не можна підбирати окремий довільний scale для Post, який ламатиме узгодженість із Goal і Save.
- Post notification має виглядати візуально “одного сімейства” із Save notification.

Scope
- BootScene asset preload
- shared notification/effect helpers
- random texture selection reuse
- Dev Lab preview
- tests

Requirements

1. Asset preload
- У BootScene додати preload для:
  - /menu/gk-post-1.webp
  - /menu/gk-post-2.webp
- Texture keys:
  - gk-post-1
  - gk-post-2

2. Random artwork for Post
- Для події Post щоразу випадково вибирати один доступний texture key з пулу:
  - gk-post-1
  - gk-post-2
- Перевикористати existing helper для випадкового вибору доступної texture, наприклад selectRandomAvailableTextureKey.
- Не дублювати окрему random-логіку.

3. Unified artwork scaling for Goal / Save / Post
- У shared UI/effect layer ввести спільний contract для event artwork size/scale.
- Goal notification artwork pool, Save artwork pool і новий Post artwork pool повинні використовувати один і той самий visual scale rule.
- Оскільки всі вихідні файли 1254x1254 px, масштабування має бути однаковим по базовому коефіцієнту або по спільній target-size логіці.
- Якщо зараз Goal і Save мають різні ad-hoc налаштування, акуратно уніфікувати їх без погіршення вигляду.
- Після змін Goal / Save / Post мають виглядати як один узгоджений набір notification-artworks.

4. Post typography
- Для події Post потрібно зробити шрифт як у події Save і трохи збільшити його.
- Це означає:
  - використовувати той самий font family / stroke / style family, що у Save
  - збільшити розмір шрифту відносно поточного Post
- Текст лишається:
  - Post!
- Не потрібно робити дворядковий напис, як у Goalkeeper SAVE, якщо це не потрібно для композиції.
- Але візуально стиль має бути близьким до Save notification, а сам текст — помітно більшим, ніж зараз.

5. Notification composition
- Поведінка має бути аналогічна Goal / Save:
  - image позаду text
  - text поверх image
  - shared container
  - ті самі pop/fade/cleanup principles
- Якщо відповідні textures недоступні, notification має коректно відпрацювати у text-only mode без crash.

6. Dev Lab
- Додати або оновити Post preview у Dev Lab так, щоб він використовував той самий shared renderer/effect helper, що й реальний GameScene.
- Не робити DevLab-only окремий renderer.
- Preview має показувати:
  - notification Post!
  - випадкове одне з двох зображень позаду
  - існуючу ball animation / outcome effect для Post preview, якщо вона вже є
- Dev Lab не повинен мутувати match state, score, storage або tournament state.

7. Do not change
- Не змінювати match flow, score/stat logic, tournament flow.
- Не змінювати ToDo.md.
- Не робити commit.

Implementation guidance
- Бажано зосередити зміни в shared helpers, де вже живуть Goal / Save / Post outcome notifications/effects.
- Якщо в коді вже є shared helper для Goal notification і окремий helper для shot outcomes, звести scale contract в одне місце, щоб уникнути розсинхрону.
- Якщо потрібно, додати невеликий utility/constants block для event artwork sizing.

Tests
Оновити/додати тести для:
- BootScene preload paths для gk-post-1 / gk-post-2
- random texture selection для Post artwork pool
- fallback text-only path, якщо textures недоступні
- shared Post notification container layering / cleanup
- Post notification typography contract:
  - використовує same style family as Save
  - font size збільшений відносно старого Post
- unified artwork scale contract:
  - Goal / Save / Post використовують той самий target size / scale rule
- Dev Lab preview використовує shared Post effect, а не окрему кастомну реалізацію
- deterministic randomness через injected random/stub, щоб тести не були flaky

Validation
Run:
- npm test
- npm run build
- git diff --check

Report
Звіт українською.
Вказати:
- які файли змінені
- як названі texture keys
- де зберігається shared artwork scale contract
- як уніфіковано scale для Goal / Save / Post
- чи Post typography приведена до стилю Save і збільшена
- чи Dev Lab і GameScene використовують спільну реалізацію
- результати npm test / npm run build / git diff --check

Do not commit.
# Fix GK shot source snapshot scale

## Ветка

Работать только в ветке:

```text
failed-move-ball-animation

До отдельного подтверждения пользователя:

НЕ делать git push
НЕ делать merge в main

ToDo.md не коммитить.

Проблема

После предыдущего исправления атакующая карта во время GK shot animation больше не исчезает.

Но появилась визуальная проблема:

атакующая source-карта после kick остается видимой,
но становится немного меньше исходной карты из колоды.

На скрине видно, что snapshot/source visual меньше, чем обычная карта в deck stack.

Цель

GK shot source snapshot должен быть того же размера, что и исходная карта из колоды.

Во время всей GK shot animation:

source snapshot не должен визуально уменьшаться после kick;
после kick должен возвращаться к исходному scale/display size;
до конца goal/save/post animation должен оставаться в нормальном размере.
Что проверить в коде

Найти логику создания и анимации GK shot source snapshot.

Вероятные места:

src/scenes/GameScene.ts
src/tests/gameScene.test.ts

Проверить:

1. как создается source snapshot;
2. какой scale/displaySize ему назначается;
3. какие значения scale используются в kick tween;
4. к каким значениям scale/rotation/x/y snapshot возвращается после kick;
5. не используются ли hardcoded scale вроде 0.95, 0.9 или deck/card base scale, не совпадающий с реальным CardView.
Требования

При создании GK shot source snapshot:

скопировать визуальные параметры реального source CardView:
- x
- y
- rotation
- scaleX
- scaleY
- displayWidth/displayHeight, если используется displaySize
- depth, если нужно

После kick animation:

snapshot должен вернуться к исходным:
- x
- y
- rotation
- scaleX
- scaleY

Не возвращать к hardcoded scale.

Если используется squash/stretch:

он должен быть относительным к originalScaleX/originalScaleY,
например:
scaleX = originalScaleX * 1.04
scaleY = originalScaleY * 0.97

а в конце:

scaleX = originalScaleX
scaleY = originalScaleY
Scope

Исправить только размер GK shot source snapshot.

Не менять:

source card visibility timing
GK shot outcome animations
goal/save/post rules
failed move source hiding
successful attack source hiding
jumping turn-ball singleton
GameEngine
AI
match rules
Тесты

Добавить/обновить тесты:

1. GK shot source snapshot copies source CardView scale.
2. GK shot source snapshot returns to original scale after kick.
3. squash/stretch is relative to original scale, not hardcoded.
4. snapshot remains visible until outcome completion.
5. snapshot is removed after outcome completion.

Если тесты source-based, добавить контракты на:

originalScaleX
originalScaleY
no hardcoded final scale
final tween returns to original source scale.
Проверки

Запустить:

npm run sync:kits
npm run validate:kits
npm run validate:covers
npm test
npm run build
Ручная проверка

Проверить локально:

1. Удар по GK:
   source-карта после kick остается того же размера, что и карта из колоды.

2. Goal:
   source snapshot не уменьшается до завершения animation.

3. Save:
   source snapshot не уменьшается до завершения animation.

4. Post:
   source snapshot не уменьшается до завершения animation.

5. После завершения:
   snapshot не зависает.
Commit

Перед commit:

git status

Не добавлять:

ToDo.md

Commit:

git add <relevant files only>
git commit -m "Preserve shot source card scale"

Не делать push.

Отчет

После выполнения вывести:

GK shot source snapshot scale fixed.

Changed files:
- ...

Problem:
- ...

Solution:
- ...

Scale handling:
- source scale:
- kick scale:
- final scale:

Unchanged:
- GameEngine:
- match rules:
- GK shot timing:
- source snapshot visibility:
- failed move:
- successful field attack:

Checks:
- npm run sync:kits:
- npm run validate:kits:
- npm run validate:covers:
- npm test:
- npm run build:

Git:
- commit:
- push: not performed
- ToDo.md not committed
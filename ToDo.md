# Этап 16 — финальная корректировка размера формы и отдельная GK-колода

## Цель
1. Немного уменьшить изображение экипировки на карте.
2. Внедрить отдельную колоду GK-карт.
3. Не менять уже работающий визуальный стиль карт.

---

## 1. Немного уменьшить форму на карте

### Что изменить
Обновить:
- `src/ui/kitCardFaceModel.ts`
- связанные тесты layout

### Новые стартовые размеры
Использовать:

```ts
export const KIT_CARD_LAYOUT = {
  kitWidth: 76,
  kitHeight: 88,

  kitAnchorX: 1,
  kitAnchorY: 1,

  kitOffsetRight: 7,
  kitOffsetBottom: 7,

  shirtNumberX: 0.5,
  shirtNumberY: 0.33,

  rankOffsetX: 7,
  rankOffsetY: 5,

  rankFontSize: 42,
  jokerRankFontSize: 23,

  rankColor: '#000000',

  cardCornerRadius: 8,
} as const;
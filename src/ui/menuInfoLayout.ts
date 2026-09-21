// Shared mobile geometry for About and Rules; desktop values are preserved.
export function getMenuInfoLayout(mobile: boolean) {
  return {
    viewport: mobile
      ? { x: -444, y: -150, width: 888, height: 434 }
      : { x: -390, y: -150, width: 780, height: 360 },
    paragraphFontSize: mobile ? '28px' : '20px',
    bodyFontSize: mobile ? '26px' : '16px',
    headingFontSize: mobile ? '28px' : '19px',
    rulesTitleFontSize: mobile ? '30px' : '22px',
    languageFontSize: mobile ? '30px' : '18px',
    languageStartX: mobile ? -94 : -62,
    languageStep: mobile ? 70 : 54
  };
}

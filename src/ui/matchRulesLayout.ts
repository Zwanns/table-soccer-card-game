/** Match Rules typography and geometry; desktop retains its existing values. */
export function getMatchRulesLayout(mobileLandscape: boolean) {
  return {
    modalWidth: mobileLandscape ? 1080 : 960,
    modalHeight: 600,
    viewport: mobileLandscape
      ? { x: -476, y: -150, width: 952, height: 360 }
      : { x: -390, y: -150, width: 780, height: 360 },
    titleFontSize: mobileLandscape ? '40px' : '34px',
    subtitleY: mobileLandscape ? -202 : -214,
    subtitleFontSize: mobileLandscape ? '24px' : '20px',
    rulesTitleFontSize: mobileLandscape ? '34px' : '22px',
    headingFontSize: mobileLandscape ? '32px' : '19px',
    bodyFontSize: mobileLandscape ? '28px' : '16px',
    lineSpacing: 8,
    headingGap: mobileLandscape ? 10 : 8,
    paragraphGap: mobileLandscape ? 10 : 6,
    sectionGap: mobileLandscape ? 18 : 12,
    textResolution: mobileLandscape ? 2 : 1,
    languageX: mobileLandscape ? 420 : 336,
    languageFontSize: mobileLandscape ? '28px' : '18px',
    languageStartX: mobileLandscape ? -80 : -62,
    languageStep: mobileLandscape ? 70 : 54,
    back: { y: 258, width: mobileLandscape ? 220 : 190, height: mobileLandscape ? 56 : 42,
      fontSize: mobileLandscape ? '28px' : '18px' }
  };
}

export type MatchRulesLayout = ReturnType<typeof getMatchRulesLayout>;

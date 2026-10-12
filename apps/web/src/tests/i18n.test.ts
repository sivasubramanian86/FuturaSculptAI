import { describe, expect, it } from 'vitest';
import { getTranslations, isRTL, SUPPORTED_LANGUAGES } from '../i18n';

describe('Internationalization (i18n) Engine', () => {
  it('returns complete English dictionary by default', () => {
    const enDict = getTranslations('en');
    expect(enDict.brandName).toBe('FuturaSculptAI');
    expect(enDict.navOverview).toBe('Overview');
    expect(enDict.pillarZeroLayoffTitle).toBe('Zero Layoff Protection');
  });

  it('translates to Tamil, Hindi, Spanish, and Japanese', () => {
    const taDict = getTranslations('ta');
    expect(taDict.navOverview).toBe('கண்ணோட்டம்');
    expect(taDict.pillarZeroLayoffTitle).toBe('பணிநீக்க எதிர்ப்பு பாதுகாப்பு');

    const hiDict = getTranslations('hi');
    expect(hiDict.navOverview).toBe('अवलोकन');
    expect(hiDict.pillarZeroLayoffTitle).toBe('शून्य छंटनी सुरक्षा');

    const esDict = getTranslations('es');
    expect(esDict.navOverview).toBe('Visión General');
    expect(esDict.pillarZeroLayoffTitle).toBe('Protección Contra Despidos');

    const jaDict = getTranslations('ja');
    expect(jaDict.navOverview).toBe('概要');
    expect(jaDict.pillarZeroLayoffTitle).toBe('解雇ゼロの保護原則');

    const teDict = getTranslations('te');
    expect(teDict.navOverview).toBe('అవలోకనం');
    expect(teDict.pillarZeroLayoffTitle).toBe('జీరో తొలగింపు రక్షణ');

    const mlDict = getTranslations('ml');
    expect(mlDict.navOverview).toBe('അവലോകനം');
    expect(mlDict.pillarZeroLayoffTitle).toBe('പിരിച്ചുവിടൽ രഹിത സുരക്ഷ');

    const knDict = getTranslations('kn');
    expect(knDict.navOverview).toBe('ಅವಲೋಕನ');
    expect(knDict.pillarZeroLayoffTitle).toBe('ಶೂನ್ಯ ಉದ್ಯೋಗ ಕಡಿತ ರಕ್ಷಣೆ');

    const frDict = getTranslations('fr');
    expect(frDict.navOverview).toBe("Vue d'Ensemble");
    expect(frDict.pillarZeroLayoffTitle).toBe('Protection Zéro Licenciement');

    const deDict = getTranslations('de');
    expect(deDict.navOverview).toBe('Übersicht');
    expect(deDict.pillarZeroLayoffTitle).toBe('Kündigungsschutz-Garantie');
  });

  it('falls back gracefully to English for unregistered languages', () => {
    const fallbackDict = getTranslations('xyz_unknown');
    expect(fallbackDict.brandName).toBe('FuturaSculptAI');
    expect(fallbackDict.navOverview).toBe('Overview');
  });

  it('detects RTL languages properly', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('en')).toBe(false);
    expect(isRTL('ta')).toBe(false);
  });

  it('exposes supported languages list with flags', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(10);
    const tamil = SUPPORTED_LANGUAGES.find((l) => l.code === 'ta');
    expect(tamil).toBeDefined();
    expect(tamil?.name).toContain('தமிழ்');
  });
});

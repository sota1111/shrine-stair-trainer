import { useI18n } from '../i18n/useI18n';

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        type="button"
        data-testid="lang-ja"
        className={`lang-toggle-btn ${lang === 'ja' ? 'active' : ''}`}
        aria-pressed={lang === 'ja'}
        onClick={() => setLang('ja')}
      >
        JP
      </button>
      <span className="lang-toggle-sep">|</span>
      <button
        type="button"
        data-testid="lang-en"
        className={`lang-toggle-btn ${lang === 'en' ? 'active' : ''}`}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        EN
      </button>
    </div>
  );
}

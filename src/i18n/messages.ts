export type Lang = 'ja' | 'en';

export const LANG_STORAGE_KEY = 'shrine.lang';
export const DEFAULT_LANG: Lang = 'ja';

// Flat key dictionary for the main UI shell + primary page headings/labels/buttons.
// Scope is intentionally focused on the always-visible navigation and the main
// headings/buttons of each page (per SOT-951 "主要UI文言").
const ja = {
  'app.title': '⛩️ 階段トレーニング',
  'nav.home': '🏠 ホーム',
  'nav.record': '📝 記録・計測',
  'nav.history': '📋 履歴',
  'nav.charts': '📊 グラフ',
  'nav.summary': '📈 サマリ',
  'nav.menu': '📅 メニュー',
  'nav.logout': 'ログアウト',

  'bottomNav.today': '今日',
  'bottomNav.record': '記録',
  'bottomNav.history': '履歴',
  'bottomNav.charts': 'グラフ',
  'bottomNav.summary': 'サマリ',
  'bottomNav.menu': 'メニュー',

  'home.todayStatus': '⛩️ 今日の状態',
  'home.startTimer': '⏱️ 計測開始',
  'home.recordInput': '📝 記録入力',
  'home.viewHistory': '📋 履歴を見る',
  'home.checkTodayMenu': '今日のメニューを確認',
  'home.summary': '📊 サマリー',

  'training.title': '📝 記録・計測',
  'training.timer': '⏱️ 計測',
  'training.manual': '📝 手入力',

  'history.title': '📋 記録履歴',
  'history.exportCsv': '📥 CSVエクスポート',

  'charts.title': '📊 トレーニング分析',

  'summary.title': '📈 サマリ・目標',

  'menu.title': '📅 週間トレーニングメニュー',

  'login.title': '🔐 ログイン',
  'login.email': 'メールアドレス',
  'login.password': 'パスワード',
  'login.submit': 'ログイン',
  'login.loggingIn': 'ログイン中...',
} as const;

export type MessageKey = keyof typeof ja;

const en: Record<MessageKey, string> = {
  'app.title': '⛩️ Stair Training',
  'nav.home': '🏠 Home',
  'nav.record': '📝 Record',
  'nav.history': '📋 History',
  'nav.charts': '📊 Charts',
  'nav.summary': '📈 Summary',
  'nav.menu': '📅 Menu',
  'nav.logout': 'Logout',

  'bottomNav.today': 'Today',
  'bottomNav.record': 'Record',
  'bottomNav.history': 'History',
  'bottomNav.charts': 'Charts',
  'bottomNav.summary': 'Summary',
  'bottomNav.menu': 'Menu',

  'home.todayStatus': "⛩️ Today's Status",
  'home.startTimer': '⏱️ Start Timer',
  'home.recordInput': '📝 Record Entry',
  'home.viewHistory': '📋 View History',
  'home.checkTodayMenu': "Check today's menu",
  'home.summary': '📊 Summary',

  'training.title': '📝 Record & Measure',
  'training.timer': '⏱️ Timer',
  'training.manual': '📝 Manual',

  'history.title': '📋 Record History',
  'history.exportCsv': '📥 Export CSV',

  'charts.title': '📊 Training Analysis',

  'summary.title': '📈 Summary & Goals',

  'menu.title': '📅 Weekly Training Menu',

  'login.title': '🔐 Login',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Log in',
  'login.loggingIn': 'Logging in...',
};

export const messages: Record<Lang, Record<MessageKey, string>> = { ja, en };

export type Lang = 'ja' | 'en';

export interface Translations {
  navAbout: string;
  navEvents: string;
  navFaq: string;
  navApply: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitleLine1: string;
  heroSubtitleLine2: string;
  ctaEvents: string;
  ctaAbout: string;
  aboutTitle: string;
  flowTitle: string;
  aboutBody: string;
  eventsTitle: string;
  eventsBody: string;
  capacityLabel: string;
  peopleSuffix: string;
  remainingLabel: string;
  checkinLabel: string;
  meetOnsiteValue: string;
  meetShuttleValue: string;
  applyTitle: string;
  applyBody: string;
  successTitle: string;
  successBody: string;
  labelEvent: string;
  selectPlaceholder: string;
  labelName: string;
  placeholderName: string;
  labelEmail: string;
  labelCountry: string;
  labelPhone: string;
  placeholderPhone: string;
  phoneHint: string;
  labelEmergencyName: string;
  placeholderEmergencyName: string;
  labelEmergencyRelation: string;
  placeholderEmergencyRelation: string;
  labelEmergencyPhone: string;
  labelMessage: string;
  placeholderMessage: string;
  paymentAmountLabel: string;
  paymentInfoLabel: string;
  labelCard: string;
  labelExpiry: string;
  labelCvc: string;
  submitLabel: string;
  submitNote: string;
  faqTitle: string;
  footerOrganizer: string;
  footerContact: string;
  footerCopyright: string;
}

export const TRANSLATIONS: Record<Lang, Translations> = {
  ja: {
    navAbout: '魅力',
    navEvents: 'イベント',
    navFaq: 'FAQ',
    navApply: '申し込む',
    heroTitleLine1: '通知を手放す',
    heroTitleLine2: '数日間の余白へ',
    heroSubtitleLine1: 'スマホを木箱に封印し、日常から離れて過ごす場所。',
    heroSubtitleLine2: '写真と手紙を、6ヶ月後の自分へ届けます。',
    ctaEvents: '開催予定を見る',
    ctaAbout: 'Signalの魅力',
    aboutTitle: '画面の外に、本当の時間がある',
    flowTitle: '体験の流れ',
    aboutBody:
      '通知が鳴らない場所で、自分の考えに戻る。Signal. は、日本を旅する合間に、その土地ならではの文化にふれながら過ごす小さな旅を届けています。',
    eventsTitle: '開催予定のリトリート',
    eventsBody: '気になる回を選ぶと、そのまま申し込みフォームにご案内します。',
    capacityLabel: '定員',
    peopleSuffix: '名',
    remainingLabel: '残り',
    checkinLabel: '集合時間',
    meetOnsiteValue: '現地',
    meetShuttleValue: '送迎ポイント',
    applyTitle: '申し込みフォーム',
    applyBody: '下記フォームに必要事項をご入力ください。',
    successTitle: 'お申し込みありがとうございます',
    successBody: '確認メールを送信しました。当日を楽しみにお待ちしております。',
    labelEvent: '参加希望の回 *',
    selectPlaceholder: '選択してください',
    labelName: 'お名前 *',
    placeholderName: '山田 太郎',
    labelEmail: 'メールアドレス *',
    labelCountry: 'お住まいの国 *',
    labelPhone: '電話番号 *',
    placeholderPhone: '090-1234-5678',
    phoneHint:
      '国内の電話番号はそのままでOKです(海外からのお申し込みの場合のみ、+81などの国番号を含めてください)',
    labelEmergencyName: '緊急連絡先のお名前(職場・家族など) *',
    placeholderEmergencyName: '山田 花子',
    labelEmergencyRelation: '続柄 *',
    placeholderEmergencyRelation: '例: 配偶者、上司',
    labelEmergencyPhone: '緊急連絡先の電話番号 *',
    labelMessage: 'ご要望・ご質問(任意)',
    placeholderMessage: 'アレルギーやご質問など',
    paymentAmountLabel: 'お支払い金額',
    paymentInfoLabel: 'お支払い情報',
    labelCard: 'カード番号 *',
    labelExpiry: '有効期限 *',
    labelCvc: 'セキュリティコード *',
    submitLabel: '支払いして申し込む',
    submitNote: '安全な決済ページで処理されます',
    faqTitle: 'よくある質問',
    footerOrganizer: '主催: Signal. 運営事務局',
    footerContact: 'お問い合わせ: info@signal-retreat.jp',
    footerCopyright: '© 2026 Signal. All rights reserved.',
  },
  en: {
    navAbout: 'About',
    navEvents: 'Retreats',
    navFaq: 'FAQ',
    navApply: 'Apply',
    heroTitleLine1: 'Let go of notifications,',
    heroTitleLine2: 'and step into open days.',
    heroSubtitleLine1: 'Seal your phone away, and step outside daily life.',
    heroSubtitleLine2: 'Photos and a letter, delivered to your future self in six months.',
    ctaEvents: 'View upcoming retreats',
    ctaAbout: 'About Signal.',
    aboutTitle: 'Real time exists outside the screen',
    flowTitle: 'Your Journey',
    aboutBody:
      'Return to your own thoughts, somewhere free of notifications. Signal. offers a small journey woven into your trip to Japan — time to experience the culture of each place.',
    eventsTitle: 'Upcoming Retreats',
    eventsBody: "Choose a session and we'll take you straight to the application form.",
    capacityLabel: 'Capacity',
    peopleSuffix: '',
    remainingLabel: 'Remaining ',
    checkinLabel: 'Check-in',
    meetOnsiteValue: 'On-site',
    meetShuttleValue: 'Shuttle point',
    applyTitle: 'Application Form',
    applyBody: 'Please fill in the details below.',
    successTitle: 'Thank you for your application',
    successBody: 'A confirmation email has been sent. We look forward to seeing you.',
    labelEvent: 'Session *',
    selectPlaceholder: 'Please select',
    labelName: 'Name *',
    placeholderName: 'Jane Smith',
    labelEmail: 'Email address *',
    labelCountry: 'Country of residence *',
    labelPhone: 'Phone number *',
    placeholderPhone: '+1 555 123 4567',
    phoneHint: 'Please include your country code (e.g. +1, +44)',
    labelEmergencyName: 'Emergency contact name (workplace or family) *',
    placeholderEmergencyName: 'Jane Smith',
    labelEmergencyRelation: 'Relationship *',
    placeholderEmergencyRelation: 'e.g. spouse, manager',
    labelEmergencyPhone: 'Emergency contact phone number *',
    labelMessage: 'Requests or questions (optional)',
    placeholderMessage: 'Allergies, questions, etc.',
    paymentAmountLabel: 'Amount due',
    paymentInfoLabel: 'Payment information',
    labelCard: 'Card number *',
    labelExpiry: 'Expiry date *',
    labelCvc: 'Security code *',
    submitLabel: 'Pay and apply',
    submitNote: 'Processed on a secure payment page',
    faqTitle: 'Frequently Asked Questions',
    footerOrganizer: 'Organized by: Signal. Secretariat',
    footerContact: 'Contact: info@signal-retreat.jp',
    footerCopyright: '© 2026 Signal. All rights reserved.',
  },
};

export const COUNTRY_OPTIONS = [
  '日本 / Japan',
  'アメリカ / United States',
  'イギリス / United Kingdom',
  'カナダ / Canada',
  'オーストラリア / Australia',
  'フランス / France',
  'ドイツ / Germany',
  '台湾 / Taiwan',
  '韓国 / South Korea',
  '中国 / China',
  'シンガポール / Singapore',
  'その他 / Other',
];

import type { Lang } from '../i18n/translations';

interface FeatureCopy {
  title: string;
  body: string;
}

interface FeatureRaw {
  num: string;
  ja: FeatureCopy;
  en: FeatureCopy;
}

const FEATURES: FeatureRaw[] = [
  {
    num: '01',
    ja: {
      title: '通知のない時間',
      body: 'スマホは木箱に入れて自分で封印シールを貼り、自己管理。画面の外にある自分だけの時間を取り戻します。',
    },
    en: {
      title: 'No notifications',
      body: 'Seal your own phone in the wooden box with the seal sticker — self-managed. Reclaim time outside the screen, just for yourself.',
    },
  },
  {
    num: '02',
    ja: {
      title: '自分のペースで',
      body: '過ごし方は自由。何もしないもよし、自分で写経や散策をするもよし。',
    },
    en: {
      title: 'At your own pace',
      body: 'How you spend your time is entirely up to you — do nothing, or try sutra-copying or a walk on your own.',
    },
  },
  {
    num: '03',
    ja: {
      title: '日本文化との出会い',
      body: '寺院での写経、季節の移ろいを感じる自然。その土地ならではの文化に、自分のペースでふれてみる。',
    },
    en: {
      title: 'Encounters with Japanese culture',
      body: "Sutra-copying at a temple, or the season's changing nature — a chance to meet each place's culture, at your own pace.",
    },
  },
];

export interface Feature {
  num: string;
  title: string;
  body: string;
}

export function getFeatures(lang: Lang): Feature[] {
  return FEATURES.map((f) => ({ num: f.num, title: f[lang].title, body: f[lang].body }));
}

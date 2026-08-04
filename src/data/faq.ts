import type { Lang } from '../i18n/translations';

interface FaqCopy {
  q: string;
  a: string;
}

interface FaqRaw {
  ja: FaqCopy;
  en: FaqCopy;
}

const FAQ_DATA: FaqRaw[] = [
  {
    ja: {
      q: '開催場所への行き方は?',
      a: '正確な所在地や最寄り駅からのアクセス、送迎場所の詳細は、お申し込み後のご案内メールでお知らせします。',
    },
    en: {
      q: 'How do we get to the venue?',
      a: 'The exact address, directions from the nearest station, and shuttle pickup details are sent in the confirmation email after you apply.',
    },
  },
  {
    ja: { q: '手紙と写真はいつ届きますか?', a: '現像した写真と手紙を、当日から6ヶ月後にご自宅へお届けします。' },
    en: {
      q: 'When will the letter and photos arrive?',
      a: 'Your developed photos and letter will be delivered to your home six months after the event.',
    },
  },
  {
    ja: {
      q: '使い捨てカメラの現像はどうなりますか?',
      a: '回収したカメラは事務局で現像し、手紙と一緒に梱包してお送りします。',
    },
    en: {
      q: 'What happens to the disposable camera?',
      a: 'We develop the collected film at our office and send the prints together with your letter.',
    },
  },
  {
    ja: {
      q: 'スマホは完全に使えなくなりますか?',
      a: '基本は到着後、木箱からキットを取り出したら、ご自身のスマホやApple Watchを木箱に入れ、封印シールで封をして自己管理いただきます。ご希望があれば施設側でお預かりすることも可能です。',
    },
    en: {
      q: 'Will my phone be completely unusable?',
      a: "Normally, after taking the kit out of the box on arrival, you place your own phone or Apple Watch inside and seal it yourself. If you'd prefer, the venue can also hold it for you.",
    },
  },
  {
    ja: {
      q: '緊急時の連絡はどうすればいいですか?',
      a: 'お申し込みフォームでご記入いただいた緊急連絡先(ご家族や職場など)には、緊急時に限り主催者からご連絡することがあります。また、主催者側の緊急連絡先も、事前の案内メールでお伝えします。',
    },
    en: {
      q: 'What about emergency contact?',
      a: 'The emergency contact you provide in the application form (family or workplace) will only be reached by the organizer in a genuine emergency. Our own emergency contact number is also sent in the pre-event email.',
    },
  },
  {
    ja: {
      q: '木箱はもらえますか?',
      a: '木箱は会場でお使いいただくものです。終了時には手紙(封筒入り)とカメラを木箱に入れてご返却いただきます。木箱自体のお持ち帰りはできません。',
    },
    en: {
      q: 'Do we get to keep the wooden box?',
      a: 'The box is for use on-site only. At the end, place your letter (in its envelope) and camera back inside for collection — the box itself cannot be taken home.',
    },
  },
  {
    ja: {
      q: '一人での参加でも大丈夫ですか?',
      a: 'はい、多くの方が一人でご参加されています。一人でゆったり過ごす方もいれば、現地の方や他のSignal.参加者と仲良くなって過ごす方も。どちらの過ごし方も自由です。',
    },
    en: {
      q: 'Is it okay to attend alone?',
      a: 'Yes, most participants come alone. Some spend the time quietly by themselves, while others get to know locals or fellow Signal. participants — either way is entirely up to you.',
    },
  },
  {
    ja: { q: '日本語が話せなくても参加できますか?', a: 'はい、大丈夫です。案内資料は日英併記でご用意しています。' },
    en: {
      q: "What if I don't speak Japanese?",
      a: 'That’s no problem. Materials are provided in both Japanese and English.',
    },
  },
  {
    ja: {
      q: '食事は含まれますか?',
      a: '日帰りプランは軽食のみ、宿泊プランは全食事付きです。ただし食事は自由参加で、外で好きなものを食べていただいても構いません。アレルギーは備考欄にご記入ください。',
    },
    en: {
      q: 'Is food included?',
      a: 'Day-trip plans include a light snack only; overnight plans include all meals. Meals are optional, though — feel free to eat out on your own instead. Please note any allergies in the message field.',
    },
  },
  {
    ja: {
      q: 'キャンセルポリシーは?',
      a: '開催7日前まで:全額返金 / 開催3日前まで:50%返金 / 開催3日前を過ぎてからのキャンセル:返金なし(100%)となります。',
    },
    en: {
      q: 'What is the cancellation policy?',
      a: 'Full refund up to 7 days before the event, 50% refund up to 3 days before, and no refund (100%) after that.',
    },
  },
];

export interface FaqItemData {
  question: string;
  answer: string;
}

export function getFaqItems(lang: Lang): FaqItemData[] {
  return FAQ_DATA.map((f) => ({ question: f[lang].q, answer: f[lang].a }));
}

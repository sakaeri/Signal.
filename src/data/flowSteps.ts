import type { Lang } from '../i18n/translations';
import flowImage0 from '../assets/images/flow-image-0.png';
import flowImage1 from '../assets/images/flow-image-1.png';
import flowImage2 from '../assets/images/flow-image-2.png';
import flowImage3 from '../assets/images/flow-image-3.png';
import flowImage4 from '../assets/images/flow-image-4.png';

interface FlowStepRaw {
  num: string;
  jaEyebrow: string;
  enEyebrow: string;
  image: string;
  ja: string;
  en: string;
}

const FLOW_STEPS: FlowStepRaw[] = [
  {
    num: '01',
    jaEyebrow: '到着',
    enEyebrow: 'Arrival',
    image: flowImage0,
    ja: '会場に到着。\n\n木箱にスマートフォンを入れ、\n自分の手で封印シールを貼ります。',
    en: 'Arrive at the venue.\n\nPlace your phone in the wooden box,\nand seal it yourself with the sticker.',
  },
  {
    num: '02',
    jaEyebrow: '手放す',
    enEyebrow: 'Disconnect',
    image: flowImage1,
    ja: '通知のない時間が始まります。\n\n決まった予定はありません。\n\n連絡も、締め切りも、\nここには届きません。\n\n誰にも邪魔されない、自分だけの時間を過ごします。',
    en: "Your notification-free time begins.\n\nThere's no set schedule.\n\nNo messages, no deadlines\ncan reach you here.\n\nJust time that's entirely your own, undisturbed by anyone.",
  },
  {
    num: '03',
    jaEyebrow: '好きなように',
    enEyebrow: 'As You Wish',
    image: flowImage2,
    ja: 'Signal Kitとともに数日間を過ごします。\n\nノートを書いたり、\n写真を撮ったり、\n温泉に浸かったり、\n散策に出かけたり、\n何もしなかったり。',
    en: 'Spend a few days with your Signal Kit.\n\nWrite in your notebook,\ntake photographs,\nsoak in a hot spring,\ngo for a walk,\nor do nothing at all.',
  },
  {
    num: '04',
    jaEyebrow: '手紙を書く',
    enEyebrow: 'Write a Letter',
    image: flowImage3,
    ja: '最終日。\n\n未来の自分へ手紙を書きます。\n\nカメラで撮った写真とその手紙は、\n半年後にあなたのもとへ届きます。',
    en: 'The final day.\n\nWrite a letter to your future self.\n\nThe letter, along with the photos\nyou took, will reach you\nsix months from now.',
  },
  {
    num: '05',
    jaEyebrow: '帰還',
    enEyebrow: 'Return',
    image: flowImage4,
    ja: '木箱を開け、\nスマートフォンを手に取ります。\n\n通知は変わっていません。\n\nでも、\nあなたの時間の感じ方は少し変わっているかもしれません。',
    en: "Open the box,\nand pick up your phone.\n\nThe notifications haven't changed.\n\nBut maybe —\nthe way you feel time has.",
  },
];

export interface FlowStep {
  num: string;
  eyebrow: string;
  body: string;
  image: string;
  hasNext: boolean;
}

export function getFlowSteps(lang: Lang): FlowStep[] {
  return FLOW_STEPS.map((fs, i) => ({
    num: fs.num,
    eyebrow: lang === 'ja' ? fs.jaEyebrow : fs.enEyebrow,
    body: fs[lang],
    image: fs.image,
    hasNext: i < FLOW_STEPS.length - 1,
  }));
}

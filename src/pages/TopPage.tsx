// path: src/pages/TopPage.tsx
// トップページ：集客・配送相談・協力ドライバー募集の振り分けを最優先にした構成
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Truck,
  UserPlus
} from 'lucide-react';
import type { ViewState } from '../types';
import {
  SITE_NAME,
  LINE_FRIEND_ADD_URL,
  LINE_QR_URL,
  LINE_ACCOUNT_NAME,
  HERO_BG_URL,
  LOGO_IMAGE_URL
} from '../constants';

type SetView = (view: ViewState) => void;

type PrimaryRoute = {
  title: string;
  desc: string;
  badge: string;
  cta: string;
  icon: typeof Truck;
  borderClass: string;
  buttonClass: string;
  onClick: ViewState;
};

const primaryRoutes: PrimaryRoute[] = [
  {
    title: '配送を依頼したい',
    desc: '見積依頼・配送相談・正式依頼はこちら。荷物内容と距離の確認から進めます。',
    badge: '荷主さま向け',
    cta: '配送相談・見積フォームへ',
    icon: Truck,
    borderClass: 'hover:border-[#52a285]',
    buttonClass: 'bg-[#52a285] group-hover:bg-[#3d7a64]',
    onClick: 'simulator'
  },
  {
    title: '協力ドライバーとして働きたい',
    desc: '軽貨物の協力ドライバー募集はこちら。未経験でも現在の状況に合わせて確認します。',
    badge: '配送パートナー募集',
    cta: '協力ドライバー登録へ',
    icon: UserPlus,
    borderClass: 'hover:border-slate-800',
    buttonClass: 'bg-slate-800 group-hover:bg-slate-900',
    onClick: 'register'
  },
  {
    title: '黒ナンバー・開業前を相談したい',
    desc: '黒ナンバー未取得、書類準備中、車両の相談がある方はこちら。相談だけでも進められます。',
    badge: '開業前でもOK',
    cta: '開業前・黒ナンバー相談へ',
    icon: HelpCircle,
    borderClass: 'hover:border-[#52a285]',
    buttonClass: 'bg-emerald-600 group-hover:bg-emerald-700',
    onClick: 'pre-open'
  }
];

const proofItems = [
  '下関市中心の軽貨物相談窓口',
  '配送相談と協力ドライバー募集を同時に案内可能',
  '黒ナンバー未取得・開業前・書類準備中でも相談可能',
  'LINEは補助導線、正式受付はフォームで記録'
];

export function TopPage({ setView }: { setView: SetView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 md:space-y-12"
    >
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl">
        <div className="absolute inset-0">
          <img
            src={HERO_BG_URL}
            alt="関門海峡と軽貨物TAKEのヒーロー画像"
            className="h-full w-full object-cover"
            style={{ objectPosition: '78% center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/96 via-white/88 to-white/28" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-white/10" />
        </div>

        <div className="relative z-10 px-6 py-8 md:px-12 md:py-12">
          <div className="max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-black text-[#3d7a64] shadow-sm backdrop-blur-sm">
                <MapPin size={14} /> 山口県下関市中心
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                荷主・配送パートナー・開業前の相談を受付
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/90 bg-white shadow-md">
                <img src={LOGO_IMAGE_URL} alt={`${SITE_NAME} ロゴ`} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black tracking-[0.24em] text-slate-500">SHIMONOSEKI TRANSPORT</p>
                <p className="text-sm font-bold text-slate-700">配送相談・見積依頼・協力ドライバー募集・黒ナンバー相談の窓口</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-slate-900 md:text-6xl">
                下関で軽貨物を
                <span className="block">頼みたい方も、</span>
                <span className="block">走りたい方も。</span>
              </h1>
              <p className="max-w-2xl text-base font-medium leading-relaxed text-slate-700 md:text-xl">
                配送依頼、協力ドライバー募集、黒ナンバー・開業前相談を1つの窓口で整理します。
                最初に自分に合う入口を選ぶだけで進められます。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {proofItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/80 bg-white/78 p-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black tracking-[0.18em] text-slate-500">STEP 1</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">あなたはどちらですか？</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">
                    まず下の3つから選んでください。荷主さま向け、配送パートナー募集、開業前相談を分けてあります。
                  </p>
                </div>
                <a
                  href={LINE_FRIEND_ADD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#06C755]/20 bg-[#06C755] px-5 py-3 text-sm font-black text-white hover:bg-[#05b34c]"
                >
                  <MessageCircle size={18} />
                  迷う方はLINEで相談
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {primaryRoutes.map((route) => {
          const Icon = route.icon;
          return (
            <button
              key={route.title}
              type="button"
              onClick={() => setView(route.onClick)}
              className={`group rounded-[2rem] border-2 border-transparent bg-white p-7 text-left shadow-sm transition-all ${route.borderClass}`}
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-800 transition-transform group-hover:scale-105">
                <Icon size={32} />
              </div>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600">
                {route.badge}
              </span>
              <h3 className="mt-4 text-2xl font-black leading-tight text-slate-900">{route.title}</h3>
              <p className="mt-3 min-h-[72px] text-sm leading-relaxed text-slate-600">{route.desc}</p>
              <div className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white transition-colors ${route.buttonClass}`}>
                {route.cta}
                <ArrowRight size={18} />
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f0ec] text-[#52a285]">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-slate-500">FOR SHIPPERS</p>
              <h2 className="text-2xl font-black text-slate-900">配送相談・見積依頼を集める導線</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              '下関市中心の軽貨物配送を相談できる',
              '見積依頼から正式依頼まで同じ流れで進められる',
              '荷物内容・距離・希望日時をまとめて送れる',
              'LINEに逃がさずフォーム受付へつなげやすい'
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-5">
            <p className="text-sm font-black text-emerald-700">こんな方に向いています</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              急ぎの配送がある方、まず概算を知りたい方、定期配送やスポット配送を相談したい方。
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setView('simulator')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#52a285] px-6 py-4 text-sm font-black text-white hover:bg-[#3d7a64]"
            >
              <Truck size={18} />
              配送相談・見積フォームへ
            </button>
            <a
              href={LINE_FRIEND_ADD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 hover:border-[#52a285] hover:text-[#3d7a64]"
            >
              <MessageCircle size={18} />
              迷う方はLINEで補助相談
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <UserPlus size={24} />
            </div>
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-slate-500">FOR DRIVERS</p>
              <h2 className="text-2xl font-black text-slate-900">協力ドライバーを集める導線</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              '未経験でも現在の状況を見て案内',
              '黒ナンバー未取得・開業前でも相談できる',
              '必要書類をまとめて登録できる',
              'サイト上で個人名簿を公開しない'
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start gap-2 text-sm font-bold text-slate-700">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-slate-700" />
                  <span>{item}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-slate-700">登録前に不安になりやすい点</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>・まだ黒ナンバーがない</li>
              <li>・書類が全部そろっていない</li>
              <li>・車両の購入や修理も相談したい</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">この状態でも、まず状況確認から進められる導線にしてあります。</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setView('register')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-6 py-4 text-sm font-black text-white hover:bg-slate-900"
            >
              <UserPlus size={18} />
              協力ドライバー登録へ
            </button>
            <button
              type="button"
              onClick={() => setView('pre-open')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 hover:border-slate-800 hover:text-slate-900"
            >
              <HelpCircle size={18} />
              開業前・黒ナンバー相談へ
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
              サブ導線
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600">
              軽バン購入 / 修理・整備 / 車検
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black text-slate-900">軽バン車両相談もまとめて受け付けます</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            車両購入、修理整備、車検の相談も受け付けています。配送相談や協力ドライバー登録の途中で車両面の不安がある方は、ここから切り分けできます。
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setView('vehicle')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 hover:border-[#52a285] hover:text-[#3d7a64]"
            >
              <FileText size={18} />
              軽バン車両の相談ページへ
            </button>
            <button
              type="button"
              onClick={() => setView('pre-open')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white hover:bg-emerald-700"
            >
              <HelpCircle size={18} />
              開業前の相談ページへ
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-black tracking-[0.18em] text-slate-500">LINEで補助相談</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">迷う方はLINEからでもOK</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            スマホは友だち追加ボタン、PCはQRコードから追加できます。正式な受付記録はフォーム送信が正本です。
          </p>
          <img
            src={LINE_QR_URL}
            alt={`${LINE_ACCOUNT_NAME} QRコード`}
            className="mx-auto mt-6 w-full max-w-[190px] rounded-2xl border border-slate-200 bg-white"
          />
          <a
            href={LINE_FRIEND_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#06C755] px-5 py-4 text-sm font-black text-white hover:bg-[#05b34c]"
          >
            <MessageCircle size={18} />
            友だち追加はこちら
          </a>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-slate-500">AREA / FLOW / FAQ</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">迷わず送れるように、必要情報を整理</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              下関市を中心に、長府・新下関・彦島・菊川・豊浦などの周辺エリアも内容に応じて相談できます。
              まずフォーム送信、その後必要に応じて確認連絡という流れです。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: '1. 内容を送る',
                desc: '配送相談・ドライバー登録・黒ナンバー相談のいずれかを送信します。'
              },
              {
                title: '2. 必要事項を確認',
                desc: '入力内容を見て、追加で確認が必要な場合のみ連絡します。'
              },
              {
                title: '3. 条件をすり合わせ',
                desc: '荷主さまには見積や配送案内、ドライバーには登録案内へ進みます。'
              },
              {
                title: '4. 次の手続きへ',
                desc: '条件が合えば正式依頼、協力ドライバー登録、開業前の具体案内へ進みます。'
              }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-black text-slate-800">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              q: '配送相談はどこまで対応していますか？',
              a: '下関市中心の軽貨物配送相談に対応しています。まずは見積フォームからご相談ください。'
            },
            {
              q: '協力ドライバー募集は未経験でも応募できますか？',
              a: '未経験でも応募可能です。現在の状況を確認し、条件に応じて登録案内を行います。'
            },
            {
              q: '黒ナンバー未取得でも相談できますか？',
              a: '可能です。黒ナンバー相談や軽貨物開業相談として、開業前の段階から受け付けています。'
            }
          ].map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-black text-slate-900">{item.q}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
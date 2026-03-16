// トップページ：ヒーロー・配送相談・ドライバー登録・開業前導線・車両相談
import { motion } from 'motion/react';
import { CheckCircle2, MapPin, Truck, UserPlus, HelpCircle } from 'lucide-react';
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

export function TopPage({ setView }: { setView: SetView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16"
    >
      {/* ヒーロー */}
      <div className="relative overflow-hidden rounded-[3rem] min-h-[640px] md:min-h-[720px] shadow-xl border border-slate-100">
        <div className="absolute inset-0">
          <img
            src={HERO_BG_URL}
            alt="関門海峡と軽貨物TAKEのヒーロー画像"
            className="w-full h-full object-cover"
            style={{ objectPosition: '78% center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/94 via-white/72 to-white/18" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-white/10" />
        </div>
        <div className="relative z-10 flex min-h-[640px] md:min-h-[720px] items-center">
          <div className="w-full px-6 py-10 md:px-14 md:py-14">
            <div className="max-w-2xl space-y-7">
              <div className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-sm text-[#3d7a64] px-4 py-2 rounded-full text-xs font-black border border-white/80 shadow-sm">
                <MapPin size={14} /> 山口県下関市中心
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-white/90 bg-white shadow-md shrink-0">
                  <img src={LOGO_IMAGE_URL} alt={`${SITE_NAME} ロゴ`} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-black tracking-[0.24em] text-slate-500">SHIMONOSEKI TRANSPORT</p>
                  <p className="text-sm font-bold text-slate-700">軽貨物配送相談・協力ドライバー募集・黒ナンバー相談の窓口</p>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] drop-shadow-sm">
                <span className="block">下関の軽貨物相談。</span>
                <span className="block">協力ドライバー募集と</span>
                <span className="block">黒ナンバー相談に対応。</span>
              </h1>
              <p className="text-base md:text-xl text-slate-700 max-w-xl leading-relaxed font-medium">
                {SITE_NAME}は、下関市中心の軽貨物配送相談と協力ドライバー募集の窓口です。
                <br className="hidden md:block" />
                黒ナンバー未取得・開業前・書類準備中の方や、軽バン車両相談にも対応しています。
              </p>
              <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
                {[
                  { title: '審査済みドライバー在籍', desc: '書類確認済み。案件ごとにご案内します。' },
                  { title: '公開名簿なし', desc: '登録してもサイトで個人を一覧公開しません。' },
                  { title: 'LINEでも補助相談可', desc: '受付の正本はフォーム送信です。' }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="bg-white/78 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-800 text-sm leading-tight">{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setView('simulator')}
                  className="bg-[#52a285] text-white px-10 py-5 rounded-2xl font-black text-lg md:text-xl hover:bg-[#3d7a64] transition-all shadow-lg shadow-emerald-100 flex items-center gap-3 group w-full sm:w-auto justify-center"
                >
                  <Truck size={24} className="group-hover:scale-110 transition-transform" />
                  配送相談・見積フォームへ進む
                </button>
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="bg-slate-800 text-white px-10 py-5 rounded-2xl font-black text-lg md:text-xl hover:bg-slate-900 transition-all shadow-lg flex items-center gap-3 group w-full sm:w-auto justify-center"
                >
                  <UserPlus size={24} className="group-hover:scale-110 transition-transform" />
                  協力ドライバー登録フォームへ進む
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* お客様向け・ドライバー向けカード */}
      <div className="grid md:grid-cols-2 gap-6">
        <button
          type="button"
          className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border-2 border-transparent hover:border-[#52a285] transition-all text-left group"
          onClick={() => setView('simulator')}
        >
          <div className="w-16 h-16 bg-[#e6f0ec] rounded-2xl flex items-center justify-center text-[#52a285] mb-6 group-hover:scale-110 transition-transform">
            <Truck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">下関の軽貨物配送を相談したい方へ</h2>
          <p className="text-slate-600 mb-8">配送相談・見積依頼・正式依頼へ、このまま進めます。</p>
          <div className="bg-[#52a285] text-white px-6 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 group-hover:bg-[#3d7a64] transition-colors">
            軽貨物の配送相談・見積依頼へ進む
          </div>
        </button>
        <button
          type="button"
          className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border-2 border-transparent hover:border-slate-800 transition-all text-left group"
          onClick={() => setView('register')}
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 mb-6 group-hover:scale-110 transition-transform">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">協力ドライバー募集に応募したい方へ</h2>
          <p className="text-slate-600 mb-8">協力ドライバー登録フォームへ、このまま進めます。</p>
          <div className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 group-hover:bg-slate-900 transition-colors">
            協力ドライバー登録フォームへ進む
          </div>
        </button>
      </div>

      {/* 開業前・黒ナンバー未取得・書類がまだの方 */}
      <button
        type="button"
        className="w-full bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border-2 border-transparent hover:border-[#52a285] transition-all text-left group"
        onClick={() => setView('pre-open')}
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#e6f0ec] text-[#52a285] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <HelpCircle size={28} />
          </div>
          <div className="min-w-0">
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold border border-slate-200">
              開業前・書類がまだの方
            </span>
            <h2 className="text-xl font-bold text-slate-800 mt-3 mb-1">黒ナンバー未取得・開業前でも相談できます</h2>
            <p className="text-slate-600 text-sm">
              登録前でも相談だけでOK。黒ナンバー取得の流れ、開業届や必要書類、軽バン車両相談までまとめて受け付けています。
            </p>
            <span className="inline-block mt-3 text-[#52a285] font-bold text-sm group-hover:underline">
              黒ナンバー・開業前の相談ページへ →
            </span>
          </div>
        </div>
      </button>

      {/* 車両の相談 + LINE */}
      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-amber-50 text-amber-700 text-xs px-3 py-1 rounded-full font-bold border border-amber-100">
              サブ導線
            </span>
            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full font-bold border border-slate-200">
              車両購入 / 修理・整備 / 車検
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">軽バン車両の相談</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            車両購入・修理整備・車検の相談も受けています。配送相談と協力ドライバー募集が主軸ですが、
            軽貨物向けの車両相談もまとめて進めたい方向けの導線です。
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setView('vehicle')}
              className="bg-white border border-slate-200 text-slate-800 px-6 py-4 rounded-2xl font-bold hover:border-[#52a285] hover:text-[#3d7a64] transition-colors"
            >
              軽バン車両の相談ページへ
            </button>
            <a
              href={LINE_FRIEND_ADD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#06C755] text-white px-6 py-4 rounded-2xl font-bold hover:bg-[#05b34c] transition-colors text-center"
            >
              LINEで補助相談する
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-4">※正式な受付・記録はフォーム送信が正本です。LINEは補助導線です。</p>
        </div>
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <p className="text-xs font-black text-slate-500 mb-3">LINEで補助相談</p>
          <img
            src={LINE_QR_URL}
            alt={`${LINE_ACCOUNT_NAME} QRコード`}
            className="w-full max-w-[180px] mx-auto rounded-2xl border border-slate-200 bg-white"
          />
          <a
            href={LINE_FRIEND_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full rounded-xl bg-[#06C755] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#05b34c]"
          >
            友だち追加はこちら
          </a>
          <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">スマホはボタンから追加、PCはQR読み取りで使えます。</p>
        </div>
      </div>

      {/* SEO本文セクション */}
      <section className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100 space-y-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">対応地域（下関市中心）</h2>
          <p className="text-slate-600 leading-relaxed">
            下関の軽貨物相談は、下関市を中心に受け付けています。長府・新下関・彦島・菊川・豊浦などを含む周辺エリアも、
            内容に応じてご相談ください。
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">相談の流れ</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-800 mb-1">1. 内容確認</h3>
              <p className="text-sm text-slate-600">配送相談・協力ドライバー募集・黒ナンバー相談の内容を確認します。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-800 mb-1">2. 必要に応じて連絡</h3>
              <p className="text-sm text-slate-600">入力内容をもとに、必要な確認事項があれば運営からご連絡します。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-800 mb-1">3. 相談または登録案内</h3>
              <p className="text-sm text-slate-600">目的に合わせて、配送相談の継続または登録案内へ進みます。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-800 mb-1">4. 条件が合えば次へ進む</h3>
              <p className="text-sm text-slate-600">条件が合えば、見積依頼・依頼受付・協力ドライバー登録へ進みます。</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">よくある質問</h2>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-1">配送相談はどこまで対応していますか？</h3>
              <p className="text-sm text-slate-600">
                下関市中心の軽貨物配送相談に対応しています。まずは見積フォームからご相談ください。
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-1">協力ドライバー募集は未経験でも応募できますか？</h3>
              <p className="text-sm text-slate-600">
                未経験の方でも応募可能です。現在の状況を確認し、条件に応じて登録案内を行います。
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-1">黒ナンバー未取得でも相談できますか？</h3>
              <p className="text-sm text-slate-600">
                可能です。黒ナンバー相談や軽貨物開業相談として、開業前の段階から受け付けています。
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

// 開業前・黒ナンバー未取得・必要書類がまだの方向けの相談導線（仮登録という言葉は使わない）
import { motion } from 'motion/react';
import { ArrowLeft, FileQuestion, HelpCircle, Truck } from 'lucide-react';
import type { ViewState } from '../types';
import { SITE_NAME, LINE_FRIEND_ADD_URL, LINE_QR_URL, LINE_ACCOUNT_NAME } from '../constants';

type SetView = (view: ViewState) => void;

export function PreOpenPage({ setView }: { setView: SetView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <button
        type="button"
        onClick={() => setView('top')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm"
      >
        <ArrowLeft size={16} /> トップに戻る
      </button>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold mb-4">
          黒ナンバー相談・軽貨物開業相談
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          下関の黒ナンバー相談・軽貨物開業相談ページ
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {SITE_NAME}では、下関で軽貨物を始めたい方向けに、黒ナンバー未取得・開業前・必要書類がまだの段階から相談を受け付けています。
          登録前でも相談可能です。お話を聞いたうえで、条件が合えば協力ドライバー登録につなげていく形です。
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="w-12 h-12 rounded-xl bg-[#e6f0ec] text-[#52a285] flex items-center justify-center shrink-0">
              <FileQuestion size={24} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 mb-1">黒ナンバー取得の流れ</h2>
              <p className="text-sm text-slate-600">
                貨物軽自動車運送事業の開業届や、必要な書類・手続きの流れについて相談できます。
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="w-12 h-12 rounded-xl bg-[#e6f0ec] text-[#52a285] flex items-center justify-center shrink-0">
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 mb-1">軽貨物開業相談（開業届・必要書類）</h2>
              <p className="text-sm text-slate-600">
                開業届の書き方や、免許証・車検証・保険など何を揃えればよいかなど、個別に相談できます。
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="w-12 h-12 rounded-xl bg-[#e6f0ec] text-[#52a285] flex items-center justify-center shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 mb-1">軽貨物向け車両選び</h2>
              <p className="text-sm text-slate-600">
                軽バン・軽トラの選び方や、購入・車検の相談も受け付けています。車両相談フォームからも送れます。
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-slate-700 mb-6">
          <p className="font-bold text-amber-800 mb-1">相談は無料です</p>
          <p>
            まずはお気軽にLINEまたは車両相談フォームからご連絡ください。登録前でも相談だけでも大丈夫です。
            やり取りを重ねて条件が合えば、そのタイミングで登録につなげることもできます。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href={LINE_FRIEND_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#06C755] text-white font-bold py-4 rounded-2xl hover:bg-[#05b34c] transition-colors"
          >
            黒ナンバー・開業前の相談をLINEで始める
          </a>
          <button
            type="button"
            onClick={() => setView('vehicle')}
            className="flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 transition-colors"
          >
            軽貨物向け車両相談フォームへ
          </button>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white">
          <img
            src={LINE_QR_URL}
            alt={`${LINE_ACCOUNT_NAME} QRコード`}
            className="w-24 h-24 rounded-xl border border-slate-200"
          />
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-slate-500 mb-1">LINEで補助相談</p>
            <p className="text-sm text-slate-600">
              スマホはボタンから、PCはQRコード読み取りで友だち追加できます。
            </p>
          </div>
        </div>

        <section className="mt-10 space-y-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">対応地域（下関市中心）</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              黒ナンバー相談・軽貨物開業相談は、下関市を中心に長府・新下関・彦島・菊川・豊浦などで受け付けています。
              その周辺エリアも内容に応じてご相談ください。
            </p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">相談の流れ</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-800 mb-1">1. 内容確認</h3>
                <p className="text-sm text-slate-600">黒ナンバー未取得・開業前の状況を確認します。</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-800 mb-1">2. 必要に応じて連絡</h3>
                <p className="text-sm text-slate-600">必要書類や進め方の確認が必要な場合にご連絡します。</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-800 mb-1">3. 相談または登録案内</h3>
                <p className="text-sm text-slate-600">状況に合わせて、相談継続または登録案内を行います。</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-800 mb-1">4. 条件が合えば次へ進む</h3>
                <p className="text-sm text-slate-600">準備状況と条件が合えば、次の手続きへ進みます。</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">よくある質問</h2>
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-1">黒ナンバー未取得でも相談できますか？</h3>
                <p className="text-sm text-slate-600">
                  可能です。黒ナンバー相談として、未取得の段階から相談を受け付けています。
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-1">軽貨物を開業する前でも相談できますか？</h3>
                <p className="text-sm text-slate-600">
                  可能です。軽貨物開業相談として、準備中の段階でも進め方を一緒に確認できます。
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-1">必要書類がまだ揃っていなくても大丈夫ですか？</h3>
                <p className="text-sm text-slate-600">
                  大丈夫です。現状を確認し、優先して準備する書類から順にご案内します。
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-1">車両相談も同時にできますか？</h3>
                <p className="text-sm text-slate-600">
                  できます。軽バンや軽トラの車両相談もこの流れであわせて進められます。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

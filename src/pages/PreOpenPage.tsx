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
          開業前・書類がまだの方
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          開業前・黒ナンバー未取得でも相談できます
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {SITE_NAME}では、黒ナンバーをまだ取得していない方、開業届や必要書類がまだ揃っていない方の相談も受け付けています。
          登録前でも相談可能です。お話を聞いたうえで、条件が合えば登録につなげていく形です。
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="w-12 h-12 rounded-xl bg-[#e6f0ec] text-[#52a285] flex items-center justify-center shrink-0">
              <FileQuestion size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1">黒ナンバー取得の流れ</h3>
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
              <h3 className="font-bold text-slate-800 mb-1">開業届・必要書類の相談</h3>
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
              <h3 className="font-bold text-slate-800 mb-1">軽貨物向け車両選び</h3>
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
            LINEで相談する
          </a>
          <button
            type="button"
            onClick={() => setView('vehicle')}
            className="flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 transition-colors"
          >
            車両相談フォームへ
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
      </div>
    </motion.div>
  );
}

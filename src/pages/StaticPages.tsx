// 利用案内・プライバシー・ご利用上の注意・協力ドライバー登録について
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import type { ViewState } from '../types';

type SetView = (view: ViewState) => void;

export function TermsPage({ setView }: { setView: SetView }) {
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
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 mb-6">利用案内</h1>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            軽貨物TAKEは、配送相談の受付および協力ドライバー登録の受付を行う窓口です。下関市を中心に、お客様のご依頼内容に応じて紹介・調整を行います。
          </p>
          <p>
            配送のご相談はフォームから送信してください。内容確認後、運営よりご連絡します。見積もりは概算です。正式な条件は個別にご案内します。
          </p>
          <p>
            協力ドライバー登録は審査制です。登録いただいても、サイト上に個人情報やプロフィールは公開しません。案件に応じて運営側からご連絡する場合があります。
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function PrivacyPage({ setView }: { setView: SetView }) {
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
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 mb-6">プライバシーポリシー</h1>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            ご入力いただいた氏名・住所・電話番号・メールアドレス等は、受付確認およびご連絡の目的で利用します。配送相談の内容は、案件に応じて協力ドライバーへ必要最小限の範囲で共有する場合があります。
          </p>
          <p>
            ドライバー登録でご提出いただいた書類は、審査および業務のため当方で保管します。第三者に無断で提供することはありません。
          </p>
          <p>
            サイトの改善のため、アクセス状況等を参照する場合があります。詳細は運営方針に準じます。
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function NoticePage({ setView }: { setView: SetView }) {
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
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 mb-6">ご利用上の注意</h1>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            軽貨物TAKEは配送相談・紹介・調整の窓口です。ご依頼内容に応じて、運営が自ら対応する場合と、承認済みの協力ドライバーをご紹介する場合があります。実際の条件調整や連絡は個別に行います。
          </p>
          <p>
            運賃計算器の金額は概算です。実際の荷物・距離・作業内容等により変動することがあります。サイトの掲載情報や紹介内容は、時点や状況により変更されることがあります。
          </p>
          <p>
            当サイトが確認している範囲と確認していない範囲を混同しないようご注意ください。不明点はお問い合わせください。
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function DriverNoticePage({ setView }: { setView: SetView }) {
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
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 mb-6">協力ドライバー登録について</h1>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            協力ドライバー登録は審査制です。登録いただいても、ホームページ上に氏名やプロフィールを公開することはありません。案件に応じて運営よりご連絡し、条件等を個別にご案内します。
          </p>
          <p>
            ご提出いただいた書類は審査および業務に利用します。必要に応じて、お客様のご依頼内容を協力ドライバーに必要最小限の範囲で共有する場合があります。実際の配車・条件調整・連絡は運営を通じて行うことがあります。
          </p>
          <p>
            登録内容の変更や登録の取り消しをご希望の場合は、運営までご連絡ください。
          </p>
        </div>
      </div>
    </motion.div>
  );
}

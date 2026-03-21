// 見積依頼・正式依頼フォーム
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Info, MessageCircle, Send, ShieldCheck } from 'lucide-react';
import type { ViewState } from '../types';
import type { SimulatorInput, DeliveryFormData } from '../types';
import { SITE_NAME, LINE_FRIEND_ADD_URL, LINE_QR_URL, LINE_ACCOUNT_NAME } from '../constants';
import {
  calculateFare,
  getOptionsSummary,
  submitToGas,
  generateReceiptNo,
  generateCorrelationId,
  generateIdempotencyKey,
  normalizeZip,
  searchAddressByZip,
  isMobileDevice
} from '../lib/helpers';
import { FormInput, SummaryItem, Modal, Badge, DevTestBar } from '../components/ui';

type SetView = (view: ViewState) => void;

export function DeliveryRequestPage({
  mode,
  setView,
  simulatorInput,
  formData,
  setFormData
}: {
  mode: 'estimate' | 'order';
  setView: SetView;
  simulatorInput: SimulatorInput;
  formData: DeliveryFormData;
  setFormData: React.Dispatch<React.SetStateAction<DeliveryFormData>>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [receiptNo, setReceiptNo] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const fare = useMemo(() => calculateFare(simulatorInput), [simulatorInput]);
  const isEstimate = mode === 'estimate';
  const isMobile = isMobileDevice();

  const fillTestData = () => {
    setFormData({
      name: 'テスト太郎',
      email: 'test@example.com',
      phone: '09012345678',
      zipcode: '7500025',
      address: '山口県下関市竹崎町4-4-8'
    });
    setTermsAgreed(true);
    setShowErrors(false);
  };

  const isValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    formData.zipcode.trim() &&
    formData.address.trim() &&
    termsAgreed;

  const requestLabel = mode === 'estimate' ? '見積依頼' : '正式依頼';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleZipcodeChange = async (value: string) => {
    const zip = normalizeZip(value);
    setFormData((prev) => ({ ...prev, zipcode: zip }));
    if (zip.length === 7) {
      try {
        const address = await searchAddressByZip(zip);
        if (address) setFormData((prev) => ({ ...prev, address }));
      } catch {
        // no-op
      }
    }
  };

  const summaryText = useMemo(
    () =>
      [
        `【${SITE_NAME} 受付要約】`,
        `受付番号: ${receiptNo}`,
        `受付種別: ${requestLabel}`,
        `お名前: ${formData.name}`,
        `集荷先: ${simulatorInput.origin}`,
        `納品先: ${simulatorInput.destination}`,
        `距離: ${simulatorInput.distance}km`,
        `荷物内容: ${simulatorInput.cargoDetail}`,
        `希望日時: ${simulatorInput.preferredDate.replace('T', ' ')}`,
        `概算見積: ¥${fare.toLocaleString()}`,
        simulatorInput.memo ? `備考: ${simulatorInput.memo}` : '',
        '',
        '※送信時の要約です（受付番号は見込み）。'
      ]
        .filter(Boolean)
        .join('\n'),
    [fare, formData.name, receiptNo, requestLabel, simulatorInput]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (!isValid) {
      const firstInvalid = document.querySelector('.invalid-field');
      if (firstInvalid instanceof HTMLElement) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => firstInvalid.focus(), 120);
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const newReceiptNo = generateReceiptNo('T');
      const correlationId = generateCorrelationId();
      const idempotencyKey = generateIdempotencyKey('delivery');
      const payload = {
        action: 'CREATE',
        apiVersion: '2026-03-14',
        clientVersion: 'web-app-v1',
        type: 'customer',
        receptionType: requestLabel,
        receiptNo: newReceiptNo,
        correlationId,
        idempotencyKey,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        zipcode: formData.zipcode,
        address: formData.address,
        origin: simulatorInput.origin,
        destination: simulatorInput.destination,
        distance: simulatorInput.distance,
        cargoSize: simulatorInput.cargoSize,
        cargoDetail: simulatorInput.cargoDetail,
        preferredDate: simulatorInput.preferredDate,
        memo: simulatorInput.memo,
        estimatedFare: fare,
        speedType: simulatorInput.speedType,
        options: getOptionsSummary(simulatorInput)
      };
      await submitToGas(payload);
      setReceiptNo(newReceiptNo);
      setSubmitStatus('success');
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <button
        type="button"
        onClick={() => setView('simulator')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm"
      >
        <ArrowLeft size={16} /> 運賃計算器に戻る
      </button>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {mode === 'estimate' ? '見積依頼フォーム' : '正式依頼フォーム'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">フォーム送信が正本です。LINEは補助です。</p>
          </div>
          <div className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">{requestLabel}</div>
        </div>

        <DevTestBar onFill={fillTestData} />

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <SummaryItem label="受付種別" value={requestLabel} />
            <SummaryItem label="概算見積" value={`¥${fare.toLocaleString()}`} strong />
            <SummaryItem label="集荷先" value={simulatorInput.origin} />
            <SummaryItem label="納品先" value={simulatorInput.destination} />
            <SummaryItem label="距離" value={`${simulatorInput.distance}km`} />
            <SummaryItem label="配送スピード" value={simulatorInput.speedType} />
            <SummaryItem label="荷物量" value={simulatorInput.cargoSize} />
            <SummaryItem label="希望日時" value={simulatorInput.preferredDate.replace('T', ' ')} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">荷物内容</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{simulatorInput.cargoDetail}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">備考</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{simulatorInput.memo || 'なし'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <FormInput
              label="名前"
              required
              value={formData.name}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              placeholder="例：山田 太郎"
              invalid={showErrors && !formData.name.trim()}
              errorText="名前を入力してください"
            />
            <FormInput
              label="メールアドレス"
              required
              type="email"
              value={formData.email}
              onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
              placeholder="例：example@mail.com"
              invalid={showErrors && !formData.email.trim()}
              errorText="メールアドレスを入力してください"
            />
            <FormInput
              label="電話番号"
              required
              type="tel"
              value={formData.phone}
              onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
              placeholder="例：09012345678"
              invalid={showErrors && !formData.phone.trim()}
              errorText="電話番号を入力してください"
            />
            <FormInput
              label="郵便番号"
              required
              value={formData.zipcode}
              onChange={handleZipcodeChange}
              placeholder="例：7500000"
              invalid={showErrors && !formData.zipcode.trim()}
              errorText="郵便番号を入力してください"
            />
          </div>
          <FormInput
            label="住所"
            required
            value={formData.address}
            onChange={(value) => setFormData((prev) => ({ ...prev, address: value }))}
            placeholder="例：山口県下関市〇〇1-2-3"
            invalid={showErrors && !formData.address.trim()}
            errorText="住所を入力してください"
          />

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className={`mt-0.5 w-5 h-5 rounded border-slate-300 focus:ring-[#52a285] ${
                  showErrors && !termsAgreed ? 'invalid-field outline outline-2 outline-red-500 outline-offset-2' : 'text-[#52a285]'
                }`}
              />
              <span className={`text-sm font-bold ${showErrors && !termsAgreed ? 'text-red-500' : 'text-slate-800'}`}>
                {isEstimate
                  ? '軽貨物TAKEが配送相談の窓口であること、確認・ご連絡のため個人情報を利用すること、案件に応じて協力ドライバーに必要最小限の情報を共有する場合があることに同意します'
                  : '軽貨物TAKEが依頼受付・紹介・調整の窓口であること、確認連絡のため個人情報を利用すること、案件に応じて協力ドライバーに必要最小限の情報を共有する場合があることに同意します'}
                <Badge type="required" />
                <button type="button" onClick={() => setShowPrivacyPolicy(true)} className="block mt-1 text-xs text-[#52a285] hover:underline">
                  利用案内・プライバシーポリシー・ご利用上の注意を読む
                </button>
              </span>
            </label>
            {showErrors && !termsAgreed && (
              <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1">
                <Info size={12} /> 同意が必要です
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#52a285] text-white font-black py-5 rounded-2xl hover:bg-[#3d7a64] transition-all shadow-lg shadow-emerald-100 text-lg flex justify-center items-center gap-2 disabled:bg-slate-300"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Send size={20} />
                {mode === 'estimate' ? 'この内容で見積依頼する' : 'この内容で依頼する'}
              </>
            )}
          </button>
          {showErrors && !isValid && (
            <p className="text-xs text-red-500 font-bold flex items-center gap-1">
              <Info size={12} />
              未入力の必須項目があります。赤枠を埋めて、もう一度押してください。
            </p>
          )}
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold">フォーム送信が正式受付です</span>
          </div>
        </form>
      </div>

      {showPrivacyPolicy && (
        <Modal onClose={() => setShowPrivacyPolicy(false)}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">利用案内・プライバシー・ご利用上の注意</h3>
            <button type="button" onClick={() => setShowPrivacyPolicy(false)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
          <div className="overflow-y-auto max-h-[60vh] pr-4 space-y-6 text-sm text-slate-600 leading-relaxed">
            <section>
              <h4 className="font-bold text-slate-800 mb-2">窓口・紹介・調整</h4>
              <p>軽貨物TAKEは配送相談の受付および紹介・調整の窓口です。案件に応じて協力ドライバーに必要最小限の情報を共有する場合があります。</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-2">個人情報の取扱い</h4>
              <p>氏名・住所・電話番号・メールアドレス等は、受付確認とご連絡のために利用します。</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-2">概算見積について</h4>
              <p>運賃計算器の金額は概算です。実際の荷物量や現地状況により変動する場合があります。</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-2">変更・キャンセル</h4>
              <p>正式依頼後の変更・キャンセルは、状況に応じてご相談となります。確定前にご連絡します。</p>
            </section>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setTermsAgreed(true);
                setShowPrivacyPolicy(false);
              }}
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-900 transition-colors"
            >
              同意して閉じる
            </button>
          </div>
        </Modal>
      )}

      {submitStatus === 'success' && (
        <Modal onClose={() => setView('top')}>
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {mode === 'estimate' ? '見積依頼を送信しました' : '正式依頼を送信しました'}
          </h3>
          <p className="text-slate-600 mb-4 text-sm">
            受付番号は送信時の見込みです。受付の確定は受信メールまたは運営側の記録でご確認ください。ご連絡は原則メールです。LINEは補助です。
          </p>
          <p className="text-slate-500 text-xs mb-4">
            受付番号: <span className="font-bold text-emerald-600">{receiptNo}</span>
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-left">
            <p className="text-xs font-bold text-slate-500 mb-2">受付要約</p>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans break-words">{summaryText}</pre>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(summaryText);
                alert('受付要約をコピーしました');
              }}
              className="mt-2 w-full py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700"
            >
              要約をコピー
            </button>
          </div>
          <div className="border-t border-slate-100 pt-4 mb-6">
            <p className="text-xs font-bold text-slate-500 mb-3">LINEで続けてやり取りしたい方（任意）</p>
            {isMobile ? (
              <a
                href={LINE_FRIEND_ADD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#06C755] text-white font-bold py-3 rounded-xl hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} /> LINEを開く
              </a>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">スマホでQRコードを読み取ると、LINEでもやり取りしやすくなります。</p>
                <div className="flex justify-center">
                  <img src={LINE_QR_URL} alt={`${LINE_ACCOUNT_NAME} QR`} className="w-28 h-28 border border-slate-200 rounded-xl" />
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setView('top')}
            className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors"
          >
            トップページへ戻る
          </button>
        </Modal>
      )}

      {submitStatus === 'error' && (
        <Modal onClose={() => setSubmitStatus('idle')}>
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">送信エラー</h3>
          <p className="text-slate-600 mb-6 text-sm">通信状況をご確認のうえ、もう一度お試しください。</p>
          <button
            type="button"
            onClick={() => setSubmitStatus('idle')}
            className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors"
          >
            閉じる
          </button>
        </Modal>
      )}
    </motion.div>
  );
}

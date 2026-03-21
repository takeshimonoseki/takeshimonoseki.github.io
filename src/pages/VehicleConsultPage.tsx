// 車両相談ページ（購入・修理・整備・車検）
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Info, MessageCircle, Send, ShieldCheck, Truck, User } from 'lucide-react';
import type { ViewState } from '../types';
import type { VehicleConsultKind, VehicleConsultFormData } from '../types';
import {
  SITE_NAME,
  LINE_FRIEND_ADD_URL,
  LINE_QR_URL,
  LINE_ACCOUNT_NAME,
  VEHICLE_FORM_STORAGE_KEY,
  VEHICLE_KIND_STORAGE_KEY,
  VEHICLE_MODELS_BY_MAKER,
  VEHICLE_PURCHASE_BUDGETS,
  VEHICLE_PURCHASE_DELIVERY,
  VEHICLE_REPAIR_SYMPTOMS,
  VEHICLE_REPAIR_SINCE,
  VEHICLE_REPAIR_DRIVABLE,
  VEHICLE_INSPECTION_TIMING,
  VEHICLE_INSPECTION_PREFERENCES
} from '../constants';
import {
  loadLocalStorage,
  saveLocalStorage,
  removeLocalStorage,
  isMobileDevice,
  defaultVehicleConsultFormData,
  submitToGas,
  getVehicleKindLabel,
  generateReceiptNo,
  generateCorrelationId,
  generateIdempotencyKey
} from '../lib/helpers';
import { SectionCard, FormInput, Modal, Badge, DevTestBar, VehicleTabButton } from '../components/ui';

type SetView = (view: ViewState) => void;

export function VehicleConsultPage({ setView }: { setView: SetView }) {
  const [kind, setKind] = useState<VehicleConsultKind>(() => {
    try {
      return (localStorage.getItem(VEHICLE_KIND_STORAGE_KEY) as VehicleConsultKind) || 'purchase';
    } catch {
      return 'purchase';
    }
  });
  const [formData, setFormData] = useState<VehicleConsultFormData>(() =>
    loadLocalStorage(VEHICLE_FORM_STORAGE_KEY, defaultVehicleConsultFormData())
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const isMobile = isMobileDevice();

  useEffect(() => {
    saveLocalStorage(VEHICLE_FORM_STORAGE_KEY, formData);
  }, [formData]);

  useEffect(() => {
    try {
      localStorage.setItem(VEHICLE_KIND_STORAGE_KEY, kind);
    } catch {
      // no-op
    }
  }, [kind]);

  const vehicleModels = useMemo(() => {
    if (!formData.maker) return [];
    return VEHICLE_MODELS_BY_MAKER[formData.maker] || ['その他'];
  }, [formData.maker]);

  const isValid = formData.name.trim() && formData.phone.trim() && formData.email.trim();

  const fillTestData = () => {
    setFormData({
      name: 'テスト太郎',
      phone: '09012345678',
      email: 'test@example.com',
      maker: 'トヨタ',
      model: 'ハイエース',
      modelUndecided: false,
      purchaseBudget: '200〜300万円',
      purchaseDelivery: '3か月以内',
      purchaseNotes: '軽貨物にも使える車を相談したいです',
      repairSymptom: '異音',
      repairSince: '数日前',
      repairDrivable: '普通に走れる',
      repairNotes: '段差でコトコト音がします',
      inspectionTiming: '来月',
      inspectionPreference: '相談して決めたい',
      inspectionNotes: '代車の有無も相談したいです'
    });
    setShowErrors(false);
    setSubmitError('');
  };

  const activeNotes =
    kind === 'purchase' ? formData.purchaseNotes : kind === 'repair' ? formData.repairNotes : formData.inspectionNotes;

  const summaryText = [
    `【${SITE_NAME} 車両相談】`,
    `受付番号: ${receiptNo}`,
    `相談種別: ${getVehicleKindLabel(kind)}`,
    `お名前: ${formData.name}`,
    `電話番号: ${formData.phone}`,
    `メール: ${formData.email}`,
    `メーカー: ${formData.maker || '未入力'}`,
    `車種: ${formData.modelUndecided ? '車種未定' : formData.model || '未入力'}`,
    kind === 'purchase' ? `予算: ${formData.purchaseBudget || '未入力'}` : '',
    kind === 'purchase' ? `希望納期: ${formData.purchaseDelivery || '未入力'}` : '',
    kind === 'repair' ? `症状: ${formData.repairSymptom || '未入力'}` : '',
    kind === 'repair' ? `いつからその症状が出ていますか: ${formData.repairSince || '未入力'}` : '',
    kind === 'repair' ? `走行可否: ${formData.repairDrivable || '未入力'}` : '',
    kind === 'inspection' ? `車検時期: ${formData.inspectionTiming || '未入力'}` : '',
    kind === 'inspection' ? `希望: ${formData.inspectionPreference || '未入力'}` : '',
    `備考: ${activeNotes || 'なし'}`
  ]
    .filter(Boolean)
    .join('\n');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    setSubmitError('');
    if (!isValid) {
      setSubmitError('名前・電話番号・メールアドレスを入力してください。');
      const firstInvalid = document.querySelector('.invalid-field');
      if (firstInvalid instanceof HTMLElement) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => firstInvalid.focus(), 120);
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const newReceiptNo = generateReceiptNo('V');
      const correlationId = generateCorrelationId();
      const idempotencyKey = generateIdempotencyKey('vehicle');
      const payload = {
        action: 'CREATE',
        apiVersion: '2026-03-15',
        clientVersion: 'web-app-v1',
        type: 'vehicle',
        receptionType: '車両相談',
        vehicleCategory: kind,
        vehicleCategoryLabel: getVehicleKindLabel(kind),
        receiptNo: newReceiptNo,
        correlationId,
        idempotencyKey,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        maker: formData.maker,
        model: formData.modelUndecided ? '車種未定' : formData.model,
        purchaseBudget: formData.purchaseBudget,
        purchaseDelivery: formData.purchaseDelivery,
        purchaseNotes: formData.purchaseNotes,
        repairSymptom: formData.repairSymptom,
        repairSince: formData.repairSince,
        repairDrivable: formData.repairDrivable,
        repairNotes: formData.repairNotes,
        inspectionTiming: formData.inspectionTiming,
        inspectionPreference: formData.inspectionPreference,
        inspectionNotes: formData.inspectionNotes
      };
      await submitToGas(payload);
      setReceiptNo(newReceiptNo);
      setSubmitStatus('success');
      setSubmitError('');
      setFormData(defaultVehicleConsultFormData());
      removeLocalStorage(VEHICLE_FORM_STORAGE_KEY);
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
      setSubmitError('送信に失敗しました。入力内容は保持されています。そのまま再送してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <button
        type="button"
        onClick={() => setView('top')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm"
      >
        <ArrowLeft size={16} /> トップに戻る
      </button>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold mb-3">
              サブ導線
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800">車両の相談</h1>
            <p className="text-slate-500 mt-2">車両購入・修理整備・車検の相談をまとめて受け付けます。</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <img
              src={LINE_QR_URL}
              alt={`${LINE_ACCOUNT_NAME} QRコード`}
              className="hidden sm:block w-16 h-16 rounded-xl border border-slate-200 bg-white"
            />
            <div>
              <p className="text-xs font-bold text-slate-700">LINEで補助相談</p>
              <p className="text-[11px] text-slate-400">正式受付はフォーム送信</p>
              <a
                href={LINE_FRIEND_ADD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-[#06C755] hover:underline"
              >
                友だち追加はこちら
              </a>
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <Info size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-1">送信エラー</p>
              <p>{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <form onSubmit={handleSubmit} className="space-y-6">
          <SectionCard title="相談種別" icon={<Truck className="text-[#52a285]" size={22} />}>
            <div className="grid sm:grid-cols-3 gap-3">
              <VehicleTabButton
                active={kind === 'purchase'}
                title="車両購入"
                desc="買いたい車の相談"
                onClick={() => setKind('purchase')}
              />
              <VehicleTabButton
                active={kind === 'repair'}
                title="修理・整備"
                desc="不調や故障の相談"
                onClick={() => setKind('repair')}
              />
              <VehicleTabButton
                active={kind === 'inspection'}
                title="車検"
                desc="車検時期や内容の相談"
                onClick={() => setKind('inspection')}
              />
            </div>
          </SectionCard>

          <SectionCard title="連絡先" icon={<User className="text-[#52a285]" size={22} />}>
            <DevTestBar onFill={fillTestData} />
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
                label="電話番号"
                required
                type="tel"
                value={formData.phone}
                onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                placeholder="例：09012345678"
                invalid={showErrors && !formData.phone.trim()}
                errorText="電話番号を入力してください"
              />
            </div>
            <div className="mt-4">
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
            </div>
          </SectionCard>

          <SectionCard title="車両情報" icon={<Truck className="text-[#52a285]" size={22} />}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                  メーカー <Badge type="optional" />
                </label>
                <select
                  value={formData.maker}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maker: e.target.value,
                      model: '',
                      modelUndecided: false
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
                >
                  <option value="">選択しなくてもOK</option>
                  {Object.keys(VEHICLE_MODELS_BY_MAKER).map((maker) => (
                    <option key={maker} value={maker}>
                      {maker}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                  車種 <Badge type="optional" />
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                  disabled={!formData.maker || formData.modelUndecided}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">{formData.maker ? '選択しなくてもOK' : 'メーカーを先に選んでください'}</option>
                  {vehicleModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="mt-4 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.modelUndecided}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    modelUndecided: e.target.checked,
                    model: e.target.checked ? '' : prev.model
                  }))
                }
                className="w-4 h-4 accent-[#52a285]"
              />
              <span className="text-sm font-medium text-slate-700">車種未定</span>
            </label>
          </SectionCard>

          {kind === 'purchase' && (
            <SectionCard title="車両購入の相談" icon={<Truck className="text-[#52a285]" size={22} />}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    予算 <Badge type="optional" />
                  </label>
                  <select
                    value={formData.purchaseBudget}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purchaseBudget: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
                  >
                    <option value="">選択しなくてもOK</option>
                    {VEHICLE_PURCHASE_BUDGETS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    希望納期 <Badge type="optional" />
                  </label>
                  <select
                    value={formData.purchaseDelivery}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDelivery: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
                  >
                    <option value="">選択しなくてもOK</option>
                    {VEHICLE_PURCHASE_DELIVERY.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                  備考 <Badge type="optional" />
                </label>
                <textarea
                  rows={4}
                  value={formData.purchaseNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, purchaseNotes: e.target.value }))}
                  placeholder="例：予算重視、軽バン希望、ハイブリッド希望、走行距離の目安など"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
                />
              </div>
            </SectionCard>
          )}

          {kind === 'repair' && (
            <SectionCard title="修理・整備の相談" icon={<ShieldCheck className="text-[#52a285]" size={22} />}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    症状 <Badge type="optional" />
                  </label>
                  <select
                    value={formData.repairSymptom}
                    onChange={(e) => setFormData((prev) => ({ ...prev, repairSymptom: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
                  >
                    <option value="">選択しなくてもOK</option>
                    {VEHICLE_REPAIR_SYMPTOMS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    いつからその症状が出ていますか <Badge type="optional" />
                  </label>
                  <select
                    value={formData.repairSince}
                    onChange={(e) => setFormData((prev) => ({ ...prev, repairSince: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
                  >
                    <option value="">選択しなくてもOK</option>
                    {VEHICLE_REPAIR_SINCE.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    走行可否 <Badge type="optional" />
                  </label>
                  <select
                    value={formData.repairDrivable}
                    onChange={(e) => setFormData((prev) => ({ ...prev, repairDrivable: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
                  >
                    <option value="">選択しなくてもOK</option>
                    {VEHICLE_REPAIR_DRIVABLE.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                  備考 <Badge type="optional" />
                </label>
                <textarea
                  rows={4}
                  value={formData.repairNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, repairNotes: e.target.value }))}
                  placeholder="例：異音がする / エアコンが効かない / ブレーキの感じが変 / 警告灯が点いた など"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
                />
              </div>
            </SectionCard>
          )}

          {kind === 'inspection' && (
            <SectionCard title="車検の相談" icon={<ShieldCheck className="text-[#52a285]" size={22} />}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    車検時期 <Badge type="optional" />
                  </label>
                  <select
                    value={formData.inspectionTiming}
                    onChange={(e) => setFormData((prev) => ({ ...prev, inspectionTiming: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
                  >
                    <option value="">選択しなくてもOK</option>
                    {VEHICLE_INSPECTION_TIMING.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    希望 <Badge type="optional" />
                  </label>
                  <select
                    value={formData.inspectionPreference}
                    onChange={(e) => setFormData((prev) => ({ ...prev, inspectionPreference: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
                  >
                    <option value="">選択しなくてもOK</option>
                    {VEHICLE_INSPECTION_PREFERENCES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                  備考 <Badge type="optional" />
                </label>
                <textarea
                  rows={4}
                  value={formData.inspectionNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, inspectionNotes: e.target.value }))}
                  placeholder="例：最低限で通したい / しっかり見てほしい / 相談しながら決めたい など"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
                />
              </div>
            </SectionCard>
          )}

          <SectionCard title="送信" icon={<Send className="text-[#52a285]" size={22} />}>
            <div className="bg-[#fcfaf2] border border-amber-200 rounded-xl p-6 text-sm text-slate-600 space-y-2 mb-6">
              <p>・LINEは補助導線です。正式な受付はフォーム送信が正本です。</p>
              <p>・メーカー・車種は未定でも送れます。</p>
              <p>・送信後、内容確認のうえご連絡します。</p>
            </div>
            {!isValid && (
              <p className="text-xs text-red-500 font-bold mb-4">
                ※名前・電話番号・メールアドレスを入力してください。
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold text-lg py-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#3d7a64] text-white hover:bg-[#2d5a4a]'
              }`}
            >
              <Send size={18} />
              {isSubmitting ? '送信中...' : `${getVehicleKindLabel(kind)}を送信する`}
            </button>
            {showErrors && !isValid && (
              <p className="text-xs text-red-500 font-bold mt-3 flex items-center gap-1">
                <Info size={12} />
                未入力の必須項目があります。赤枠を埋めて、もう一度押してください。
              </p>
            )}
          </SectionCard>
        </form>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm font-black text-slate-800 mb-3">LINEで補助相談</p>
            {isMobile ? (
              <a
                href={LINE_FRIEND_ADD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#06C755] text-white font-bold py-3 rounded-xl hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                LINEを開く
              </a>
            ) : (
              <>
                <img
                  src={LINE_QR_URL}
                  alt={`${LINE_ACCOUNT_NAME} QRコード`}
                  className="w-full max-w-[220px] mx-auto rounded-2xl border border-slate-200 bg-white"
                />
                <a
                  href={LINE_FRIEND_ADD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-xl bg-[#06C755] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#05b34c]"
                >
                  友だち追加はこちら
                </a>
              </>
            )}
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              LINEは補助相談用です。正式な受付・記録はフォーム送信で行います。
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm font-black text-slate-800 mb-3">今送る内容</p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">相談種別</span>
                <span className="font-bold text-slate-800">{getVehicleKindLabel(kind)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">メーカー</span>
                <span className="font-bold text-slate-800">{formData.maker || '未入力'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">車種</span>
                <span className="font-bold text-slate-800">
                  {formData.modelUndecided ? '車種未定' : formData.model || '未入力'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {submitStatus === 'success' && (
        <Modal onClose={() => setView('top')}>
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">車両相談を送信しました</h3>
          <p className="text-slate-600 mb-4 text-sm">
            受付番号は送信時の見込みです。受付の確定はメールまたは運営側の記録でご確認ください。ご連絡は原則メールまたは電話です。
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
                <MessageCircle size={20} />
                LINEを開く
              </a>
            ) : (
              <div className="flex justify-center">
                <img src={LINE_QR_URL} alt={`${LINE_ACCOUNT_NAME} QR`} className="w-28 h-28 border border-slate-200 rounded-xl" />
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
          <p className="text-slate-600 mb-6 text-sm">
            入力内容は保持されています。通信状況をご確認のうえ、そのまま再送してください。
          </p>
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

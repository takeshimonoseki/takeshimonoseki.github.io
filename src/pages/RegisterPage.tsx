// 協力ドライバー登録フォーム
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Info, MessageCircle, Send, ShieldCheck, Truck, User } from 'lucide-react';
import type { ViewState } from '../types';
import type { DriverRegisterFormData, DriverFiles, DriverFileNames } from '../types';
import {
  SITE_NAME,
  LINE_FRIEND_ADD_URL,
  LINE_QR_URL,
  LINE_ACCOUNT_NAME,
  DRIVER_DOC_REQUIRED,
  DRIVER_DOC_OPTIONAL,
  KEI_MAKERS,
  TEST_IMAGE_DATA_URL
} from '../constants';
import {
  defaultDriverRegisterFormData,
  submitToGas,
  generateReceiptNo,
  generateCorrelationId,
  generateIdempotencyKey,
  normalizeZip,
  searchAddressByZip,
  isMobileDevice
} from '../lib/helpers';
import { SectionCard, FormInput, Modal, FileUpload, DevTestBar } from '../components/ui';

type SetView = (view: ViewState) => void;

export function RegisterPage({ setView }: { setView: SetView }) {
  const [formData, setFormData] = useState<DriverRegisterFormData>(defaultDriverRegisterFormData());
  const [files, setFiles] = useState<DriverFiles>({});
  const [fileNames, setFileNames] = useState<DriverFileNames>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');
  const [submitError, setSubmitError] = useState('');
  const isMobile = isMobileDevice();

  const fillTestData = () => {
    setFormData({
      name: 'テスト太郎',
      furigana: 'てすとたろう',
      phone: '09012345678',
      email: 'test@example.com',
      zipcode: '7500025',
      address: '山口県下関市竹崎町4-4-8',
      maker: 'ダイハツ',
      model: 'ハイゼットカーゴ',
      experience: '1〜3年',
      workingArea: '下関市周辺',
      notes: 'テスト送信です',
      agreed: true
    });
    const testFiles: DriverFiles = {};
    const testNames: DriverFileNames = {};
    DRIVER_DOC_REQUIRED.forEach((d) => {
      testFiles[d.key] = TEST_IMAGE_DATA_URL;
      testNames[d.key] = `${d.driveName}.png`;
    });
    setFiles(testFiles);
    setFileNames(testNames);
    setSubmitError('');
  };

  const requiredFilesOk = DRIVER_DOC_REQUIRED.every((d) => !!files[d.key]);
  const isFormValid =
    formData.name.trim() &&
    formData.furigana.trim() &&
    formData.phone.trim() &&
    formData.email.trim() &&
    formData.maker.trim() &&
    formData.model.trim() &&
    formData.experience.trim() &&
    formData.agreed &&
    requiredFilesOk;

  const handleZipChange = async (value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!isFormValid) {
      setSubmitError('必須項目・必須ファイル・同意チェックを確認してください。');
      return;
    }
    setIsSubmitting(true);
    try {
      const newReceiptNo = generateReceiptNo('D');
      const correlationId = generateCorrelationId();
      const idempotencyKey = generateIdempotencyKey('driver');
      const payload = {
        action: 'CREATE',
        apiVersion: '2026-03-14',
        clientVersion: 'web-app-v1',
        type: 'driver',
        receptionType: '協力ドライバー登録',
        receiptNo: newReceiptNo,
        correlationId,
        idempotencyKey,
        ...formData,
        files
      };
      await submitToGas(payload);
      setReceiptNo(newReceiptNo);
      setSubmitSuccess(true);
      setSubmitError('');
      setFormData(defaultDriverRegisterFormData());
      setFiles({});
      setFileNames({});
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      setSubmitError(
        '送信に失敗しました。入力内容と選択済みファイルはこのまま保持されています。ページを閉じず、そのまま再送してください。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <button
        type="button"
        onClick={() => setView('top')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm"
      >
        <ArrowLeft size={16} /> トップに戻る
      </button>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#e6f0ec] text-[#3d7a64] text-xs px-2 py-1 rounded font-bold">下関の協力ドライバー募集・登録</span>
          <span className="text-slate-500 text-xs flex items-center gap-1">
            <Info size={14} /> 送信に少し時間がかかる場合があります
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">下関の協力ドライバー募集・登録フォーム</h1>
        <p className="text-slate-600 text-sm">
          下関中心の軽貨物案件に向けた協力ドライバー募集ページです。登録してもサイト上に個人を公開せず、
          審査のうえ案件に応じて運営よりご連絡します。
        </p>
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

      {isSubmitting && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <div>
              <p className="font-bold">画像をまとめて送信中です</p>
              <p className="mt-1">書類画像が多いため、30秒前後かかることがあります。画面を閉じず、そのままお待ちください。</p>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <SectionCard title="基本情報" icon={<User className="text-[#52a285]" size={22} />}>
          <DevTestBar onFill={fillTestData} />
          <div className="grid md:grid-cols-2 gap-4">
            <FormInput
              label="氏名"
              required
              value={formData.name}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              placeholder="例：山田 太郎"
            />
            <FormInput
              label="ふりがな"
              required
              value={formData.furigana}
              onChange={(value) => setFormData((prev) => ({ ...prev, furigana: value }))}
              placeholder="例：やまだ たろう"
            />
            <FormInput
              label="電話番号"
              required
              type="tel"
              value={formData.phone}
              onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
              placeholder="例：09012345678"
            />
            <FormInput
              label="メールアドレス"
              required
              type="email"
              value={formData.email}
              onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
              placeholder="例：example@mail.com"
            />
            <FormInput
              label="郵便番号"
              value={formData.zipcode}
              onChange={handleZipChange}
              placeholder="例：7500000"
            />
            <FormInput
              label="住所"
              value={formData.address}
              onChange={(value) => setFormData((prev) => ({ ...prev, address: value }))}
              placeholder="例：山口県下関市〇〇1-2-3"
            />
          </div>
        </SectionCard>

        <SectionCard title="車両・経験" icon={<Truck className="text-[#52a285]" size={22} />}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                メーカー <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>
              </label>
              <select
                value={formData.maker}
                onChange={(e) => setFormData((prev) => ({ ...prev, maker: e.target.value, model: '' }))}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="">選択してください</option>
                {Object.keys(KEI_MAKERS).map((maker) => (
                  <option key={maker} value={maker}>
                    {maker}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                車種 <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                disabled={!formData.maker}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">{formData.maker ? '選択してください' : 'メーカーを選択してください'}</option>
                {formData.maker &&
                  KEI_MAKERS[formData.maker]?.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                経験年数 <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>
              </label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="">選択してください</option>
                <option value="未経験">未経験</option>
                <option value="1年未満">1年未満</option>
                <option value="1〜3年">1〜3年</option>
                <option value="3〜5年">3〜5年</option>
                <option value="5年以上">5年以上</option>
              </select>
            </div>
            <FormInput
              label="主な稼働エリア"
              value={formData.workingArea}
              onChange={(value) => setFormData((prev) => ({ ...prev, workingArea: value }))}
              placeholder="例：下関市、北九州市"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-bold text-slate-800 mb-2">メモ</label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="例：平日中心、スポット歓迎、朝便対応可能など"
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
            />
          </div>
        </SectionCard>

        <SectionCard title="書類アップロード" icon={<ShieldCheck className="text-[#52a285]" size={22} />}>
          <p className="text-sm text-slate-600 mb-4">
            必須6種：免許証（表・裏）、車検証、任意保険、貨物軽自動車運送事業経営届出書、車両前面写真（黒ナンバー入り）
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {DRIVER_DOC_REQUIRED.map((d, i) => (
              <React.Fragment key={`req-${i}`}>
                <FileUpload
                  label={d.label}
                  required
                  initialFileName={fileNames[d.key]}
                  onFileSelect={(base64, fileName) => {
                    setFiles((prev) => ({ ...prev, [d.key]: base64 }));
                    setFileNames((prev) => ({ ...prev, [d.key]: fileName }));
                    setSubmitError('');
                  }}
                />
              </React.Fragment>
            ))}
            {DRIVER_DOC_OPTIONAL.map((d, i) => (
              <React.Fragment key={`opt-${i}`}>
                <FileUpload
                  label={d.label}
                  required={false}
                  initialFileName={fileNames[d.key]}
                  onFileSelect={(base64, fileName) => {
                    setFiles((prev) => ({ ...prev, [d.key]: base64 }));
                    setFileNames((prev) => ({ ...prev, [d.key]: fileName }));
                    setSubmitError('');
                  }}
                />
              </React.Fragment>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="送信（協力ドライバー募集への応募）" icon={<Send className="text-[#52a285]" size={22} />}>
          <div className="bg-[#fcfaf2] border border-amber-200 rounded-xl p-6 text-sm text-slate-600 space-y-2 mb-6">
            <p>・登録は審査制です。サイト上に氏名・プロフィールは公開しません。</p>
            <p>・入力内容・書類は連絡・審査・案件マッチングのために利用します。案件に応じて必要最小限の情報をお客様側に共有する場合があります。</p>
            <p>・登録内容の変更や取り消しは運営までご連絡ください。</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={formData.agreed}
              onChange={(e) => setFormData((prev) => ({ ...prev, agreed: e.target.checked }))}
              className="mt-1 w-5 h-5 text-[#52a285] rounded border-slate-300 focus:ring-[#52a285]"
            />
            <span className="font-bold text-slate-800">
              上記および利用案内・協力ドライバー登録についての注意を確認し、同意して登録します
            </span>
          </label>
          {!isFormValid && (
            <p className="text-xs text-red-500 font-bold mb-4">※必須項目・必須ファイル・同意チェックを確認してください。</p>
          )}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-bold text-lg py-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 ${
              isFormValid && !isSubmitting ? 'bg-[#3d7a64] text-white hover:bg-[#2d5a4a]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
            {isSubmitting ? '画像を送信中…少しお待ちください' : '協力ドライバー募集に応募する'}
          </button>
        </SectionCard>
      </form>

      <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">対応地域（募集エリア）</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            協力ドライバー募集は、下関市を中心に長府・新下関・彦島・菊川・豊浦などの周辺エリアを想定しています。
            稼働可能エリアは登録内容を確認したうえで調整します。
          </p>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">登録の流れ</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-800 mb-1">1. 内容確認</h3>
              <p className="text-sm text-slate-600">入力内容と提出書類を確認します。</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-800 mb-1">2. 必要に応じて連絡</h3>
              <p className="text-sm text-slate-600">確認事項がある場合のみ、運営からご連絡します。</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-800 mb-1">3. 登録案内</h3>
              <p className="text-sm text-slate-600">内容に応じて、協力ドライバー登録の進行案内を行います。</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-800 mb-1">4. 条件が合えば次へ進む</h3>
              <p className="text-sm text-slate-600">条件が合えば、案件連携に向けて次のステップへ進みます。</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">よくある質問</h2>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-1">登録条件はありますか？</h3>
              <p className="text-sm text-slate-600">
                必須項目の入力と必要書類の提出が必要です。内容確認後に連絡・案内を行います。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-1">連絡はどのように届きますか？</h3>
              <p className="text-sm text-slate-600">
                登録内容を確認後、必要に応じてメールや電話でご連絡します。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-1">登録後にプロフィールは公開されますか？</h3>
              <p className="text-sm text-slate-600">
                公開しません。サイト上で個人情報を一覧表示する運用は行っていません。
              </p>
            </div>
          </div>
        </div>
      </section>

      {submitSuccess && (
        <Modal onClose={() => setView('top')}>
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">登録申請を受け付けました</h3>
          <p className="text-slate-600 mb-4 text-sm">
            受付番号: <span className="font-bold text-emerald-600">{receiptNo}</span>
          </p>
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
    </motion.div>
  );
}

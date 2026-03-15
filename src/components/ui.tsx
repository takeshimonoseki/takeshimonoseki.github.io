// 共通UI：SectionCard, FormInput, Modal, Badge, DevTestBar など
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';
import { ENABLE_TEST_FILL } from '../constants';

// 必須/任意バッジ（FormInput・FileUpload で使用）
export function Badge({ type }: { type: 'required' | 'optional' }) {
  if (type === 'required') {
    return (
      <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">
        必須
      </span>
    );
  }
  return (
    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-bold border border-slate-200">
      任意
    </span>
  );
}

export function SectionCard({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        {icon}
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function SummaryItem({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      <p className={strong ? 'font-bold text-[#52a285] text-lg' : 'font-bold text-slate-700'}>
        {value}
      </p>
    </div>
  );
}

export function FormInput({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  type = 'text',
  invalid = false,
  errorText = ''
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void | Promise<void>;
  placeholder: string;
  type?: string;
  invalid?: boolean;
  errorText?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
        {label}
        {required && <Badge type="required" />}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => {
          void onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={`w-full p-3 rounded-xl border outline-none transition-all ${
          invalid
            ? 'border-red-500 bg-red-50/50 invalid-field'
            : 'border-slate-200 focus:border-[#52a285]'
        }`}
      />
      {invalid && errorText && (
        <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1">
          <Info size={12} />
          {errorText}
        </p>
      )}
    </div>
  );
}

export function Modal({
  children,
  onClose
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl my-auto"
      >
        {children}
        <button type="button" onClick={onClose} className="sr-only">
          close
        </button>
      </motion.div>
    </div>
  );
}

export function FileUpload({
  label,
  required,
  initialFileName = '',
  onFileSelect
}: {
  label: string;
  required: boolean;
  initialFileName?: string;
  onFileSelect: (base64: string, fileName: string) => void;
}) {
  const [fileName, setFileName] = useState(initialFileName);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setFileName(initialFileName);
  }, [initialFileName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMsg('');
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('ファイルサイズが大きすぎます（5MBまで）');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      onFileSelect(reader.result as string, file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-600 font-medium text-sm">{label}</span>
        <Badge type={required ? 'required' : 'optional'} />
      </div>
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2">
        <label className="cursor-pointer bg-[#e6f0ec] text-[#3d7a64] hover:bg-[#d1e6dd] px-4 py-2 rounded-md text-sm font-bold transition-colors shrink-0">
          ファイルを選択
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleChange} />
        </label>
        <span className="text-sm text-slate-400 truncate">{fileName || '選択されていません'}</span>
      </div>
      {fileName && (
        <p className="text-[11px] text-emerald-700 mt-2 font-bold">選択中: {fileName}</p>
      )}
      {errorMsg && <p className="text-xs text-red-500 mt-2 font-bold">{errorMsg}</p>}
    </div>
  );
}

export function DevTestBar({ onFill }: { onFill: () => void }) {
  if (!ENABLE_TEST_FILL) return null;
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div>
        <p className="text-sm font-bold text-amber-800">開発用テスト入力</p>
        <p className="text-xs text-amber-700">公開版では表示されません。</p>
      </div>
      <button
        type="button"
        onClick={onFill}
        className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-600"
      >
        テスト入力
      </button>
    </div>
  );
}

export function VehicleTabButton({
  active,
  title,
  desc,
  onClick
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all ${
        active
          ? 'border-[#52a285] bg-[#eef6f2] shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <p className={`font-black ${active ? 'text-[#3d7a64]' : 'text-slate-800'}`}>{title}</p>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </button>
  );
}

export function OptionBlock({
  title,
  stairs,
  setStairs,
  walkDistance,
  setWalkDistance,
  waitTime,
  setWaitTime
}: {
  title: string;
  stairs: string;
  setStairs: (value: string) => void;
  walkDistance: string;
  setWalkDistance: (value: string) => void;
  waitTime: string;
  setWaitTime: (value: string) => void;
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <h3 className="text-sm font-bold text-slate-800 mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">階段</label>
          <select
            value={stairs}
            onChange={(e) => setStairs(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white"
          >
            <option value="1">1階/EV有</option>
            <option value="2">2階</option>
            <option value="3">3階</option>
            <option value="4">4階</option>
            <option value="5">5階</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">移動距離</label>
          <select
            value={walkDistance}
            onChange={(e) => setWalkDistance(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white"
          >
            <option value="20">20m未満</option>
            <option value="50">50m未満</option>
            <option value="100">100m未満</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">待機時間</label>
          <select
            value={waitTime}
            onChange={(e) => setWaitTime(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white"
          >
            <option value="0">なし</option>
            <option value="20">20分</option>
            <option value="40">40分</option>
            <option value="60">60分</option>
          </select>
        </div>
      </div>
    </div>
  );
}

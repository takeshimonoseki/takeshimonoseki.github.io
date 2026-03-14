// path: src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Truck,
  User,
  UserPlus,
  Zap
} from 'lucide-react';
import heroKanmonTake from './assets/hero-kanmon-take.png';
import logoTakeCircle from './assets/logo-take-circle.png';

type ViewState =
  | 'top'
  | 'customer'
  | 'driver'
  | 'simulator'
  | 'consult-delivery-estimate'
  | 'consult-delivery-order'
  | 'register'
  | 'terms'
  | 'privacy'
  | 'notice'
  | 'driver-notice';

const SITE_NAME = '軽貨物TAKE';
const LINE_ACCOUNT_NAME = '軽貨物TAKE';
const LINE_FRIEND_ADD_URL = 'https://line.me/R/ti/p/%40822ashrr';
const LINE_QR_URL = 'https://qr-official.line.me/gs/M_822ashrr_GW.png';
const HERO_BG_URL = heroKanmonTake;
const LOGO_IMAGE_URL = logoTakeCircle;
const GAS_URL =
  'https://script.google.com/macros/s/AKfycbwWQsnvGNke38i4luvYZM1SHmhScl7EEPLQli0-8ozVjQHfzeBJbyArcviVq02-ZOLWgQ/exec';
const SIMULATOR_STORAGE_KEY = 'keikamotsu_take_simulator_input_v3';
const DELIVERY_ESTIMATE_FORM_STORAGE_KEY = 'keikamotsu_take_delivery_estimate_form_v3';
const DELIVERY_ORDER_FORM_STORAGE_KEY = 'keikamotsu_take_delivery_order_form_v3';
const DRIVER_REGISTER_FORM_STORAGE_KEY = 'keikamotsu_take_driver_register_form_v3';
const DRIVER_REGISTER_FILES_STORAGE_KEY = 'keikamotsu_take_driver_register_files_v3';
const DRIVER_REGISTER_FILE_NAMES_STORAGE_KEY = 'keikamotsu_take_driver_register_file_names_v3';

const ENABLE_TEST_FILL = import.meta.env.DEV;

const TEST_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

type SimulatorInput = {
  origin: string;
  destination: string;
  distance: string;
  cargoSize: '小' | '中' | '大';
  cargoDetail: string;
  preferredDate: string;
  memo: string;
  vehicleCount: string;
  extraWorkers: string;
  speedType: '通常便' | 'お急ぎ便' | '超特急便';
  weather: '晴れ/曇り' | '雨/雪';
  stairsLoad: string;
  stairsUnload: string;
  walkDistLoad: string;
  walkDistUnload: string;
  waitTimeLoad: string;
  waitTimeUnload: string;
};

type DeliveryFormData = {
  name: string;
  email: string;
  phone: string;
  zipcode: string;
  address: string;
};

type DriverRegisterFormData = {
  name: string;
  furigana: string;
  phone: string;
  email: string;
  zipcode: string;
  address: string;
  maker: string;
  model: string;
  experience: string;
  workingArea: string;
  notes: string;
  agreed: boolean;
};

type DriverFiles = Record<string, string>;
type DriverFileNames = Record<string, string>;

const DRIVER_DOC_REQUIRED: { key: string; label: string; driveName: string }[] = [
  { key: '免許証（表）', label: '免許証（表）', driveName: '01_免許証_表' },
  { key: '免許証（裏）', label: '免許証（裏）', driveName: '02_免許証_裏' },
  { key: '車検証', label: '車検証', driveName: '03_車検証' },
  { key: '任意保険', label: '任意保険', driveName: '04_任意保険' },
  {
    key: '貨物軽自動車運送事業経営届出書',
    label: '貨物軽自動車運送事業経営届出書',
    driveName: '05_貨物軽自動車運送事業経営届出書'
  },
  {
    key: '車両前面写真_黒ナンバー入り',
    label: '車両前面写真（黒ナンバーがはっきり写っているもの）',
    driveName: '06_車両前面写真_黒ナンバー入り'
  }
];
const DRIVER_DOC_OPTIONAL: { key: string; label: string; driveName: string }[] = [
  { key: '貨物保険', label: '貨物保険', driveName: '07_貨物保険' },
  { key: 'その他資料', label: 'その他補足資料', driveName: '08_その他資料' }
];

const KEI_MAKERS: Record<string, string[]> = {
  ダイハツ: ['ハイゼットカーゴ', 'ハイゼットトラック', 'アトレー', 'その他'],
  スズキ: ['エブリイ', 'キャリイ', 'その他'],
  ホンダ: ['N-VAN', 'アクティ', 'その他'],
  日産: ['NV100クリッパー', 'NT100クリッパー', 'その他'],
  三菱: ['ミニキャブバン', 'ミニキャブトラック', 'その他'],
  スバル: ['サンバーバン', 'サンバートラック', 'その他'],
  マツダ: ['スクラムバン', 'スクラムトラック', 'その他'],
  トヨタ: ['ピクシスバン', 'ピクシストラック', 'その他']
};

const COMMON_ROUTES = [
  {
    label: '下関 ↔ 門司',
    dist: '10.0',
    origin: '山口県下関市',
    destination: '福岡県北九州市門司区'
  },
  {
    label: '下関 ↔ 小倉',
    dist: '15.0',
    origin: '山口県下関市',
    destination: '福岡県北九州市小倉北区'
  },
  {
    label: '下関 ↔ 福岡市',
    dist: '75.0',
    origin: '山口県下関市',
    destination: '福岡県福岡市'
  },
  {
    label: '下関 ↔ 山口市',
    dist: '70.0',
    origin: '山口県下関市',
    destination: '山口県山口市'
  }
];

function defaultSimulatorInput(): SimulatorInput {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  const preferredDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return {
    origin: '',
    destination: '',
    distance: '',
    cargoSize: '小',
    cargoDetail: '',
    preferredDate,
    memo: '',
    vehicleCount: '1',
    extraWorkers: '0',
    speedType: '通常便',
    weather: '晴れ/曇り',
    stairsLoad: '1',
    stairsUnload: '1',
    walkDistLoad: '20',
    walkDistUnload: '20',
    waitTimeLoad: '0',
    waitTimeUnload: '0'
  };
}

function defaultDeliveryFormData(): DeliveryFormData {
  return {
    name: '',
    email: '',
    phone: '',
    zipcode: '',
    address: ''
  };
}

function defaultDriverRegisterFormData(): DriverRegisterFormData {
  return {
    name: '',
    furigana: '',
    phone: '',
    email: '',
    zipcode: '',
    address: '',
    maker: '',
    model: '',
    experience: '',
    workingArea: '下関市周辺',
    notes: '',
    agreed: false
  };
}

function loadLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function saveLocalStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}

function clearLocalStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function normalizeZip(value: string) {
  return value
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, '');
}

async function searchAddressByZip(zipcode: string) {
  const zip = normalizeZip(zipcode);
  if (zip.length !== 7) return '';
  const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
  const data = await res.json();
  if (!data?.results?.[0]) return '';
  const result = data.results[0];
  return `${result.address1}${result.address2}${result.address3}`;
}

function generateReceiptNo(prefix: 'T' | 'D') {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `${prefix}-${dateStr}-${randomNum}`;
}

function generateCorrelationId() {
  return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateIdempotencyKey(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getOptionsSummary(input: SimulatorInput) {
  return [
    `荷物量:${input.cargoSize}`,
    `車両:${input.vehicleCount}台`,
    `追加作業員:${input.extraWorkers}名`,
    `配送スピード:${input.speedType}`,
    `天候:${input.weather}`,
    `積地階段:${input.stairsLoad}階`,
    `降地階段:${input.stairsUnload}階`,
    `積地移動:${input.walkDistLoad}m`,
    `降地移動:${input.walkDistUnload}m`,
    `積地待機:${input.waitTimeLoad}分`,
    `降地待機:${input.waitTimeUnload}分`
  ].join(' / ');
}

function calculateFare(input: SimulatorInput) {
  const dist = Math.max(Number(input.distance) || 0, 0);

  let baseFare = 3000;
  let distanceFare = 0;

  if (dist <= 20) {
    distanceFare = dist * 130;
  } else if (dist <= 50) {
    distanceFare = 20 * 130 + (dist - 20) * 120;
  } else {
    distanceFare = 20 * 130 + 30 * 120 + (dist - 50) * 110;
  }

  let total = baseFare + distanceFare;

  if (dist > 100) total *= 1.5;

  total += dist * 25;

  if (input.cargoSize === '中') total += 2000;
  if (input.cargoSize === '大') total += 4000;

  if (input.walkDistLoad === '50') total += 1000;
  if (input.walkDistLoad === '100') total += 2000;
  if (input.walkDistUnload === '50') total += 1000;
  if (input.walkDistUnload === '100') total += 2000;

  total += Math.floor((Number(input.waitTimeLoad) || 0) / 20) * 1000;
  total += Math.floor((Number(input.waitTimeUnload) || 0) / 20) * 1000;

  const getStairsFee = (floor: string) => {
    const f = Number(floor) || 1;
    return f > 1 ? (f - 1) * 1500 : 0;
  };

  total += getStairsFee(input.stairsLoad);
  total += getStairsFee(input.stairsUnload);

  total *= Number(input.vehicleCount) || 1;
  total += (Number(input.extraWorkers) || 0) * 8000;

  if (input.weather === '雨/雪') total *= 1.1;
  if (input.speedType === 'お急ぎ便') total *= 1.2;
  if (input.speedType === '超特急便') total *= 1.4;

  return Math.floor(total);
}

async function submitToGas(payload: unknown) {
  await Promise.race([
    fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
  ]);
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('top');
  const [simulatorInput, setSimulatorInput] = useState<SimulatorInput>(() =>
    loadLocalStorage(SIMULATOR_STORAGE_KEY, defaultSimulatorInput())
  );
  const [estimateFormData, setEstimateFormData] = useState<DeliveryFormData>(() =>
    loadLocalStorage(DELIVERY_ESTIMATE_FORM_STORAGE_KEY, defaultDeliveryFormData())
  );
  const [orderFormData, setOrderFormData] = useState<DeliveryFormData>(() =>
    loadLocalStorage(DELIVERY_ORDER_FORM_STORAGE_KEY, defaultDeliveryFormData())
  );

  useEffect(() => {
    saveLocalStorage(SIMULATOR_STORAGE_KEY, simulatorInput);
  }, [simulatorInput]);

  useEffect(() => {
    saveLocalStorage(DELIVERY_ESTIMATE_FORM_STORAGE_KEY, estimateFormData);
  }, [estimateFormData]);

  useEffect(() => {
    saveLocalStorage(DELIVERY_ORDER_FORM_STORAGE_KEY, orderFormData);
  }, [orderFormData]);

  return (
    <div className="min-h-screen bg-[#f4f7f6] font-sans text-slate-800">
      <header className="bg-[#f4f7f6]/95 border-b border-slate-200/70 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              type="button"
              className="flex items-center gap-3"
              onClick={() => setCurrentView('top')}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-white shadow-sm shrink-0">
                <img
                  src={LOGO_IMAGE_URL}
                  alt={`${SITE_NAME} ロゴ`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col text-left">
                <span className="font-black text-xl tracking-tighter text-slate-800 leading-none">
                  {SITE_NAME}
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.22em] mt-1">
                  SHIMONOSEKI AREA
                </span>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setCurrentView('top')}
                className={`hover:text-[#52a285] transition-colors ${
                  currentView === 'top' ? 'text-[#52a285]' : ''
                }`}
              >
                トップ
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('simulator')}
                className={`hover:text-[#52a285] transition-colors ${
                  currentView === 'customer' ||
                  currentView === 'simulator' ||
                  currentView === 'consult-delivery-estimate' ||
                  currentView === 'consult-delivery-order'
                    ? 'text-[#52a285]'
                    : ''
                }`}
              >
                配送相談
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('register')}
                className={`hover:text-[#52a285] transition-colors ${
                  currentView === 'driver' || currentView === 'register' ? 'text-[#52a285]' : ''
                }`}
              >
                協力ドライバー登録
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentView === 'top' && <TopView setView={setCurrentView} />}
        {currentView === 'customer' && <CustomerTopView setView={setCurrentView} />}
        {currentView === 'driver' && <DriverTopView setView={setCurrentView} />}
        {currentView === 'simulator' && (
          <SimulatorView
            setView={setCurrentView}
            simulatorInput={simulatorInput}
            setSimulatorInput={setSimulatorInput}
          />
        )}
        {currentView === 'consult-delivery-estimate' && (
          <DeliveryRequestView
            mode="estimate"
            setView={setCurrentView}
            simulatorInput={simulatorInput}
            formData={estimateFormData}
            setFormData={setEstimateFormData}
          />
        )}
        {currentView === 'consult-delivery-order' && (
          <DeliveryRequestView
            mode="order"
            setView={setCurrentView}
            simulatorInput={simulatorInput}
            formData={orderFormData}
            setFormData={setOrderFormData}
          />
        )}
        {currentView === 'register' && <RegisterView setView={setCurrentView} />}
        {currentView === 'terms' && <TermsView setView={setCurrentView} />}
        {currentView === 'privacy' && <PrivacyView setView={setCurrentView} />}
        {currentView === 'notice' && <NoticeView setView={setCurrentView} />}
        {currentView === 'driver-notice' && <DriverNoticeView setView={setCurrentView} />}
      </main>

      <footer className="text-center py-12 text-xs text-slate-400 space-y-2 mt-20 border-t border-slate-200">
        <p>{SITE_NAME} | 山口県下関市を中心に</p>
        <p>配送相談・協力ドライバー登録の窓口</p>
        <p>LINEは補助導線、受付完了はフォーム送信が正本です</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
          <button
            type="button"
            onClick={() => setCurrentView('terms')}
            className="hover:text-slate-600 underline"
          >
            利用案内
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('privacy')}
            className="hover:text-slate-600 underline"
          >
            プライバシーポリシー
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('notice')}
            className="hover:text-slate-600 underline"
          >
            ご利用上の注意
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('driver-notice')}
            className="hover:text-slate-600 underline"
          >
            協力ドライバー登録について
          </button>
        </div>
      </footer>
    </div>
  );
}

function TopView({ setView }: { setView: (view: ViewState) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16"
    >
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
                  <img
                    src={LOGO_IMAGE_URL}
                    alt={`${SITE_NAME} ロゴ`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-black tracking-[0.24em] text-slate-500">
                    SHIMONOSEKI TRANSPORT
                  </p>
                  <p className="text-sm font-bold text-slate-700">配送相談・協力ドライバー登録窓口</p>
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] drop-shadow-sm">
                <span className="block">下関市中心。</span>
                <span className="block">配送相談も、</span>
                <span className="block">ドライバー登録も。</span>
              </h1>

              <p className="text-base md:text-xl text-slate-700 max-w-xl leading-relaxed font-medium">
                軽貨物TAKEは、配送相談の受付と協力ドライバー登録の窓口です。
                <br className="hidden md:block" />
                登録しても個人は公開せず、案件に応じて運営よりご連絡します。
              </p>

              <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
                {[
                  {
                    title: '審査済みドライバー在籍',
                    desc: '書類確認済み。案件ごとにご案内します。'
                  },
                  {
                    title: '公開名簿なし',
                    desc: '登録してもサイトで個人を一覧公開しません。'
                  },
                  {
                    title: 'LINEでも補助相談可',
                    desc: '受付の正本はフォーム送信です。'
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="bg-white/78 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-800 text-sm leading-tight">
                        {item.title}
                      </span>
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
                  配送の相談をする
                </button>
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="bg-slate-800 text-white px-10 py-5 rounded-2xl font-black text-lg md:text-xl hover:bg-slate-900 transition-all shadow-lg flex items-center gap-3 group w-full sm:w-auto justify-center"
                >
                  <UserPlus size={24} className="group-hover:scale-110 transition-transform" />
                  協力ドライバー登録
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          type="button"
          className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border-2 border-transparent hover:border-[#52a285] transition-all text-left group"
          onClick={() => setView('simulator')}
        >
          <div className="w-16 h-16 bg-[#e6f0ec] rounded-2xl flex items-center justify-center text-[#52a285] mb-6 group-hover:scale-110 transition-transform">
            <Truck size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">お客様向け</h3>
          <p className="text-slate-600 mb-8">
            配送相談・見積依頼・正式依頼はこちらから。
          </p>
          <div className="bg-[#52a285] text-white px-6 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 group-hover:bg-[#3d7a64] transition-colors">
            すぐ運賃計算へ進む
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
          <h3 className="text-2xl font-bold text-slate-800 mb-4">ドライバー向け</h3>
          <p className="text-slate-600 mb-8">
            協力ドライバー登録はこちらから。
          </p>
          <div className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 group-hover:bg-slate-900 transition-colors">
            すぐ登録フォームへ進む
          </div>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="bg-amber-50 text-amber-700 text-xs px-3 py-1 rounded-full font-bold border border-amber-100">
            車両の購入・修理のご相談も対応
          </span>
          <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full font-bold border border-slate-200">
            配送以外の相談もOK
          </span>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-3">
          営業用の軽バン探し・乗り換え・修理のご相談も受けています
        </h3>

        <p className="text-slate-600 leading-relaxed mb-6">
          車両の購入・修理のご相談も受付しています。ご希望の車種、予算、修理内容などは
          配送相談フォームの備考に書いてください。内容を確認して、運営よりご連絡します。
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setView('simulator')}
            className="bg-[#52a285] text-white px-6 py-4 rounded-2xl font-bold hover:bg-[#3d7a64] transition-colors"
          >
            車両の相談をする
          </button>

          <a
            href={LINE_FRIEND_ADD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-slate-700 px-6 py-4 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors text-center"
          >
            LINEで補助相談する
          </a>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          ※正式な受付・記録はフォーム送信が正本です。LINEは補助導線です。
        </p>
      </div>
    </motion.div>
  );
}

function CustomerTopView({ setView }: { setView: (view: ViewState) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <button
        type="button"
        onClick={() => setView('top')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4"
      >
        <ArrowLeft size={16} /> トップに戻る
      </button>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6 flex items-center gap-4">
        <div className="bg-[#e6f0ec] p-3 rounded-xl text-[#52a285]">
          <Truck size={28} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">配送相談</h1>
      </div>

      <button
        type="button"
        onClick={() => setView('simulator')}
        className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-[#52a285] text-left transition-all"
      >
        <h3 className="font-bold text-lg mb-2 text-slate-800">運賃計算器から進む</h3>
        <p className="text-sm text-slate-500">
          概算を確認してから、見積依頼フォームまたは正式依頼フォームへ進めます。
        </p>
      </button>
    </motion.div>
  );
}

function DriverTopView({ setView }: { setView: (view: ViewState) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <button
        type="button"
        onClick={() => setView('top')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4"
      >
        <ArrowLeft size={16} /> トップに戻る
      </button>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6 flex items-center gap-4">
        <div className="bg-slate-100 p-3 rounded-xl text-slate-700">
          <UserPlus size={28} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">協力ドライバー登録</h1>
      </div>

      <button
        type="button"
        onClick={() => setView('register')}
        className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-800 text-left transition-all"
      >
        <h3 className="font-bold text-lg mb-2 text-slate-800">協力ドライバー登録フォーム</h3>
        <p className="text-sm text-slate-500">
          登録無料。顔出しなし。審査のうえ条件が合えば運営よりご連絡します。
        </p>
      </button>
    </motion.div>
  );
}

function TermsView({ setView }: { setView: (view: ViewState) => void }) {
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

function PrivacyView({ setView }: { setView: (view: ViewState) => void }) {
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

function NoticeView({ setView }: { setView: (view: ViewState) => void }) {
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

function DriverNoticeView({ setView }: { setView: (view: ViewState) => void }) {
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

function SimulatorView({
  setView,
  simulatorInput,
  setSimulatorInput
}: {
  setView: (view: ViewState) => void;
  simulatorInput: SimulatorInput;
  setSimulatorInput: React.Dispatch<React.SetStateAction<SimulatorInput>>;
}) {
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const checkWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=33.9578&longitude=130.9415&current_weather=true'
        );
        const data = await res.json();
        const code = Number(data?.current_weather?.weathercode);
        const rainyCodes = [51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99];
        if (rainyCodes.includes(code)) {
          setSimulatorInput((prev) => ({ ...prev, weather: '雨/雪' }));
        }
      } catch {
        // no-op
      }
    };

    checkWeather();
  }, [setSimulatorInput]);

  const fare = useMemo(() => calculateFare(simulatorInput), [simulatorInput]);

  const update = (partial: Partial<SimulatorInput>) => {
    setSimulatorInput((prev) => ({ ...prev, ...partial }));
  };

  const fillTestData = () => {
    const base = defaultSimulatorInput();
    setSimulatorInput({
      ...base,
      origin: '山口県下関市竹崎町4-4-8',
      destination: '福岡県北九州市小倉北区浅野1-1-1',
      distance: '15',
      cargoSize: '中',
      cargoDetail: 'テスト荷物（段ボール2箱）',
      preferredDate: base.preferredDate,
      memo: 'テスト送信です',
      vehicleCount: '1',
      extraWorkers: '0',
      speedType: '通常便',
      weather: '晴れ/曇り',
      stairsLoad: '1',
      stairsUnload: '1',
      walkDistLoad: '20',
      walkDistUnload: '20',
      waitTimeLoad: '0',
      waitTimeUnload: '0'
    });
  };

  const requiredOk =
    simulatorInput.origin.trim() &&
    simulatorInput.destination.trim() &&
    simulatorInput.distance.trim() &&
    simulatorInput.cargoDetail.trim() &&
    simulatorInput.preferredDate.trim();

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報に対応していません。');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${pos.coords.longitude}&y=${pos.coords.latitude}`
          );
          const data = await res.json();
          const loc = data?.response?.location?.[0];
          if (loc) {
            update({ origin: `${loc.prefecture}${loc.city}${loc.town}` });
          } else {
            alert('現在地の住所が見つかりませんでした。');
          }
        } catch {
          alert('現在地の取得に失敗しました。');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        alert('位置情報の取得を許可してください。');
        setIsLocating(false);
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <button
        type="button"
        onClick={() => setView('top')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm"
      >
        <ArrowLeft size={16} /> トップに戻る
      </button>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
            <Zap size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">運賃計算器</h2>
            <p className="text-sm text-slate-500">入力内容は保持されます。戻っても消えません。</p>
          </div>
        </div>

        <DevTestBar onFill={fillTestData} />

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">集荷先</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simulatorInput.origin}
                  onChange={(e) => update({ origin: e.target.value })}
                  placeholder="例：山口県下関市〇〇"
                  className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                  className="bg-slate-100 text-slate-600 px-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
                >
                  <MapPin size={14} />
                  {isLocating ? '取得中' : '現在地'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">納品先</label>
              <input
                type="text"
                value={simulatorInput.destination}
                onChange={(e) => update({ destination: e.target.value })}
                placeholder="例：福岡県福岡市〇〇"
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-blue-900">走行距離（km）</label>
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                  simulatorInput.origin
                )}&destination=${encodeURIComponent(simulatorInput.destination)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-4 py-2 rounded-full shadow-sm transition-all"
                onClick={(e) => {
                  if (!simulatorInput.origin || !simulatorInput.destination) {
                    e.preventDefault();
                    alert('集荷先と納品先を入力してください。');
                  }
                }}
              >
                <MapPin size={14} /> Googleマップで距離を調べる ↗
              </a>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_ROUTES.map((route) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() =>
                    update({
                      origin: route.origin,
                      destination: route.destination,
                      distance: route.dist
                    })
                  }
                  className="text-[10px] font-bold bg-white text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                >
                  {route.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                value={simulatorInput.distance}
                onChange={(e) => update({ distance: e.target.value })}
                placeholder="例：15"
                className="w-full p-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white font-mono text-lg"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 font-bold">
                km
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">荷物量</label>
              <select
                value={simulatorInput.cargoSize}
                onChange={(e) =>
                  update({ cargoSize: e.target.value as SimulatorInput['cargoSize'] })
                }
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="小">小</option>
                <option value="中">中</option>
                <option value="大">大</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">希望日時</label>
              <input
                type="datetime-local"
                value={simulatorInput.preferredDate}
                onChange={(e) => update({ preferredDate: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">荷物内容</label>
            <textarea
              rows={3}
              value={simulatorInput.cargoDetail}
              onChange={(e) => update({ cargoDetail: e.target.value })}
              placeholder="例：段ボール10箱、折りたたみ机1台、椅子2脚"
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">備考</label>
            <textarea
              rows={3}
              value={simulatorInput.memo}
              onChange={(e) => update({ memo: e.target.value })}
              placeholder="例：午前中希望、建物前に一時停車可、車両購入や修理の相談内容など"
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">配送スピード</label>
              <select
                value={simulatorInput.speedType}
                onChange={(e) =>
                  update({ speedType: e.target.value as SimulatorInput['speedType'] })
                }
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="通常便">通常便</option>
                <option value="お急ぎ便">お急ぎ便</option>
                <option value="超特急便">超特急便</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">車両台数</label>
              <select
                value={simulatorInput.vehicleCount}
                onChange={(e) => update({ vehicleCount: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="1">1台</option>
                <option value="2">2台</option>
                <option value="3">3台</option>
                <option value="4">4台</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">追加作業員</label>
              <select
                value={simulatorInput.extraWorkers}
                onChange={(e) => update({ extraWorkers: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="0">不要</option>
                <option value="1">1名追加</option>
                <option value="2">2名追加</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <OptionBlock
              title="集荷先の状況"
              stairs={simulatorInput.stairsLoad}
              setStairs={(v) => update({ stairsLoad: v })}
              walkDistance={simulatorInput.walkDistLoad}
              setWalkDistance={(v) => update({ walkDistLoad: v })}
              waitTime={simulatorInput.waitTimeLoad}
              setWaitTime={(v) => update({ waitTimeLoad: v })}
            />
            <OptionBlock
              title="納品先の状況"
              stairs={simulatorInput.stairsUnload}
              setStairs={(v) => update({ stairsUnload: v })}
              walkDistance={simulatorInput.walkDistUnload}
              setWalkDistance={(v) => update({ walkDistUnload: v })}
              waitTime={simulatorInput.waitTimeUnload}
              setWaitTime={(v) => update({ waitTimeUnload: v })}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-slate-800">天候</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="weather"
                  checked={simulatorInput.weather === '晴れ/曇り'}
                  onChange={() => update({ weather: '晴れ/曇り' })}
                  className="accent-[#52a285]"
                />
                晴れ/曇り
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="weather"
                  checked={simulatorInput.weather === '雨/雪'}
                  onChange={() => update({ weather: '雨/雪' })}
                  className="accent-[#52a285]"
                />
                雨/雪
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-900 p-6 rounded-3xl text-center text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />
          <p className="text-xs font-bold text-slate-400 mb-2">概算見積額（税込・入力に応じて更新）</p>
          <div className="text-5xl font-black text-emerald-400 mb-2">
            ¥{fare.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">
            ※実際の荷物量や現地状況により変動する場合があります
          </p>
        </div>

        {!requiredOk && (
          <p className="text-xs text-red-500 font-bold mt-4 flex items-center gap-1">
            <Info size={12} />
            集荷先・納品先・距離・荷物内容・希望日時を入れてください。
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <button
            type="button"
            onClick={() => {
              if (!requiredOk) return;
              setView('consult-delivery-estimate');
            }}
            disabled={!requiredOk}
            className="w-full bg-slate-800 text-white font-black py-5 rounded-2xl hover:bg-slate-900 transition-all shadow-lg text-lg disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            この内容で見積依頼する
          </button>

          <button
            type="button"
            onClick={() => {
              if (!requiredOk) return;
              setView('consult-delivery-order');
            }}
            disabled={!requiredOk}
            className="w-full bg-[#52a285] text-white font-black py-5 rounded-2xl hover:bg-[#3d7a64] transition-all shadow-lg shadow-emerald-100 text-lg disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            この内容で依頼する
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function OptionBlock({
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

function DeliveryRequestView({
  mode,
  setView,
  simulatorInput,
  formData,
  setFormData
}: {
  mode: 'estimate' | 'order';
  setView: (view: ViewState) => void;
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
        if (address) {
          setFormData((prev) => ({ ...prev, address }));
        }
      } catch {
        // no-op
      }
    }
  };

  const summaryText = useMemo(() => {
    return [
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
      '※フォーム送信で受付完了です。'
    ]
      .filter(Boolean)
      .join('\n');
  }, [fare, formData.name, receiptNo, requestLabel, simulatorInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (!isValid) {
      const firstInvalid = document.querySelector('.invalid-field');
      if (firstInvalid instanceof HTMLElement) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            <p className="text-sm text-slate-500 mt-1">
              フォーム送信が正本です。LINEは補助です。
            </p>
          </div>
          <div className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
            {requestLabel}
          </div>
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
            <SummaryItem
              label="希望日時"
              value={simulatorInput.preferredDate.replace('T', ' ')}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">荷物内容</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {simulatorInput.cargoDetail}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">備考</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {simulatorInput.memo || 'なし'}
            </p>
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
                  showErrors && !termsAgreed
                    ? 'invalid-field outline outline-2 outline-red-500 outline-offset-2'
                    : 'text-[#52a285]'
                }`}
              />
              <span
                className={`text-sm font-bold ${
                  showErrors && !termsAgreed ? 'text-red-500' : 'text-slate-800'
                }`}
              >
                {isEstimate
                  ? '軽貨物TAKEが配送相談の窓口であること、確認・ご連絡のため個人情報を利用すること、案件に応じて協力ドライバーに必要最小限の情報を共有する場合があることに同意します'
                  : '軽貨物TAKEが依頼受付・紹介・調整の窓口であること、確認連絡のため個人情報を利用すること、案件に応じて協力ドライバーに必要最小限の情報を共有する場合があることに同意します'}
                <Badge type="required" />
                <button
                  type="button"
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="block mt-1 text-xs text-[#52a285] hover:underline"
                >
                  利用案内・プライバシーポリシー・ご利用上の注意を読む
                </button>
              </span>
            </label>
            {showErrors && !termsAgreed && (
              <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1">
                <Info size={12} />
                同意が必要です
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

          <div className="flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold">フォーム送信が正式受付です</span>
          </div>
        </form>
      </div>

      {showPrivacyPolicy && (
        <Modal onClose={() => setShowPrivacyPolicy(false)}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">
              利用案内・プライバシー・ご利用上の注意
            </h3>
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh] pr-4 space-y-6 text-sm text-slate-600 leading-relaxed">
            <section>
              <h4 className="font-bold text-slate-800 mb-2">窓口・紹介・調整</h4>
              <p>
                軽貨物TAKEは配送相談の受付および紹介・調整の窓口です。案件に応じて協力ドライバーに必要最小限の情報を共有する場合があります。
              </p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-2">個人情報の取扱い</h4>
              <p>氏名・住所・電話番号・メールアドレス等は、受付確認とご連絡のために利用します。</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-2">概算見積について</h4>
              <p>
                運賃計算器の金額は概算です。実際の荷物量や現地状況により変動する場合があります。
              </p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 mb-2">変更・キャンセル</h4>
              <p>
                正式依頼後の変更・キャンセルは、状況に応じてご相談となります。確定前にご連絡します。
              </p>
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
            {mode === 'estimate' ? '見積依頼を受け付けました' : '依頼を受け付けました'}
          </h3>

          <p className="text-slate-600 mb-4 text-sm">
            フォーム送信で受付完了です。ご連絡は原則メールで行います。LINEは補助です。
          </p>

          <p className="text-slate-500 text-xs mb-4">
            受付番号: <span className="font-bold text-emerald-600">{receiptNo}</span>
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-left">
            <p className="text-xs font-bold text-slate-500 mb-2">受付要約</p>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans break-words">
              {summaryText}
            </pre>
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
            <p className="text-xs font-bold text-slate-500 mb-3">
              LINEで続けてやり取りしたい方（任意）
            </p>

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
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  スマホでQRコードを読み取ると、LINEでもやり取りしやすくなります。
                </p>
                <div className="flex justify-center">
                  <img
                    src={LINE_QR_URL}
                    alt={`${LINE_ACCOUNT_NAME} QR`}
                    className="w-28 h-28 border border-slate-200 rounded-xl"
                  />
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
          <p className="text-slate-600 mb-6 text-sm">
            通信状況をご確認のうえ、もう一度お試しください。
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

function RegisterView({ setView }: { setView: (view: ViewState) => void }) {
  const [formData, setFormData] = useState<DriverRegisterFormData>(() =>
    loadLocalStorage(DRIVER_REGISTER_FORM_STORAGE_KEY, defaultDriverRegisterFormData())
  );
  const [files, setFiles] = useState<DriverFiles>(() =>
    loadLocalStorage(DRIVER_REGISTER_FILES_STORAGE_KEY, {} as DriverFiles)
  );
  const [fileNames, setFileNames] = useState<DriverFileNames>(() =>
    loadLocalStorage(DRIVER_REGISTER_FILE_NAMES_STORAGE_KEY, {} as DriverFileNames)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const isMobile = isMobileDevice();

  useEffect(() => {
    saveLocalStorage(DRIVER_REGISTER_FORM_STORAGE_KEY, formData);
  }, [formData]);

  useEffect(() => {
    saveLocalStorage(DRIVER_REGISTER_FILES_STORAGE_KEY, files);
  }, [files]);

  useEffect(() => {
    saveLocalStorage(DRIVER_REGISTER_FILE_NAMES_STORAGE_KEY, fileNames);
  }, [fileNames]);

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
    const testFileNames: DriverFileNames = {};
    DRIVER_DOC_REQUIRED.forEach((d) => {
      testFiles[d.key] = TEST_IMAGE_DATA_URL;
      testFileNames[d.key] = `${d.driveName}.png`;
    });
    setFiles(testFiles);
    setFileNames(testFileNames);
    setSubmitError('');
  };

  const requiredFilesOk = DRIVER_DOC_REQUIRED.every((d) => !!files[d.key]);
  const uploadedRequiredCount = DRIVER_DOC_REQUIRED.filter((d) => !!files[d.key]).length;

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
        if (address) {
          setFormData((prev) => ({ ...prev, address }));
        }
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      clearLocalStorage(DRIVER_REGISTER_FORM_STORAGE_KEY);
      clearLocalStorage(DRIVER_REGISTER_FILES_STORAGE_KEY);
      clearLocalStorage(DRIVER_REGISTER_FILE_NAMES_STORAGE_KEY);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      setSubmitError(
        '送信に失敗しました。入力内容と選択済みファイル名は保持されています。通信環境をご確認のうえ、そのまま再送してください。'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <span className="bg-[#e6f0ec] text-[#3d7a64] text-xs px-2 py-1 rounded font-bold">
            協力ドライバー登録
          </span>
          <span className="text-slate-500 text-xs flex items-center gap-1">
            <Info size={14} />
            送信に少し時間がかかる場合があります
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
          協力ドライバー登録フォーム
        </h1>
        <p className="text-slate-600 text-sm">
          登録してもサイト上に個人を公開しません。審査のうえ、案件に応じて運営よりご連絡します。
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">
            必須書類 {uploadedRequiredCount} / {DRIVER_DOC_REQUIRED.length}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">
            入力内容は保持されます
          </span>
        </div>
      </div>

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <Info size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-1">送信できませんでした</p>
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
              <p className="mt-1">
                書類画像が多いため、30秒前後かかることがあります。画面を閉じず、そのままお待ちください。
              </p>
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
                メーカー <Badge type="required" />
              </label>
              <select
                value={formData.maker}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, maker: e.target.value, model: '' }))
                }
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
                車種 <Badge type="required" />
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                disabled={!formData.maker}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {formData.maker ? '選択してください' : 'メーカーを選択してください'}
                </option>
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
                経験年数 <Badge type="required" />
              </label>
              <select
                value={formData.experience}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, experience: e.target.value }))
                }
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

        <SectionCard
          title="書類アップロード"
          icon={<ShieldCheck className="text-[#52a285]" size={22} />}
        >
          <p className="text-sm text-slate-600 mb-2">
            必須6種：免許証（表・裏）、車検証、任意保険、貨物軽自動車運送事業経営届出書、車両前面写真（黒ナンバー入り）
          </p>
          <p className="text-xs text-slate-400 mb-4">
            選択したファイル名は保持されます。送信失敗時もそのまま再送しやすくしています。
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {DRIVER_DOC_REQUIRED.map((d, i) => (
              <React.Fragment key={`req-${i}`}>
                <FileUpload
                  label={d.label}
                  required
                  initialFileName={fileNames[d.key]}
                  onFileSelect={(base64, name) => {
                    setFiles((prev) => ({ ...prev, [d.key]: base64 }));
                    setFileNames((prev) => ({ ...prev, [d.key]: name }));
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
                  onFileSelect={(base64, name) => {
                    setFiles((prev) => ({ ...prev, [d.key]: base64 }));
                    setFileNames((prev) => ({ ...prev, [d.key]: name }));
                    setSubmitError('');
                  }}
                />
              </React.Fragment>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="送信" icon={<Send className="text-[#52a285]" size={22} />}>
          <div className="bg-[#fcfaf2] border border-amber-200 rounded-xl p-6 text-sm text-slate-600 space-y-2 mb-6">
            <p>・登録は審査制です。サイト上に氏名・プロフィールは公開しません。</p>
            <p>
              ・入力内容・書類は連絡・審査・案件マッチングのために利用します。案件に応じて必要最小限の情報をお客様側に共有する場合があります。
            </p>
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
            <p className="text-xs text-red-500 font-bold mb-4">
              ※必須項目・必須ファイル・同意チェックを確認してください。
            </p>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full font-bold text-lg py-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 ${
              isFormValid && !isSubmitting
                ? 'bg-[#3d7a64] text-white hover:bg-[#2d5a4a]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
            {isSubmitting ? '画像を送信中…少しお待ちください' : '送信する（登録）'}
          </button>
        </SectionCard>
      </form>

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
            <p className="text-xs font-bold text-slate-500 mb-3">
              LINEで続けてやり取りしたい方（任意）
            </p>
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
                <img
                  src={LINE_QR_URL}
                  alt={`${LINE_ACCOUNT_NAME} QR`}
                  className="w-28 h-28 border border-slate-200 rounded-xl"
                />
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

function SectionCard({
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

function SummaryItem({
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

function FormInput({
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

function Modal({
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

function FileUpload({
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
        <span className="text-sm text-slate-400 truncate">
          {fileName || '選択されていません'}
        </span>
      </div>

      {fileName && (
        <p className="text-[11px] text-emerald-700 mt-2 font-bold">選択中: {fileName}</p>
      )}

      {errorMsg && <p className="text-xs text-red-500 mt-2 font-bold">{errorMsg}</p>}
    </div>
  );
}

function Badge({ type }: { type: 'required' | 'optional' }) {
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

function DevTestBar({ onFill }: { onFill: () => void }) {
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
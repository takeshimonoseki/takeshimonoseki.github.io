import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Car, 
  Wrench, 
  MessageCircle, 
  UserPlus, 
  CheckCircle2,
  Send,
  Info,
  User,
  Truck,
  ShieldCheck,
  Landmark,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Zap,
  Trash2,
  CloudRain,
  Calendar,
  Users,
  Mail,
  AlertCircle
} from 'lucide-react';

type ViewState = 'top' | 'customer' | 'driver' | 'simulator' | 'consult-delivery' | 'register' | 'consult-vehicle' | 'consult-business' | 'consult-vehicle-buy' | 'consult-vehicle-repair' | 'consult-vehicle-inspect' | 'takesan-log';

const PROFILE_IMAGE_URL = `${import.meta.env.BASE_URL}images/profile.jpg`;
const HERO_BG_URL = `${import.meta.env.BASE_URL}images/hero-bg.jpg`;
const VAN_IMAGE_URL = `${import.meta.env.BASE_URL}images/van.jpg`;
const LINE_QR_URL = `${import.meta.env.BASE_URL}images/line-qr.png`;

// --- Data Constants ---
const KEI_MAKERS = {
  'ダイハツ': ['ハイゼットカーゴ', 'ハイゼットトラック', 'アトレー', 'ミラ', 'タント', 'ムーヴ', 'ウェイク', 'その他'],
  'スズキ': ['エブリイ', 'キャリイ', 'アルト', 'スペーシア', 'ハスラー', 'ワゴンR', 'ジムニー', 'その他'],
  'ホンダ': ['N-VAN', 'アクティ', 'N-BOX', 'N-WGN', 'N-ONE', 'その他'],
  '日産': ['NV100クリッパー', 'NT100クリッパー', 'ルークス', 'デイズ', 'サクラ', 'その他'],
  '三菱': ['ミニキャブバン', 'ミニキャブトラック', 'eKスペース', 'eKワゴン', 'その他'],
  'スバル': ['サンバーバン', 'サンバートラック', 'プレオ', 'ステラ', 'その他'],
  'マツダ': ['スクラムバン', 'スクラムトラック', 'フレア', 'キャロル', 'その他'],
  'トヨタ': ['ピクシスバン', 'ピクシストラック', 'ピクシスエポック', 'その他'],
};

const ALL_VEHICLE_DATA: Record<string, string[]> = {
  'トヨタ': ['ヤリス', 'アクア', 'プリウス', 'シエンタ', 'ルーミー', 'アルファード', 'ノア', 'ヴォクシー', 'ハイエース', 'プロボックス', 'タウンエース', 'その他'],
  'ホンダ': ['N-BOX', 'フィット', 'フリード', 'ステップワゴン', 'ヴェゼル', 'N-VAN', 'アクティ', 'その他'],
  '日産': ['ノート', 'セレナ', 'ルークス', 'エクストレイル', 'NV350キャラバン', 'NV100クリッパー', 'その他'],
  'スズキ': ['エブリイ', 'キャリイ', 'スペーシア', 'ハスラー', 'ワゴンR', 'ジムニー', 'スイフト', 'その他'],
  'ダイハツ': ['ハイゼットカーゴ', 'ハイゼットトラック', 'タント', 'ムーヴ', 'ミラ', 'アトレー', 'その他'],
  'マツダ': ['MAZDA2', 'MAZDA3', 'CX-5', 'スクラムバン', 'スクラムトラック', 'その他'],
  'スバル': ['インプレッサ', 'フォレスター', 'サンバーバン', 'サンバートラック', 'その他'],
  '三菱': ['デリカD:5', 'アウトランダー', 'ミニキャブバン', 'ミニキャブトラック', 'その他'],
  'いすゞ': ['エルフ', 'フォワード', 'ギガ', 'その他'],
  '日野': ['デュトロ', 'レンジャー', 'プロフィア', 'その他'],
  '三菱ふそう': ['キャンター', 'ファイター', 'スーパーグレート', 'その他'],
  'メルセデス・ベンツ': ['Aクラス', 'Cクラス', 'Eクラス', 'Gクラス', 'その他'],
  'BMW': ['1シリーズ', '3シリーズ', '5シリーズ', 'Xシリーズ', 'その他'],
  'アウディ': ['A3', 'A4', 'Q3', 'Q5', 'その他'],
  'フォルクスワーゲン': ['ゴルフ', 'ポロ', 'ティグアン', 'その他'],
  'ボルボ': ['V60', 'XC40', 'XC60', 'その他'],
  'プジョー': ['208', '308', '2008', 'その他'],
  'ポルシェ': ['911', 'マカン', 'カイエン', 'その他'],
  'その他': ['その他']
};

const BODY_COLORS = [
  'ホワイト系', 'ブラック系', 'シルバー系', 'グレー系', 'レッド系', 
  'ブルー系', 'イエロー系', 'グリーン系', 'ブラウン系', 'その他', 'こだわらない'
];

const BANKS_DATA: Record<string, string[]> = {
  '0001 みずほ銀行': ['001 本店', '002 丸の内支店', '003 銀座支店', '004 新宿支店', '005 渋谷支店', 'その他'],
  '0005 三菱UFJ銀行': ['001 本店', '002 丸の内支店', '003 銀座支店', '004 新宿支店', '005 渋谷支店', 'その他'],
  '0009 三井住友銀行': ['001 本店営業部', '002 丸の内支店', '003 銀座支店', '004 新宿支店', '005 渋谷支店', 'その他'],
  '0010 りそな銀行': ['001 本店', '002 秋葉原支店', '003 池袋支店', 'その他'],
  '0017 埼玉りそな銀行': ['001 本店', '002 浦和支店', 'その他'],
  '0033 PayPay銀行': ['001 本店', '002 すずめ支店', '003 はやぶさ支店', '004 ふくろう支店', '005 ペンギン支店', '006 フラミンゴ支店', 'その他'],
  '0036 楽天銀行': ['201 ジャズ支店', '202 ロック支店', '203 ワルツ支店', '204 オペラ支店', '205 タンゴ支店', '206 サルサ支店', '207 ダンス支店', '208 リズム支店', '209 ビート支店', '210 マーチ支店', '211 ピアノ支店', '212 ドラム支店', '213 チェロ支店', '214 ソナタ支店', 'その他'],
  '0038 住信SBIネット銀行': ['101 イチゴ支店', '102 ブドウ支店', '103 ミカン支店', '104 レモン支店', '105 リンゴ支店', '106 バナナ支店', '107 メロン支店', '108 キウイ支店', 'その他'],
  '0039 auじぶん銀行': ['101 本店', '201 あか支店', '202 だいだいいろ支店', '203 きいろ支店', '204 みどり支店', '205 あお支店', '206 あいいろ支店', '207 むらさき支店', 'その他'],
  '0040 イオン銀行': ['001 本店', 'その他'],
  '0117 山口銀行': ['001 本店営業部', '002 下関支店', '003 宇部支店', '004 萩支店', '005 徳山支店', '006 防府支店', '007 岩国支店', 'その他'],
  '0118 もみじ銀行': ['001 本店営業部', 'その他'],
  '0119 西京銀行': ['001 本店営業部', '002 下関支店', '003 宇部支店', 'その他'],
  '0150 広島銀行': ['001 本店営業部', 'その他'],
  '0177 福岡銀行': ['001 本店営業部', 'その他'],
  '0190 西日本シティ銀行': ['001 本店営業部', 'その他'],
  '0149 北九州銀行': ['001 本店営業部', 'その他'],
  '0116 百十四銀行': ['001 本店営業部', 'その他'],
  '0114 伊予銀行': ['001 本店営業部', 'その他'],
  '0153 百五銀行': ['001 本店営業部', 'その他'],
  '0152 京都銀行': ['001 本店営業部', 'その他'],
  '0138 滋賀銀行': ['001 本店営業部', 'その他'],
  '0129 大垣共立銀行': ['001 本店営業部', 'その他'],
  '0113 四国銀行': ['001 本店営業部', 'その他'],
  '0181 佐賀銀行': ['001 本店営業部', 'その他'],
  '0182 十八親和銀行': ['001 本店営業部', 'その他'],
  '0183 肥後銀行': ['001 本店営業部', 'その他'],
  '0184 大分銀行': ['001 本店営業部', 'その他'],
  '0185 宮崎銀行': ['001 本店営業部', 'その他'],
  '0187 鹿児島銀行': ['001 本店営業部', 'その他'],
  '0188 琉球銀行': ['001 本店営業部', 'その他'],
  '0189 沖縄銀行': ['001 本店営業部', 'その他'],
  '9900 ゆうちょ銀行': ['018 〇一八', '028 〇二八', '038 〇三八', '048 〇四八', '058 〇五八', '068 〇六八', '078 〇七八', '088 〇八八', '098 〇九八', '108 一〇八', '118 一一八', '128 一二八', '138 一三八', '148 一四八', '158 一五八', '168 一六八', '178 一七八', '188 一八八', '198 一九八', 'その他'],
};

const GAS_URL = 'https://script.google.com/macros/s/AKfycby75uR-03pmmMZPJJ5gcIsUM4HVKGxFAssCu6XZXiSsRiXEen2LEcK6kGHgA67KtHH2Mg/exec';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('top');
  const [simulatorData, setSimulatorData] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[#f4f7f6] font-sans text-slate-800">
      {/* Header */}
      <header className="bg-[#f4f7f6] border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Area */}
            <div 
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => setCurrentView('top')}
            >
              <div className="flex flex-col items-center justify-center border border-slate-300 rounded-full w-12 h-12 bg-white text-[10px] font-bold text-slate-500 leading-tight">
                <span>YAMAGUCHI</span>
                <span>山口県</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-slate-200 shadow-sm">
                  <img src={PROFILE_IMAGE_URL} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter text-slate-800 leading-none">軽貨物TAKE</span>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase">Matching Portal</span>
                </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <span className="text-slate-400 text-xs border-r border-slate-300 pr-6">takeshimonoseki@gmail.com</span>
              <button onClick={() => setCurrentView('top')} className={`hover:text-[#52a285] transition-colors ${currentView === 'top' ? 'text-[#52a285]' : ''}`}>トップ</button>
              <button onClick={() => setCurrentView('customer')} className={`hover:text-[#52a285] transition-colors ${currentView === 'customer' ? 'text-[#52a285]' : ''}`}>お客様向け</button>
              <button onClick={() => setCurrentView('driver')} className={`hover:text-[#52a285] transition-colors ${currentView === 'driver' ? 'text-[#52a285]' : ''}`}>ドライバー向け</button>
              
              {/* Header QR Code */}
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm ml-2">
                <img src={LINE_QR_URL} alt="LINE QR" className="w-10 h-10" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 leading-none mb-0.5">LINE公式</span>
                  <a href="https://lin.ee/lTCUeadq" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#06C755] hover:underline flex items-center gap-1">
                    <MessageCircle size={12} className="fill-[#06C755] text-white" /> 友達追加
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentView === 'top' && <TopView setView={setCurrentView} />}
        {currentView === 'customer' && <CustomerTopView setView={setCurrentView} />}
        {currentView === 'driver' && <DriverTopView setView={setCurrentView} />}
        {currentView === 'simulator' && <SimulatorView setView={setCurrentView} setSimulatorData={setSimulatorData} />}
        {currentView === 'consult-delivery' && <ConsultDeliveryView setView={setCurrentView} simulatorData={simulatorData} />}
        {currentView === 'register' && <RegisterView setView={setCurrentView} />}
        {currentView === 'consult-vehicle' && <ConsultVehicleView setView={setCurrentView} />}
        {currentView === 'consult-vehicle-buy' && <ConsultVehicleBuyView setView={setCurrentView} />}
        {currentView === 'consult-vehicle-repair' && <ConsultVehicleRepairView setView={setCurrentView} />}
        {currentView === 'consult-vehicle-inspect' && <ConsultVehicleInspectView setView={setCurrentView} />}
        {currentView === 'consult-business' && <ConsultBusinessView setView={setCurrentView} />}
        {currentView === 'takesan-log' && <TakesanLogView setView={setCurrentView} />}
      </main>

      {/* Footer */}
      <footer className="text-center py-12 text-xs text-slate-400 space-y-2 mt-20">
        <p>軽貨物TAKE | 協力ドライバー登録プール（山口県）</p>
        <p>電話誘導はありません（LINE / メール）。</p>
        <p className="underline cursor-pointer hover:text-slate-600">プライバシー・個人情報の取扱い</p>
      </footer>

      {/* Floating LINE Button */}
      <a 
        href="https://lin.ee/lTCUeadq" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[100] bg-[#06C755] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <MessageCircle size={32} />
        <span className="absolute right-full mr-4 bg-white text-[#06C755] px-4 py-2 rounded-xl text-sm font-black shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-100">
          LINEで相談する
        </span>
      </a>
    </div>
  );
}

function TopView({ setView }: { setView: (view: ViewState) => void }) {
  const scrollToProfile = () => {
    const el = document.getElementById('take-profile');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16"
    >
      {/* Hero Section: Cooperative Driver Registration Pool */}
      <div className="relative overflow-hidden rounded-[3rem] bg-white py-16 px-8 md:px-16 text-center shadow-xl border border-slate-100">
        <div className="absolute inset-0">
          <img 
            src={HERO_BG_URL} 
            alt="Background" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/20"></div>
        </div>
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
            <Users size={14} /> 山口県下関市拠点 軽貨物ネットワーク
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            協力ドライバー<br className="md:hidden"/>登録プール
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            「軽貨物TAKE」では、山口県内および近郊で活動可能な協力ドライバー様を募集しています。<br className="hidden md:block"/>
            登録無料。仕事の保証はありませんが、条件が合えば運営より直接ご連絡。
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
            {[
              { title: '登録無料', desc: '費用は一切かかりません。', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
              { title: '不定期案件', desc: '条件が合えば運営よりご連絡。', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
              { title: 'ネットワーク', desc: '緊急案件やスポット便の共有。', icon: <CheckCircle2 size={18} className="text-emerald-500" /> }
            ].map((item, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  {item.icon}
                  <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <button 
              onClick={() => setView('driver')}
              className="bg-[#52a285] text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-[#3d7a64] transition-all shadow-lg shadow-emerald-100 flex items-center gap-3 group"
            >
              <UserPlus size={24} className="group-hover:scale-110 transition-transform" /> 
              ドライバー登録（仮）はこちら
            </button>
            <button 
              onClick={scrollToProfile}
              className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors flex items-center gap-2"
            >
              運営者プロフィールを表示 <ArrowRight size={14} className="rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Split Portals */}
      <div className="grid md:grid-cols-2 gap-6">
        <div 
          className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border-2 border-transparent hover:border-[#52a285] transition-all cursor-pointer group"
          onClick={() => setView('customer')}
        >
          <div className="w-16 h-16 bg-[#e6f0ec] rounded-2xl flex items-center justify-center text-[#52a285] mb-6 group-hover:scale-110 transition-transform">
            <Truck size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">お客様向けポータル</h3>
          <p className="text-slate-600 mb-8 h-12">配送のご依頼、運賃シミュレーション、車両トラブルのご相談はこちらから。</p>
          <button className="bg-[#52a285] text-white px-6 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 group-hover:bg-[#3d7a64] transition-colors">
            お客様ページへ <ArrowLeft className="rotate-180" size={18} />
          </button>
        </div>
        
        <div 
          className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border-2 border-transparent hover:border-slate-800 transition-all cursor-pointer group"
          onClick={() => setView('driver')}
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 mb-6 group-hover:scale-110 transition-transform">
            <UserPlus size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">ドライバー向けポータル</h3>
          <p className="text-slate-600 mb-8 h-12">協力ドライバーの登録、独立・開業に関するご相談はこちらから。</p>
          <button className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 group-hover:bg-slate-900 transition-colors">
            ドライバーページへ <ArrowLeft className="rotate-180" size={18} />
          </button>
        </div>
      </div>

      {/* Registered Drivers Section */}
      <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100 mt-12">
        <div className="flex items-center gap-3 mb-8">
          <Users className="text-[#52a285]" size={28} />
          <h2 className="text-2xl font-bold text-slate-800">登録ドライバー紹介</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ここにドライバーの情報を追加していきます */}
          {[
            {
              id: 1,
              nickname: 'たけさん',
              area: '山口県下関市',
              car: '軽バン',
              note: '全国どこでも走ります！長距離大歓迎です。',
              icon: 'https://picsum.photos/seed/take/150/150'
            },
            {
              id: 2,
              nickname: 'ドライバーAさん',
              area: '福岡県北九州市',
              car: '軽トラ',
              note: '土日メインで稼働しています。',
              icon: 'https://picsum.photos/seed/driverA/150/150'
            },
            {
              id: 3,
              nickname: 'ドライバーBさん',
              area: '山口県宇部市',
              car: '軽バン（冷蔵）',
              note: 'クール便対応可能です。お気軽にご相談ください。',
              icon: 'https://picsum.photos/seed/driverB/150/150'
            }
          ].map(driver => (
            <div key={driver.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-white shadow-sm">
                <img src={driver.icon} alt={driver.nickname} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">{driver.nickname}</h3>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                <span className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded-full">{driver.area}</span>
                <span className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded-full">{driver.car}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 w-full text-left relative">
                <span className="absolute -top-2 left-4 text-slate-300 text-lg leading-none">"</span>
                {driver.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Section (Moved to bottom) */}
      <div id="take-profile" className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center mt-12">
        <div className="w-32 h-32 rounded-full bg-slate-200 overflow-hidden shrink-0 border-4 border-[#52a285]">
          <img src={PROFILE_IMAGE_URL} alt="旅行配信者たけさん" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">運営代表：旅行配信者たけさん</h2>
            <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">TwitCasting</span>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            山口県を拠点に活動する軽貨物ドライバー兼旅行配信者。<br/>
            全国どこへでも駆けつけます。配送のご依頼から、ドライバーとしての独立相談までお任せください。
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <button onClick={() => setView('takesan-log')} className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">
              <User size={14} /> ライフログ
            </button>
            <a href="https://twitcasting.tv/c:keikamotsutake" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-600 transition-colors">
              ツイキャス配信
            </a>
            <a href="https://lin.ee/lTCUeadq" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#06C755] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#05b34c] transition-colors">
              <MessageCircle size={14} /> LINEで相談
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RegisterView({ setView }: { setView: (view: ViewState) => void }) {
  // Form State
  const [formData, setFormData] = useState({
    name: '', furigana: '', nickname: '', phone: '', email: '', zip: '',
    pref: '', city: '', address: '', maker: '', model: '', exp: '',
    bank: '', branch: '', accountType: '', accountNum: '', accountKana: '', accountName: '',
    agreed: false, contactMethod: 'line'
  });

  const [hopeText, setHopeText] = useState('');
  const [memoText, setMemoText] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    if (!mobile) {
      setFormData(prev => ({ ...prev, contactMethod: 'email' }));
    }
  }, []);

  // Auto-fill Zip Code
  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Normalize full-width to half-width and remove hyphens
    val = val.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[-ー]/g, '');
    setFormData({ ...formData, zip: val });

    if (val.length === 7) {
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${val}`);
        const data = await res.json();
        if (data.results) {
          setFormData(prev => ({
            ...prev,
            pref: data.results[0].address1,
            city: data.results[0].address2,
            address: data.results[0].address3
          }));
        }
      } catch (err) {
        console.error("Zip code search failed", err);
      }
    }
  };

  const handleFileSelect = (label: string, base64: string) => {
    setFiles(prev => ({ ...prev, [label]: base64 }));
  };

  // Validation
  const isFormValid = 
    formData.name && formData.furigana && formData.nickname && formData.phone && 
    formData.email &&
    formData.maker && formData.model && formData.exp && 
    formData.bank && formData.branch && formData.accountType && 
    formData.accountNum && formData.accountKana && formData.accountName && 
    formData.agreed &&
    files['免許証（表）'] && files['免許証（裏）'] && files['車両（前面）'] && 
    files['車検証'] && files['自賠責'] && files['任意保険'] && files['経営届出書'];

  const handleTagClick = (setter: React.Dispatch<React.SetStateAction<string>>, text: string, tag: string) => {
    setter(text ? `${text} ${tag}` : tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    await executeSubmit();
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    try {
      let currentReceiptNo = receiptNo;
      if (!currentReceiptNo) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        currentReceiptNo = `D-${dateStr}-${randomNum}`;
        setReceiptNo(currentReceiptNo);
      }

      const payload = {
        type: 'ドライバー登録',
        receiptNo: currentReceiptNo,
        name: formData.name,
        email: formData.email,
        message: `連絡希望: ${formData.contactMethod === 'line' ? 'LINE' : 'メール'}\n${memoText}`,
        phone: formData.phone,
        ...formData,
        hopeText,
        memoText,
        files // Send base64 files
      };

      await Promise.race([
        fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload)
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
      ]);

      setSubmitSuccess(true);
      
      // フォームリセット
      setFormData({
        name: '', furigana: '', nickname: '', phone: '', email: '', zip: '',
        pref: '', city: '', address: '', maker: '', model: '', exp: '',
        bank: '', branch: '', accountType: '', accountNum: '', accountKana: '', accountName: '',
        agreed: false, contactMethod: 'line'
      });
      setHopeText('');
      setMemoText('');
      setFiles({});
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Submit error:', error);
      alert('送信に失敗しました。通信環境をご確認の上、再度お試しください。');
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
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#e6f0ec] text-[#3d7a64] text-xs px-2 py-1 rounded font-bold">ドライバー登録</span>
          <span className="text-slate-500 text-xs flex items-center gap-1"><Info size={14}/> 送信に15〜20秒かかることがあります</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
          ドライバー登録フォーム
        </h1>
        <p className="text-slate-600 text-sm mb-6">
          送信後に「受付ID」が表示されます。写真はGoogle Driveに保存されます。
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <ul className="space-y-1">
            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#52a285]"/> 必須の項目は「必須」表示があります。</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#52a285]"/> 写真は各1枚ずつ添付してください。</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#52a285]"/> 送信中は画面を閉じずにお待ちください。</li>
          </ul>
          <ul className="space-y-1 text-amber-700">
            <li className="flex items-start gap-2"><span className="mt-0.5">⚠️</span> 送信がうまくいかない場合：</li>
            <li className="pl-6">- 通信が弱い（圏外/低速）</li>
            <li className="pl-6">- 写真が大きすぎる（5MB超）</li>
            <li className="pl-6">- ブラウザが古い</li>
          </ul>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        
        {/* 1. 基本情報 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <User className="text-[#52a285]" size={24} />
            <h2 className="text-xl font-bold text-slate-800">基本情報</h2>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">氏名 <Badge type="required" /></label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例：山田 太郎" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">ふりがな <Badge type="required" /></label>
                <input type="text" value={formData.furigana} onChange={e => setFormData({...formData, furigana: e.target.value})} placeholder="例：やまだ たろう" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">公開ニックネーム <Badge type="required" /></label>
                <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} placeholder="例：タケ（本名は公開されません）" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">電話番号 <Badge type="required" /></label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="例：09012345678（ハイフンなし）" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">郵便番号 <Badge type="optional" /></label>
                <input type="text" value={formData.zip} onChange={handleZipChange} placeholder="例：750-0000（入力で住所が自動で入ります）" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">希望する連絡手段 <Badge type="required" /></label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="regContactMethod" value="line" checked={formData.contactMethod === 'line'} onChange={() => setFormData({...formData, contactMethod: 'line'})} className="w-4 h-4 accent-[#52a285]" />
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><MessageCircle size={16} className="text-[#06C755]"/> LINE（推奨）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="regContactMethod" value="email" checked={formData.contactMethod === 'email'} onChange={() => setFormData({...formData, contactMethod: 'email'})} className="w-4 h-4 accent-[#52a285]" />
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><Mail size={16} className="text-slate-500"/> メール</span>
                  </label>
                </div>
                {formData.contactMethod === 'line' && <p className="text-xs text-emerald-600 mt-2 font-bold">※送信完了後、公式LINEへ受付番号を送信していただきます。</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">メールアドレス <Badge type="required" /></label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="例：example@mail.com" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">都道府県 <Badge type="optional" /></label>
                <input type="text" value={formData.pref} onChange={e => setFormData({...formData, pref: e.target.value})} placeholder="郵便番号から自動入力" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">市区町村 <Badge type="optional" /></label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="郵便番号から自動入力" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">住所（番地まで） <Badge type="optional" /></label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="例：〇〇町1-2-3" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. 車両・経験 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Truck className="text-[#52a285]" size={24} />
            <h2 className="text-xl font-bold text-slate-800">車両・経験</h2>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">メーカー <Badge type="required" /></label>
                <select 
                  value={formData.maker} 
                  onChange={e => setFormData({...formData, maker: e.target.value, model: ''})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none bg-white"
                >
                  <option value="">選択してください</option>
                  {Object.keys(KEI_MAKERS).map(maker => (
                    <option key={maker} value={maker}>{maker}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">軽自動車（黒ナンバー取得可能）</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">車種 <Badge type="required" /></label>
                <select 
                  value={formData.model} 
                  onChange={e => setFormData({...formData, model: e.target.value})} 
                  disabled={!formData.maker}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">{formData.maker ? '選択してください' : 'メーカーを選択してください'}</option>
                  {formData.maker && KEI_MAKERS[formData.maker as keyof typeof KEI_MAKERS].map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">経験年数 <Badge type="required" /></label>
                <select 
                  value={formData.exp} 
                  onChange={e => setFormData({...formData, exp: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none bg-white"
                >
                  <option value="">選択してください</option>
                  <option value="未経験">未経験</option>
                  <option value="1年未満">1年未満</option>
                  <option value="1〜3年">1〜3年</option>
                  <option value="3〜5年">3〜5年</option>
                  <option value="5年以上">5年以上</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">希望 <Badge type="optional" /></label>
                <input 
                  type="text" 
                  value={hopeText} 
                  onChange={e => setHopeText(e.target.value)} 
                  placeholder="例：企業配/宅配/スポットなど" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none mb-2" 
                />
                <div className="flex flex-wrap gap-2">
                  {['企業配', '宅配', 'スポット', 'チャーター', '定期便', '夜間'].map(tag => (
                    <button 
                      key={tag} 
                      type="button"
                      onClick={() => handleTagClick(setHopeText, hopeText, tag)}
                      className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">メモ <Badge type="optional" /></label>
                <input 
                  type="text" 
                  value={memoText} 
                  onChange={e => setMemoText(e.target.value)} 
                  placeholder="伝えておきたいことがあれば" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none mb-2" 
                />
                <div className="flex flex-wrap gap-2">
                  {['土日祝休み希望', '週3日希望', '長距離OK', '早朝OK'].map(tag => (
                    <button 
                      key={tag} 
                      type="button"
                      onClick={() => handleTagClick(setMemoText, memoText, tag)}
                      className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 本人確認（書類アップロード） */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-4">
            <ShieldCheck className="text-[#52a285]" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-800">ドライバー登録</h2>
              <p className="text-xs text-slate-500 font-normal mt-1">入力＋写真を送信してください（所要 2〜5分）</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 mb-6 mt-4">
            画像は各1枚ずつ添付してください。<br />
            送信に時間がかかる場合があります。送信中は画面を閉じずにお待ちください。
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <FileUpload label="免許証（表）" required={true} hint="ピントが合うように撮影してください" onFileSelect={(b64) => handleFileSelect('免許証（表）', b64)} />
            <FileUpload label="免許証（裏）" required={true} onFileSelect={(b64) => handleFileSelect('免許証（裏）', b64)} />
            <FileUpload label="車両（前面）" required={true} hint="ナンバーが写るように" onFileSelect={(b64) => handleFileSelect('車両（前面）', b64)} />
            <FileUpload label="車検証" required={true} onFileSelect={(b64) => handleFileSelect('車検証', b64)} />
            <FileUpload label="自賠責" required={true} onFileSelect={(b64) => handleFileSelect('自賠責', b64)} />
            <FileUpload label="任意保険" required={true} hint="※加入が分かるページ" onFileSelect={(b64) => handleFileSelect('任意保険', b64)} />
            <FileUpload label="経営届出書" required={true} onFileSelect={(b64) => handleFileSelect('経営届出書', b64)} />
            <FileUpload label="貨物保険" required={false} hint="任意です" onFileSelect={(b64) => handleFileSelect('貨物保険', b64)} />
          </div>
        </div>

        {/* 4. 振込口座 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Landmark className="text-[#52a285]" size={24} />
            <h2 className="text-xl font-bold text-slate-800">振込口座（入力）</h2>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">銀行名 <Badge type="required" /></label>
                <input 
                  type="text" 
                  list="bank-list"
                  value={formData.bank}
                  onChange={e => setFormData({...formData, bank: e.target.value, branch: ''})}
                  placeholder="例：0001 みずほ銀行" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" 
                />
                <datalist id="bank-list">
                  {Object.keys(BANKS_DATA).map(bank => <option key={bank} value={bank} />)}
                </datalist>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">支店名 <Badge type="required" /></label>
                <input 
                  type="text" 
                  list="branch-list"
                  value={formData.branch}
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                  placeholder="例：001 本店" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" 
                />
                <datalist id="branch-list">
                  {BANKS_DATA[formData.bank]?.map(branch => <option key={branch} value={branch} />)}
                </datalist>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">口座種別 <Badge type="required" /></label>
                <select 
                  value={formData.accountType}
                  onChange={e => setFormData({...formData, accountType: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none bg-white"
                >
                  <option value="">選択してください</option>
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">口座番号 <Badge type="required" /></label>
                <input 
                  type="text" 
                  value={formData.accountNum}
                  onChange={e => setFormData({...formData, accountNum: e.target.value})}
                  placeholder="ハイフンなし" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" 
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">口座名義（カナ） <Badge type="required" /></label>
                <input 
                  type="text" 
                  value={formData.accountKana}
                  onChange={e => setFormData({...formData, accountKana: e.target.value})}
                  placeholder="例：ヤマダ タロウ" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" 
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">口座名義（漢字） <Badge type="required" /></label>
                <input 
                  type="text" 
                  value={formData.accountName}
                  onChange={e => setFormData({...formData, accountName: e.target.value})}
                  placeholder="例：山田 太郎" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285] outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. 送信 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Send className="text-[#52a285]" size={24} />
            <h2 className="text-xl font-bold text-slate-800">送信</h2>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            送信ボタンを押すと、写真のアップロードが始まります。<br />
            通信状況により <strong>15〜20秒</strong> かかることがあります。画面は閉じずにお待ちください。
          </p>

          <div className="bg-[#fcfaf2] border border-amber-200 rounded-xl p-6 text-sm text-slate-600 space-y-3 mb-8">
            <h3 className="font-bold text-slate-800 mb-2">同意内容（必ず確認）</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>これは求人ではなく「登録プール」です（すぐに仕事が発生する保証はありません）。</li>
              <li>入力内容は <strong>代表だけ</strong> が連絡・配車判断のために利用します（お客さまへ直接共有しません）。</li>
              <li>手数料：案件成立時、お客さまから頂く料金のうち<strong>20%</strong>を運営・調整費として頂き、残り<strong>80%</strong>をドライバー報酬とします。</li>
              <li>登録後でも、内容の変更・削除依頼が可能です（LINEから連絡）。</li>
              <li>迷惑行為・虚偽入力・無断キャンセルなどがある場合、以後の連絡をお断りすることがあります。</li>
              <li>通信状況により通知が届かない可能性があります。</li>
            </ul>
            <p className="text-xs mt-4">個人情報の取り扱いは <a href="#" className="underline text-[#52a285]">プライバシー・個人情報の取扱い</a> をご確認ください。</p>
          </div>

          <div className="space-y-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.agreed}
                onChange={e => setFormData({...formData, agreed: e.target.checked})}
                className="mt-1 w-5 h-5 text-[#52a285] rounded border-slate-300 focus:ring-[#52a285]" 
              />
              <span className="font-bold text-slate-800">上記の同意内容に同意して登録します（必須）</span>
            </label>
            
            {!isFormValid && (
              <p className="text-xs text-red-500 font-bold">※すべての必須項目を入力し、同意にチェックを入れると送信できます。</p>
            )}

            <button 
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full font-bold text-lg py-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 ${
                isFormValid && !isSubmitting
                  ? 'bg-[#3d7a64] text-white hover:bg-[#2d5a4a] cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
              {isSubmitting ? '送信中...' : '送信する（登録）'}
            </button>
          </div>
          
          <p className="text-xs text-slate-400 mt-4 text-center">
            送信後に受付IDが表示されます。控えてください。<br />
            うまくいかない場合は公式LINEへご連絡ください。
          </p>
        </div>

      </form>

      {/* Success Modal */}
      {submitSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl">
            
            {formData.contactMethod === 'line' ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">送信完了！...あと1ステップです</h3>
                <p className="text-slate-600 mb-4 text-sm">
                  登録データは<strong className="text-emerald-600">無事にたけさんへ送信されました</strong>のでご安心ください。<br/>
                  最後に、今後のスムーズなやり取りのため、公式LINEへ以下の受付番号を送信してください。
                </p>
                
                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-left border border-slate-200">
                  <p className="text-sm font-bold text-slate-800 mb-2">📱 スマホをご利用の方</p>
                  <ol className="text-xs text-slate-600 mb-4 space-y-1 list-decimal list-inside">
                    <li>下の「受付番号」をコピーする</li>
                    <li>「LINEを開く」ボタンを押す</li>
                    <li>トーク画面に番号を貼り付けて送信！</li>
                  </ol>

                  <p className="text-sm font-bold text-slate-800 mb-2 mt-4">💻 PCをご利用の方</p>
                  <ol className="text-xs text-slate-600 mb-4 space-y-1 list-decimal list-inside">
                    <li>スマホのカメラで下のQRコードを読み取る</li>
                    <li>スマホのLINEで友達追加する</li>
                    <li>トーク画面に下の「受付番号」を手入力して送信！</li>
                  </ol>
                  
                  <div className="flex justify-center mb-4">
                    <img src={LINE_QR_URL} alt="LINE QR" className="w-32 h-32 border border-slate-200 rounded-xl" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4 mt-4">
                    <code className="flex-1 bg-white p-2 rounded border border-slate-200 text-emerald-600 font-bold text-center">
                      {receiptNo}
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(receiptNo);
                        alert('受付番号をコピーしました！');
                      }} 
                      className="p-2 bg-slate-200 rounded hover:bg-slate-300 text-xs font-bold"
                    >
                      コピー
                    </button>
                  </div>
                  <a href={`https://line.me/R/oaMessage/@771sxuxl/?text=${encodeURIComponent(`受付番号:${receiptNo}`)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#06C755] text-white font-bold py-3 rounded-xl hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-2">
                    <MessageCircle size={20} /> LINEを開く
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">登録申請を受け付けました！</h3>
                <p className="text-slate-600 mb-6 text-sm">
                  受付番号: <span className="font-bold text-emerald-600">{receiptNo}</span><br/>
                  ご入力いただいたメールアドレス宛に、折り返しご連絡差し上げます。
                </p>
              </>
            )}

            <button onClick={() => { setSubmitSuccess(false); setView('top'); }} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors mt-2">
              トップページへ戻る
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// --- New Consultation Views ---

function ConsultVehicleView({ setView }: { setView: (view: ViewState) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">車両の相談</h1>
        <div className="flex items-center justify-center gap-4 text-sm font-bold text-slate-500">
          <span className="bg-[#e6f0ec] text-[#3d7a64] px-3 py-1 rounded-full">STEP1 : 種類を選ぶ</span>
          <span className="text-slate-300">→</span>
          <span>STEP2 : 内容を入力</span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
            <Car size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">STEP1 : 相談の種類を選ぶ</h2>
            <p className="text-sm text-slate-500">ここを選ぶと、専用の入力欄へ進みます。</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <button 
            onClick={() => setView('consult-vehicle-buy')}
            className="text-left border border-slate-200 rounded-xl p-4 hover:border-[#52a285] hover:bg-[#f4f7f6] transition-all focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285]"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-2"><Car size={16} className="text-blue-500"/> 車両購入</span>
              <span className="text-xs text-slate-400">選ぶ →</span>
            </div>
            <p className="text-xs text-slate-500">普通車・トラックも対応。用途・予算・メーカーなど。</p>
          </button>
          <button 
            onClick={() => setView('consult-vehicle-repair')}
            className="text-left border border-slate-200 rounded-xl p-4 hover:border-[#52a285] hover:bg-[#f4f7f6] transition-all focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285]"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-2"><Wrench size={16} className="text-orange-500"/> 修理・整備</span>
              <span className="text-xs text-slate-400">選ぶ →</span>
            </div>
            <p className="text-xs text-slate-500">症状・警告灯・気になる点を選択＋自由記述。</p>
          </button>
          <button 
            onClick={() => setView('consult-vehicle-inspect')}
            className="text-left border border-slate-200 rounded-xl p-4 hover:border-[#52a285] hover:bg-[#f4f7f6] transition-all focus:border-[#52a285] focus:ring-1 focus:ring-[#52a285]"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> 車検</span>
              <span className="text-xs text-slate-400">選ぶ →</span>
            </div>
            <p className="text-xs text-slate-500">時期・希望（最低限通すだけ/しっかり整備）など。</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Detailed Vehicle Consultation Views ---

function ConsultVehicleBuyView({ setView }: { setView: (view: ViewState) => void }) {
  const [maker, setMaker] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [budget, setBudget] = useState('');
  const [condition, setCondition] = useState('');
  const [memo, setMemo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !contactMethod) {
      alert('ご連絡先（お名前、電話番号、返信希望）は必須です。');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: '車両購入相談',
        name,
        phone,
        maker,
        model,
        color,
        budget,
        condition,
        memo,
        contactMethod
      };

      await Promise.race([
        fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]);

      setSubmitStatus('success');
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => setView('consult-vehicle')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4">
        <ArrowLeft size={16} /> 種類選択に戻る
      </button>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Car className="text-blue-500" size={24} />
          <h1 className="text-2xl font-bold text-slate-800">車両購入の相談</h1>
        </div>
        <p className="text-sm text-slate-500 ml-9">普通車・トラックなど、軽貨物以外の車両もご相談可能です。</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">希望メーカー</label>
              <select 
                value={maker}
                onChange={e => { setMaker(e.target.value); setModel(''); }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="">こだわらない</option>
                {Object.keys(ALL_VEHICLE_DATA).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">希望車種</label>
              <select 
                value={model}
                onChange={e => setModel(e.target.value)}
                disabled={!maker}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">{maker ? '選択してください' : 'メーカーを選択'}</option>
                {maker && ALL_VEHICLE_DATA[maker]?.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">ボディカラー</label>
              <select 
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="">選択してください</option>
                {BODY_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">予算感</label>
              <select 
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="">選択してください</option>
                <option>50万円以内</option>
                <option>50〜100万円</option>
                <option>100〜200万円</option>
                <option>200万円以上</option>
                <option>ローン・リースで相談したい</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">新車・中古車</label>
              <select 
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="">こだわらない</option>
                <option>新車</option>
                <option>中古車</option>
                <option>新古車（未使用車）</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">用途・その他の希望（自由記入）</label>
            <textarea 
              rows={4} 
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="例：宅配で使うので燃費重視、荷台の広いトラックが欲しい、など" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
            ></textarea>
          </div>

          <ContactFields 
            name={name} setName={setName}
            phone={phone} setPhone={setPhone}
            method={contactMethod} setMethod={setContactMethod}
          />

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#52a285] text-white font-bold py-4 rounded-xl hover:bg-[#3d7a64] transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            <Send size={18} /> {isSubmitting ? '送信中...' : '送信する'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function ConsultVehicleRepairView({ setView }: { setView: (view: ViewState) => void }) {
  const [maker, setMaker] = useState('');
  const [model, setModel] = useState('');
  const [mileage, setMileage] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSymptomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (e.target.checked) {
      setSymptoms([...symptoms, val]);
    } else {
      setSymptoms(symptoms.filter(s => s !== val));
    }
  };

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !contactMethod) {
      alert('ご連絡先（お名前、電話番号、返信希望）は必須です。');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: '修理・整備相談',
        name, phone, maker, model, mileage,
        symptoms: symptoms.join(', '),
        memo, contactMethod
      };

      await Promise.race([
        fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]);

      setSubmitStatus('success');
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => setView('consult-vehicle')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4">
        <ArrowLeft size={16} /> 種類選択に戻る
      </button>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Wrench className="text-orange-500" size={24} />
          <h1 className="text-2xl font-bold text-slate-800">修理・整備の相談</h1>
        </div>
        <p className="text-sm text-slate-500 ml-9">気になる症状や、定期的なメンテナンスについてご相談ください。</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-4">気になる症状・依頼内容 (複数選択可)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['エンジン異音', '警告灯点灯', 'エアコン効かない', 'ブレーキ異音', 'オイル漏れ', 'バッテリー上がり', 'タイヤ交換', 'オイル交換', 'その他'].map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input 
                    type="checkbox" 
                    value={item}
                    onChange={handleSymptomChange}
                    className="text-[#52a285] focus:ring-[#52a285] rounded"
                  /> {item}
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">現在のメーカー</label>
              <select 
                value={maker}
                onChange={e => { setMaker(e.target.value); setModel(''); }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="">選択してください</option>
                {Object.keys(ALL_VEHICLE_DATA).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">現在の車種</label>
              <select 
                value={model}
                onChange={e => setModel(e.target.value)}
                disabled={!maker}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">{maker ? '選択してください' : 'メーカーを選択'}</option>
                {maker && ALL_VEHICLE_DATA[maker]?.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">走行距離（おおよそ）</label>
              <input 
                type="text" 
                value={mileage}
                onChange={e => setMileage(e.target.value)}
                placeholder="例：10万km" 
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">症状の詳細・備考（自由記入）</label>
            <textarea 
              rows={4} 
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="いつから症状が出ているか、どんな時に音が鳴るかなど、詳しく教えてください。" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
            ></textarea>
          </div>

          <ContactFields 
            name={name} setName={setName}
            phone={phone} setPhone={setPhone}
            method={contactMethod} setMethod={setContactMethod}
          />

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#52a285] text-white font-bold py-4 rounded-xl hover:bg-[#3d7a64] transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            <Send size={18} /> {isSubmitting ? '送信中...' : '送信する'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function ConsultVehicleInspectView({ setView }: { setView: (view: ViewState) => void }) {
  const [maker, setMaker] = useState('');
  const [model, setModel] = useState('');
  const [expDate, setExpDate] = useState('');
  const [style, setStyle] = useState('');
  const [loanCar, setLoanCar] = useState('');
  const [memo, setMemo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !contactMethod) {
      alert('ご連絡先（お名前、電話番号、返信希望）は必須です。');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: '車検相談',
        name, phone, maker, model,
        expDate, style, loanCar, memo, contactMethod
      };

      await Promise.race([
        fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]);

      setSubmitStatus('success');
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => setView('consult-vehicle')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4">
        <ArrowLeft size={16} /> 種類選択に戻る
      </button>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="text-emerald-500" size={24} />
          <h1 className="text-2xl font-bold text-slate-800">車検の相談</h1>
        </div>
        <p className="text-sm text-slate-500 ml-9">ご希望の車検スタイル（安さ重視・しっかり整備など）をお聞かせください。</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">車検満了日（おおよそ）</label>
              <input 
                type="month" 
                value={expDate}
                onChange={e => setExpDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">現在のメーカー</label>
              <select 
                value={maker}
                onChange={e => { setMaker(e.target.value); setModel(''); }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="">選択してください</option>
                {Object.keys(ALL_VEHICLE_DATA).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">現在の車種</label>
              <select 
                value={model}
                onChange={e => setModel(e.target.value)}
                disabled={!maker}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">{maker ? '選択してください' : 'メーカーを選択'}</option>
                {maker && ALL_VEHICLE_DATA[maker]?.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-4">ご希望の車検スタイル</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50">
                <input 
                  type="radio" 
                  name="inspect_style" 
                  value="最低限通すだけ"
                  onChange={e => setStyle(e.target.value)}
                  className="mt-1 text-[#52a285] focus:ring-[#52a285]" 
                />
                <div>
                  <span className="font-bold text-slate-800 block">最低限通すだけ（安さ重視）</span>
                  <span className="text-xs text-slate-500">オイル交換など、車検に通る最低限の整備のみ行います。</span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50">
                <input 
                  type="radio" 
                  name="inspect_style" 
                  value="しっかり整備"
                  onChange={e => setStyle(e.target.value)}
                  className="mt-1 text-[#52a285] focus:ring-[#52a285]" 
                />
                <div>
                  <span className="font-bold text-slate-800 block">しっかり整備（安心重視）</span>
                  <span className="text-xs text-slate-500">長く乗れるように、消耗品の交換などを含めてしっかり整備します。</span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50">
                <input 
                  type="radio" 
                  name="inspect_style" 
                  value="見積もりを見てから"
                  onChange={e => setStyle(e.target.value)}
                  className="mt-1 text-[#52a285] focus:ring-[#52a285]" 
                />
                <div>
                  <span className="font-bold text-slate-800 block">見積もりを見てから決めたい</span>
                  <span className="text-xs text-slate-500">まずは状態を見て、予算に合わせて相談したい。</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">代車の希望</label>
            <select 
              value={loanCar}
              onChange={e => setLoanCar(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
            >
              <option value="">選択してください</option>
              <option>代車が必要</option>
              <option>代車は不要</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">備考（自由記入）</label>
            <textarea 
              rows={3} 
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="気になる異音がある、ついでにドラレコを付けてほしい等" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
            ></textarea>
          </div>

          <ContactFields 
            name={name} setName={setName}
            phone={phone} setPhone={setPhone}
            method={contactMethod} setMethod={setContactMethod}
          />

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#52a285] text-white font-bold py-4 rounded-xl hover:bg-[#3d7a64] transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            <Send size={18} /> {isSubmitting ? '送信中...' : '送信する'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function ConsultBusinessView() {
  const [troubles, setTroubles] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTroubleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (e.target.checked) {
      setTroubles([...troubles, val]);
    } else {
      setTroubles(troubles.filter(t => t !== val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !contactMethod) {
      alert('ご連絡先（お名前、電話番号、返信希望）は必須です。');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: '開業トータル相談',
        name, phone,
        troubles: troubles.join(', '),
        memo, contactMethod
      };

      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      alert('送信が完了しました。担当者よりご連絡いたします。');
      // Reset form or redirect could go here
    } catch (error) {
      console.error('Submit error:', error);
      alert('送信に失敗しました。');
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
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="text-slate-400" size={24} />
          <h1 className="text-2xl font-bold text-slate-800">開業トータル相談</h1>
        </div>
        <p className="text-sm text-slate-500 ml-9">黒ナンバー / 書類 / 仕事 / 保険 / 車両...まとめてOK</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-slate-100 p-1.5 rounded text-slate-600"><MessageCircle size={16}/></span>
          <h2 className="font-bold text-slate-800">相談内容を選ぶ</h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="border border-slate-200 rounded-xl p-6">
            <label className="block text-sm font-bold text-slate-800 mb-4">悩み (複数選択可)</label>
            <div className="grid grid-cols-2 gap-4">
              {['黒ナンバー', '開業届（税務署に提出）', '確定申告', '仕事の取り方', '保険', '車両'].map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    value={item}
                    onChange={handleTroubleChange}
                    className="text-[#52a285] focus:ring-[#52a285] rounded"
                  /> {item}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">備考（自由記入）</label>
            <textarea 
              rows={4} 
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="状況 / 困っていること"
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none resize-none"
            ></textarea>
          </div>

          <ContactFields 
            name={name} setName={setName}
            phone={phone} setPhone={setPhone}
            method={contactMethod} setMethod={setContactMethod}
          />

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#52a285] text-white font-bold py-4 rounded-xl hover:bg-[#3d7a64] transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            <Send size={18} />
            {isSubmitting ? '送信中...' : '送信する（必ず届く）'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function TakesanLogView({ setView }: { setView: (view: ViewState) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <button onClick={() => setView('top')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4">
        <ArrowLeft size={16} /> トップに戻る
      </button>
      
      <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
        <div className="h-48 bg-slate-800 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
          <div className="absolute bottom-6 left-8 flex items-end gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-slate-200">
              <img src={PROFILE_IMAGE_URL} alt="たけさん" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="text-white pb-2">
              <h1 className="text-3xl font-bold">旅行配信者 たけさん</h1>
              <p className="text-slate-300 text-sm">山口県下関市拠点 / 軽貨物ドライバー</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 md:p-12 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Car className="text-[#52a285]" /> 1.5ヶ月の日本周遊実績
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              山口県を出発し、新潟〜東京〜九州を巡る1.5ヶ月の日本一周（周遊）を達成しました。
              全国のあらゆる道路状況を経験し、長距離運転のノウハウと安全運転のスキルを磨き上げました。
              この経験が、現在の確実で安心な配送サービスに活きています。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold mb-1">出発地</p>
                <p className="font-bold text-slate-700">山口県</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold mb-1">経由地</p>
                <p className="font-bold text-slate-700">新潟・東京</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold mb-1">最終エリア</p>
                <p className="font-bold text-slate-700">九州一周</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold mb-1">期間</p>
                <p className="font-bold text-slate-700">約1.5ヶ月</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Info className="text-[#52a285]" /> 趣味・好き（車中泊と車内料理）
            </h2>
            <div className="bg-[#e6f0ec] rounded-2xl p-6 md:p-8">
              <p className="text-slate-700 leading-relaxed mb-4">
                愛車の軽バンは、ただの仕事道具ではなく「動く家」であり「ON AIR BAR」です。
                車中泊をしながら全国を巡り、車内で料理を作るのが最大の趣味。
                限られたスペースで工夫しながら生活する楽しさを、配信を通じて皆さんと共有しています。
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 text-sm ml-2">
                <li>愛用のギターと共に全国を旅するスタイル</li>
                <li>車内での自炊・車中飯の探求</li>
                <li>各地の風景や出会いをリアルタイムでお届け</li>
              </ul>
            </div>
          </section>

          <section className="text-center pt-8 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">リアルタイムの旅と日常を配信中！</h2>
            <p className="text-slate-500 text-sm mb-6">ツイキャスで日々の様子や旅の記録をライブ配信しています。ぜひ遊びに来てください！</p>
            <a href="https://twitcasting.tv/c:keikamotsutake" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              ツイキャスアーカイブ・ライブを見る
            </a>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

// --- New Portal Views ---

function CustomerTopView({ setView }: { setView: (view: ViewState) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => setView('top')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4">
        <ArrowLeft size={16} /> トップに戻る
      </button>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6 flex items-center gap-4">
        <div className="bg-[#e6f0ec] p-3 rounded-xl text-[#52a285]"><Truck size={28}/></div>
        <h1 className="text-3xl font-bold text-slate-800">お客様向けポータル</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <button onClick={() => setView('simulator')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-[#52a285] text-left transition-all">
          <h3 className="font-bold text-lg mb-2 text-slate-800">💰 運賃シミュレーター</h3>
          <p className="text-sm text-slate-500">距離や条件を入力して、おおよその配送料金を計算します。</p>
        </button>
        <button onClick={() => setView('consult-delivery')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-[#52a285] text-left transition-all">
          <h3 className="font-bold text-lg mb-2 text-slate-800">📦 配送・お見積り依頼</h3>
          <p className="text-sm text-slate-500">実際の配送依頼や、詳細なお見積りはこちらからお問い合わせください。</p>
        </button>
        <button onClick={() => setView('consult-vehicle')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-[#52a285] text-left transition-all">
          <h3 className="font-bold text-lg mb-2 text-slate-800">🔧 車両トラブル相談</h3>
          <p className="text-sm text-slate-500">お車の故障や修理、車検に関するご相談窓口です。</p>
        </button>
      </div>
    </motion.div>
  );
}

function DriverTopView({ setView }: { setView: (view: ViewState) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => setView('top')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4">
        <ArrowLeft size={16} /> トップに戻る
      </button>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6 flex items-center gap-4">
        <div className="bg-slate-100 p-3 rounded-xl text-slate-700"><UserPlus size={28}/></div>
        <h1 className="text-3xl font-bold text-slate-800">ドライバー向けポータル</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <button onClick={() => setView('register')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-800 text-left transition-all">
          <h3 className="font-bold text-lg mb-2 text-slate-800">📝 協力ドライバー登録</h3>
          <p className="text-sm text-slate-500">案件をご紹介するためのドライバー登録フォームです。</p>
        </button>
        <button onClick={() => setView('consult-business')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-800 text-left transition-all">
          <h3 className="font-bold text-lg mb-2 text-slate-800">🏢 開業トータル相談</h3>
          <p className="text-sm text-slate-500">黒ナンバー取得や確定申告など、独立に関するご相談。</p>
        </button>
      </div>
    </motion.div>
  );
}

function SimulatorView({ setView, setSimulatorData }: { setView: (view: ViewState) => void, setSimulatorData: (data: any) => void }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  
  // 主要ルートのプリセット（APIが動かない時のための根本的改善）
  const COMMON_ROUTES = [
    { label: '下関 ↔ 門司', dist: '10.0', icon: '⚓', dest: '福岡県北九州市門司区' },
    { label: '下関 ↔ 小倉', dist: '15.0', icon: '🚄', dest: '福岡県北九州市小倉北区' },
    { label: '下関 ↔ 福岡市', dist: '75.0', icon: '🍜', dest: '福岡県福岡市' },
    { label: '下関 ↔ 山口市', dist: '70.0', icon: '🏯', dest: '山口県山口市' },
    { label: '下関 ↔ 広島市', dist: '200.0', icon: '🍁', dest: '広島県広島市' },
    { label: '下関 ↔ 岡山県', dist: '350.0', icon: '🍑', dest: '岡山県岡山市' },
  ];
  const [cargoSize, setCargoSize] = useState('小');
  const [walkDistLoad, setWalkDistLoad] = useState('20');
  const [walkDistUnload, setWalkDistUnload] = useState('20');
  const [waitTimeLoad, setWaitTimeLoad] = useState('0');
  const [waitTimeUnload, setWaitTimeUnload] = useState('0');
  const [stairsLoad, setStairsLoad] = useState('1');
  const [stairsUnload, setStairsUnload] = useState('1');
  const [extraWorkers, setExtraWorkers] = useState('0');
  const [vehicleCount, setVehicleCount] = useState('1');

  // --- 150点・収益爆増エンジン用ステート ---
  const [speedType, setSpeedType] = useState('通常便'); // 通常, お急ぎ(+20%), 超特急(+40%)
  const [weather, setWeather] = useState('晴れ/曇り');
  const [isLocating, setIsLocating] = useState(false);

  // 配送日時ステート
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [holidaysMap, setHolidaysMap] = useState<Record<string, string>>({});

  // 休日・天候の自動取得
  useEffect(() => {
    const checkHolidayAndWeather = async () => {
      try {
        // 休日チェック (Holidays JP API)
        const hRes = await fetch('https://holidays-jp.github.io/api/v1/date.json');
        const hData = await hRes.json();
        setHolidaysMap(hData);

        // 天候チェック (Open-Meteo API - 山口県下関市付近をデフォルト)
        const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=33.9578&longitude=130.9415&current_weather=true');
        const wData = await wRes.json();
        const code = wData.current_weather.weathercode;
        if ([51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99].includes(code)) {
          setWeather('雨/雪');
        }
      } catch (e) {
        console.error('API check error:', e);
      }
    };
    checkHolidayAndWeather();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報に対応していません。');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${pos.coords.longitude}&y=${pos.coords.latitude}`);
        const data = await res.json();
        if (data && data.response && data.response.location && data.response.location.length > 0) {
          const loc = data.response.location[0];
          setOrigin(`${loc.prefecture}${loc.city}${loc.town}`);
        } else {
          alert('現在地の住所が見つかりませんでした。');
        }
      } catch (e) {
        alert('現在地の取得に失敗しました。');
      } finally {
        setIsLocating(false);
      }
    }, () => {
      alert('位置情報の取得を許可してください。');
      setIsLocating(false);
    });
  };

  const calculateTimeRatios = () => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return { holidayRatio: 0, lateNightRatio: 0 };
    }

    let totalMs = end.getTime() - start.getTime();
    let holidayMs = 0;
    let lateNightMs = 0;

    let current = new Date(start);
    while (current < end) {
      const dayOfWeek = current.getDay();
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const hour = current.getHours();

      const isHol = dayOfWeek === 0 || dayOfWeek === 6 || !!holidaysMap[dateStr];
      const isLate = hour >= 22 || hour < 5; // 22:00〜04:59

      if (isHol) holidayMs += 60000;
      if (isLate) lateNightMs += 60000;

      current.setMinutes(current.getMinutes() + 1);
    }

    return {
      holidayRatio: holidayMs / totalMs,
      lateNightRatio: lateNightMs / totalMs
    };
  };

  const calculateFare = () => {
    const dist = parseFloat(distance) || 0;
    if (dist === 0) return 0;

    let baseFare = 3000;
    let distFare = 0;

    if (dist <= 20) {
      distFare = dist * 130;
    } else if (dist <= 50) {
      distFare = (20 * 130) + ((dist - 20) * 120);
    } else {
      distFare = (20 * 130) + (30 * 120) + ((dist - 50) * 110);
    }

    let total = baseFare + distFare;

    // 100km超で1.5倍
    if (dist > 100) {
      total = total * 1.5;
    }

    // 隠蔽高速代
    total += dist * 25;

    // オプション加算
    if (cargoSize === '中') total += 2000;
    if (cargoSize === '大') total += 4000;
    if (walkDistLoad === '50') total += 1000;
    if (walkDistLoad === '100') total += 2000;
    if (walkDistUnload === '50') total += 1000;
    if (walkDistUnload === '100') total += 2000;
    total += Math.floor(parseInt(waitTimeLoad) / 20) * 1000;
    total += Math.floor(parseInt(waitTimeUnload) / 20) * 1000;

    const getStairsFee = (floor: string) => {
      const f = parseInt(floor);
      return f > 1 ? (f - 1) * 1500 : 0; // 1階増えるごとに1500円
    };
    total += getStairsFee(stairsLoad);
    total += getStairsFee(stairsUnload);

    // 車両台数で乗算（基本料金＋距離料金＋オプション料金）
    total *= parseInt(vehicleCount);

    // 追加作業員は全体の追加人数とする
    total += parseInt(extraWorkers) * 8000;

    // --- 収益爆増割増ロジック ---
    const { holidayRatio, lateNightRatio } = calculateTimeRatios();
    const holidayExtra = total * 0.2 * holidayRatio;
    const lateNightExtra = total * 0.2 * lateNightRatio;
    total += holidayExtra + lateNightExtra;

    if (weather === '雨/雪') total *= 1.1; // 悪天候割増

    // スピード便
    if (speedType === 'お急ぎ便') total *= 1.2;
    if (speedType === '超特急便') total *= 1.4;

    return Math.floor(total);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setView('customer')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm">
          <ArrowLeft size={16} /> お客様ポータルに戻る
        </button>
      </div>
      
      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Zap size={24} /></div>
          <h2 className="text-2xl font-bold text-slate-800">運賃シミュレーター</h2>
        </div>

        <div className="space-y-6">
          {/* 出発・到着 */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-bold text-slate-800 mb-2">出発地</label>
              <div className="flex gap-2">
                <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="例: 山口県下関市〇〇" className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none" />
                <button 
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                  className="bg-slate-100 text-slate-600 px-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
                >
                  <MapPin size={14} /> {isLocating ? '取得中...' : '現在地'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">到着地</label>
              <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="例: 福岡県福岡市〇〇" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-blue-900">走行距離 (km)</label>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-4 py-2 rounded-full shadow-sm transition-all"
                onClick={(e) => (!origin || !destination) && (e.preventDefault(), alert('出発地と目的地を入力してください'))}
              >
                <MapPin size={14} /> Googleマップで距離を調べる ↗
              </a>
            </div>
            
            {/* 主要ルートのクイック選択（根本的改善：API不要） */}
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_ROUTES.map(route => (
                <button
                  key={route.label}
                  onClick={() => {
                    setDistance(route.dist);
                    setOrigin('山口県下関市');
                    setDestination(route.dest);
                  }}
                  className="text-[9px] font-bold bg-white/50 text-blue-500 border border-blue-100 px-2 py-1 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                >
                  {route.icon} {route.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <input 
                type="number" 
                value={distance} 
                onChange={e => setDistance(e.target.value)} 
                placeholder="自動計算または手動入力" 
                className="w-full p-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white font-mono text-lg" 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 font-bold">km</div>
            </div>
            <p className="text-[10px] text-blue-600 mt-2 font-medium">
              ※上の「Googleマップで距離を調べる」ボタンを押し、表示された「道のり（km）」を入力してください。
            </p>
          </div>

          {/* スピード便選択 (収益化エンジン) */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800">配送スピード</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '通常便', label: '通常', sub: '割増なし', icon: <Truck size={14} /> },
                { id: 'お急ぎ便', label: 'お急ぎ', sub: '+20%', icon: <Zap size={14} className="text-amber-500" /> },
                { id: '超特急便', label: '超特急', sub: '+40%', icon: <Zap size={14} className="text-red-500" /> }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSpeedType(item.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${speedType === item.id ? 'border-[#52a285] bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex justify-center mb-1">{item.icon}</div>
                  <div className="text-sm font-bold text-slate-800">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 詳細オプション (アコーディオン風にしたいがシンプルに) */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-[#52a285]" /> 配送日時（休日・深夜割増の計算用）
              </label>
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">開始日時</label>
                  <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#52a285] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">終了日時</label>
                  <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#52a285] bg-white" />
                </div>
              </div>
              {(() => {
                const { holidayRatio, lateNightRatio } = calculateTimeRatios();
                if (holidayRatio > 0 || lateNightRatio > 0) {
                  return (
                    <div className="mt-3 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                      <span className="font-bold text-[#52a285]">適用される割増率（時間割合で計算）:</span><br/>
                      休日割増: {(holidayRatio * 100).toFixed(1)}% の時間に適用<br/>
                      深夜割増 (22時〜翌5時): {(lateNightRatio * 100).toFixed(1)}% の時間に適用
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">基本設定</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">車の台数</label>
                  <select value={vehicleCount} onChange={e => setVehicleCount(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
                    <option value="1">1台</option>
                    <option value="2">2台</option>
                    <option value="3">3台</option>
                    <option value="4">4台</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">荷物量</label>
                  <select value={cargoSize} onChange={e => setCargoSize(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
                    <option value="小">小（段ボール数個）</option>
                    <option value="中">中（単身引越し/+2000）</option>
                    <option value="大">大（軽バン満載/+4000）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">追加作業員</label>
                  <select value={extraWorkers} onChange={e => setExtraWorkers(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
                    <option value="0">不要</option>
                    <option value="1">1名追加(+8000)</option>
                    <option value="2">2名追加(+16000)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">積地（出発地）の状況</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">階数（階段）</label>
                  <select value={stairsLoad} onChange={e => setStairsLoad(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white">
                    <option value="1">1階/EV有</option>
                    <option value="2">階段2階(+1500)</option>
                    <option value="3">階段3階(+3000)</option>
                    <option value="4">階段4階(+4500)</option>
                    <option value="5">階段5階(+6000)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">台車移動距離</label>
                  <select value={walkDistLoad} onChange={e => setWalkDistLoad(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white">
                    <option value="20">20m未満</option>
                    <option value="50">50m未満(+1000)</option>
                    <option value="100">100m未満(+2000)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">待機時間</label>
                  <select value={waitTimeLoad} onChange={e => setWaitTimeLoad(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white">
                    <option value="0">なし</option>
                    <option value="20">20分(+1000)</option>
                    <option value="40">40分(+2000)</option>
                    <option value="60">60分(+3000)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">降地（到着地）の状況</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">階数（階段）</label>
                  <select value={stairsUnload} onChange={e => setStairsUnload(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white">
                    <option value="1">1階/EV有</option>
                    <option value="2">階段2階(+1500)</option>
                    <option value="3">階段3階(+3000)</option>
                    <option value="4">階段4階(+4500)</option>
                    <option value="5">階段5階(+6000)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">台車移動距離</label>
                  <select value={walkDistUnload} onChange={e => setWalkDistUnload(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white">
                    <option value="20">20m未満</option>
                    <option value="50">50m未満(+1000)</option>
                    <option value="100">100m未満(+2000)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">待機時間</label>
                  <select value={waitTimeUnload} onChange={e => setWaitTimeUnload(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-xs outline-none bg-white">
                    <option value="0">なし</option>
                    <option value="20">20分(+1000)</option>
                    <option value="40">40分(+2000)</option>
                    <option value="60">60分(+3000)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 割増状況の可視化 (心理的納得感) */}
          <div className="flex flex-wrap gap-2">
            {weather === '雨/雪' && <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100"><CloudRain size={10}/> 悪天候割増適用中(+10%)</span>}
          </div>
        </div>

        {/* 総額表示 */}
        <div className="mt-8 bg-slate-900 p-6 rounded-3xl text-center text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
          <p className="text-xs font-bold text-slate-400 mb-2">概算お見積り総額（税込）</p>
          <div className="text-5xl font-black text-emerald-400 mb-2">
            ¥{calculateFare().toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">※実際の道路状況や荷物量により変動する場合があります</p>
        </div>

        {/* クロージングメッセージ */}
        <div className="mt-6 flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
            <img src={PROFILE_IMAGE_URL} alt="たけさん" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              「日本中を走り抜いた代表のたけさんが、責任を持って最速手配します！安心してお任せください。」
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <button 
            onClick={() => {
              if (!origin || !destination || !distance) { alert('出発地と到着地、距離を入力してください'); return; }
              const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
              const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
              const newReceiptNo = `T-${dateStr}-${randomNum}`;
              
              setSimulatorData({
                receiptNo: newReceiptNo,
                origin,
                destination,
                distance,
                speedType,
                estimatedFare: calculateFare(),
                options: `期間:${startTime.replace('T', ' ')}〜${endTime.replace('T', ' ')}, 車両:${vehicleCount}台, 荷物:${cargoSize}, 作業員:${extraWorkers}, 天候:${weather}`,
                isEstimate: true
              });
              setView('consult-delivery');
            }} 
            className="w-full bg-slate-800 text-white font-black py-5 rounded-2xl hover:bg-slate-900 transition-all shadow-lg text-lg flex items-center justify-center gap-2"
          >
            見積もりを依頼する
          </button>
          <button 
            onClick={() => {
              if (!origin || !destination || !distance) { alert('出発地と到着地、距離を入力してください'); return; }
              const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
              const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
              const newReceiptNo = `T-${dateStr}-${randomNum}`;
              
              setSimulatorData({
                receiptNo: newReceiptNo,
                origin,
                destination,
                distance,
                speedType,
                estimatedFare: calculateFare(),
                options: `期間:${startTime.replace('T', ' ')}〜${endTime.replace('T', ' ')}, 車両:${vehicleCount}台, 荷物:${cargoSize}, 作業員:${extraWorkers}, 天候:${weather}`,
                isEstimate: false
              });
              setView('consult-delivery');
            }} 
            className="w-full bg-[#52a285] text-white font-black py-5 rounded-2xl hover:bg-[#3d7a64] transition-all shadow-lg shadow-emerald-100 text-lg flex items-center justify-center gap-2"
          >
            <Send size={20} /> 正式に依頼する
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ConsultDeliveryView({ setView, simulatorData }: { setView: (view: ViewState) => void, simulatorData: any }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactMethod, setContactMethod] = useState<'line' | 'email'>('line');
  const [zipcode, setZipcode] = useState('');
  const [address, setAddress] = useState('');
  
  const [origin] = useState(simulatorData?.origin || '');
  const [destination] = useState(simulatorData?.destination || '');
  const [distance] = useState(simulatorData?.distance || '');
  const [estimatedFare] = useState(simulatorData?.estimatedFare || '');
  const [options] = useState(simulatorData?.options || '');
  const [speedType] = useState(simulatorData?.speedType || '通常便');
  const [receiptNo] = useState(simulatorData?.receiptNo || '');
  const [isEstimate] = useState(simulatorData?.isEstimate || false);
  
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    if (!mobile) {
      setContactMethod('email');
    }
    window.scrollTo(0, 0);
  }, []);

  const handleZipcodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setZipcode(val);
    if (val.length === 7) {
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${val}`);
        const data = await res.json();
        if (data.results) {
          const result = data.results[0];
          setAddress(`${result.address1}${result.address2}${result.address3}`);
          // 住所入力欄にフォーカスを当てて、番地や丁目の入力を促す
          setTimeout(() => {
            document.getElementById('address-input')?.focus();
          }, 100);
        }
      } catch (error) {
        console.error('Zipcode error:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (!name || !phone || !details || !termsAgreed || !email) {
      setTimeout(() => {
        const firstInvalid = document.querySelector('.invalid-field');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a shake animation class temporarily
          const allInvalids = document.querySelectorAll('.invalid-field');
          allInvalids.forEach(el => {
            el.classList.add('animate-shake');
            setTimeout(() => el.classList.remove('animate-shake'), 500);
          });
        }
      }, 100);
      return;
    }

    await executeSubmit();
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        type: 'customer',
        receiptNo,
        name,
        phone,
        email,
        address,
        origin,
        destination,
        distance,
        speedType,
        estimatedFare,
        options,
        details: isEstimate ? `【見積もり依頼】\n連絡希望: ${contactMethod === 'line' ? 'LINE' : 'メール'}\n${details}` : `【正式依頼】\n連絡希望: ${contactMethod === 'line' ? 'LINE' : 'メール'}\n${details}`
      };

      await Promise.race([
        fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]);

      setSubmitStatus('success');
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => setView('simulator')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4">
        <ArrowLeft size={16} /> シミュレーターに戻る
      </button>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{isEstimate ? '見積もり依頼フォーム' : '正式依頼フォーム'}</h2>
          <div className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">No. {receiptNo}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* シミュレーション結果のサマリー */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1 uppercase tracking-wider">配送種別</label>
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <Zap size={12} className={speedType === '通常便' ? 'text-slate-400' : 'text-amber-500'} />
                  {speedType}
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1 uppercase tracking-wider">概算見積</label>
                <div className="font-bold text-[#52a285] text-lg">¥{Number(estimatedFare).toLocaleString()}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-200 pt-2">
              <span className="font-bold">ルート:</span> {origin} → {destination} ({distance}km)
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">お名前 <Badge type="required" /></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例：山田 太郎" className={`w-full p-3 rounded-xl border outline-none transition-all ${showErrors && !name ? 'border-red-500 bg-red-50/50 invalid-field' : 'border-slate-200 focus:border-[#52a285]'}`} required />
              {showErrors && !name && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><Info size={12} /> お名前を入力してください</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">電話番号 <Badge type="required" /></label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="例：09012345678" className={`w-full p-3 rounded-xl border outline-none transition-all ${showErrors && !phone ? 'border-red-500 bg-red-50/50 invalid-field' : 'border-slate-200 focus:border-[#52a285]'}`} required />
              {showErrors && !phone && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><Info size={12} /> 電話番号を入力してください</p>}
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">希望する連絡手段 <Badge type="required" /></label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="contactMethod" value="line" checked={contactMethod === 'line'} onChange={() => setContactMethod('line')} className="w-4 h-4 accent-[#52a285]" />
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><MessageCircle size={16} className="text-[#06C755]"/> LINE（推奨）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="contactMethod" value="email" checked={contactMethod === 'email'} onChange={() => setContactMethod('email')} className="w-4 h-4 accent-[#52a285]" />
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><Mail size={16} className="text-slate-500"/> メール</span>
                </label>
              </div>
              {contactMethod === 'line' && <p className="text-xs text-emerald-600 mt-2 font-bold">※送信完了後、公式LINEへ受付番号を送信していただきます。</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">メールアドレス <Badge type="required" /></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="例：example@mail.com" className={`w-full p-3 rounded-xl border outline-none transition-all ${showErrors && !email ? 'border-red-500 bg-red-50/50 invalid-field' : 'border-slate-200 focus:border-[#52a285]'}`} required />
              {showErrors && !email && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><Info size={12} /> メールアドレスを入力してください</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-slate-800 mb-2">郵便番号 <Badge type="optional" /></label>
              <input type="text" value={zipcode} onChange={handleZipcodeChange} placeholder="例：1234567" maxLength={7} className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">ご住所 <Badge type="optional" /></label>
              <input id="address-input" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="例：山口県下関市〇〇1-2-3" className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">依頼内容・詳細 <Badge type="required" /></label>
            <textarea rows={4} value={details} onChange={e => setDetails(e.target.value)} placeholder="荷物の内容、希望日時などを詳しくご記入ください。" className={`w-full p-3 rounded-xl border outline-none resize-none transition-all ${showErrors && !details ? 'border-red-500 bg-red-50/50 invalid-field' : 'border-slate-200 focus:border-[#52a285]'}`} required></textarea>
            {showErrors && !details && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><Info size={12} /> 依頼内容・詳細を入力してください</p>}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} className={`w-5 h-5 rounded border-slate-300 focus:ring-[#52a285] transition-all ${showErrors && !termsAgreed ? 'invalid-field outline outline-2 outline-red-500 outline-offset-2' : 'text-[#52a285]'}`} required />
              <span className={`text-sm font-bold ${showErrors && !termsAgreed ? 'text-red-500' : 'text-slate-800'}`}>
                <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }} className="text-[#52a285] hover:underline">利用規約とプライバシーポリシー</button>に同意する <Badge type="required" />
              </span>
            </label>
            {showErrors && !termsAgreed && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><Info size={12} /> 同意が必要です</p>}
          </div>

          <div className="space-y-4">
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#52a285] text-white font-black py-5 rounded-2xl hover:bg-[#3d7a64] transition-all shadow-lg shadow-emerald-100 text-lg flex justify-center items-center gap-2">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  送信中...
                </>
              ) : (
                <>
                  <Send size={20} /> {isEstimate ? 'この内容で見積もりを依頼する' : 'この内容で正式に依頼する'}
                </>
              )}
            </button>
            
            {/* クロージングメッセージ */}
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <ShieldCheck size={16} />
              <span className="text-xs font-bold">SSL暗号化通信で情報は守られています</span>
            </div>
          </div>
        </form>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">利用規約・プライバシーポリシー</h3>
              <button onClick={() => setShowPrivacyPolicy(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-4 space-y-6 text-sm text-slate-600 leading-relaxed">
              <section>
                <h4 className="font-bold text-slate-800 mb-2">第1条（個人情報の取扱い）</h4>
                <p>当サービスは、お客様からお預かりした個人情報（氏名、住所、電話番号、メールアドレス等）を、配送業務およびそれに付随する連絡の目的のみに使用し、適切な管理を行います。</p>
              </section>
              <section>
                <h4 className="font-bold text-slate-800 mb-2">第2条（第三者への提供）</h4>
                <p>法令に基づく場合を除き、お客様の同意なく第三者に個人情報を提供することはありません。</p>
              </section>
              <section>
                <h4 className="font-bold text-slate-800 mb-2">第3条（免責事項）</h4>
                <p>シミュレーターで算出される運賃は概算であり、実際の荷物量や当日の状況により変動する場合があります。最終的な運賃は、ドライバーとの確認後に確定いたします。</p>
              </section>
              <section>
                <h4 className="font-bold text-slate-800 mb-2">第4条（キャンセルポリシー及び違約金）</h4>
                <p className="mb-2">本フォームより正式にご依頼いただいた内容について、お客様都合によるキャンセルの場合は、以下の通りキャンセル料（違約金）を請求いたします。</p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                  <li>配送予定日の前日キャンセル：<strong>お見積り運賃の50%</strong></li>
                  <li>配送予定日の当日キャンセル：<strong>お見積り運賃の100%</strong></li>
                </ul>
                <p>本同意をもって、上記キャンセル料の支払義務に法的に同意したものとみなします。万が一、正当な理由なくお支払いに応じていただけない場合は、ご入力いただいた連絡先情報を基に、法的措置（支払督促等）へ移行する場合がございます。</p>
              </section>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  setTermsAgreed(true);
                  setShowPrivacyPolicy(false);
                }}
                className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-900 transition-colors"
              >
                同意して閉じる
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Modal */}
      {submitStatus === 'success' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl">
            
            {contactMethod === 'line' ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">送信完了！...あと1ステップです</h3>
                <p className="text-slate-600 mb-4 text-sm">
                  ご依頼データは<strong className="text-emerald-600">無事にたけさんへ送信されました</strong>のでご安心ください。<br/>
                  最後に、今後のスムーズなやり取りのため、公式LINEへ以下の受付番号を送信してください。
                </p>
                
                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-left border border-slate-200">
                  <p className="text-sm font-bold text-slate-800 mb-2">📱 スマホをご利用の方</p>
                  <ol className="text-xs text-slate-600 mb-4 space-y-1 list-decimal list-inside">
                    <li>下の「受付番号」をコピーする</li>
                    <li>「LINEを開く」ボタンを押す</li>
                    <li>トーク画面に番号を貼り付けて送信！</li>
                  </ol>

                  <p className="text-sm font-bold text-slate-800 mb-2 mt-4">💻 PCをご利用の方</p>
                  <ol className="text-xs text-slate-600 mb-4 space-y-1 list-decimal list-inside">
                    <li>スマホのカメラで下のQRコードを読み取る</li>
                    <li>スマホのLINEで友達追加する</li>
                    <li>トーク画面に下の「受付番号」を手入力して送信！</li>
                  </ol>
                  
                  <div className="flex justify-center mb-4">
                    <img src={LINE_QR_URL} alt="LINE QR" className="w-32 h-32 border border-slate-200 rounded-xl" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4 mt-4">
                    <code className="flex-1 bg-white p-2 rounded border border-slate-200 text-emerald-600 font-bold text-center">
                      {receiptNo}
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(receiptNo);
                        alert('受付番号をコピーしました！');
                      }} 
                      className="p-2 bg-slate-200 rounded hover:bg-slate-300 text-xs font-bold"
                    >
                      コピー
                    </button>
                  </div>
                  <a href={`https://line.me/R/oaMessage/@771sxuxl/?text=${encodeURIComponent(`受付番号:${receiptNo}`)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#06C755] text-white font-bold py-3 rounded-xl hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-2">
                    <MessageCircle size={20} /> LINEを開く
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{isEstimate ? '見積もり依頼を受け付けました！' : 'ご依頼ありがとうございます！'}</h3>
                <p className="text-slate-600 mb-6 text-sm">
                  受付番号: <span className="font-bold text-emerald-600">{receiptNo}</span><br/>
                  ご入力いただいたメールアドレス宛に、折り返しご連絡差し上げます。
                </p>
              </>
            )}

            <button onClick={() => setView('top')} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors mt-2">
              トップページへ戻る
            </button>
          </motion.div>
        </div>
      )}

      {/* Error Modal */}
      {submitStatus === 'error' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">送信エラー</h3>
            <p className="text-slate-600 mb-6 text-sm">
              送信中にエラーが発生しました。<br/>通信環境をご確認の上、再度お試しください。
            </p>
            <button onClick={() => setSubmitStatus('idle')} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors">
              閉じる
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function ContactFields({ name, setName, phone, setPhone, method, setMethod }: any) {
  return (
    <div className="border-t border-slate-200 pt-6 mt-6 space-y-6">
      <h3 className="font-bold text-slate-800">ご連絡先</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">お名前</label>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：山田 太郎" 
            className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none" 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">電話番号</label>
          <input 
            type="tel" 
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="例：09012345678" 
            className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none" 
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-2">返信希望 (必須)</label>
        <select 
          value={method}
          onChange={e => setMethod(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
        >
          <option value="">選択してください</option>
          <option value="LINEで返信希望">LINEで返信希望</option>
          <option value="メールで返信希望">メールで返信希望</option>
          <option value="電話で返信希望">電話で返信希望</option>
        </select>
      </div>
    </div>
  );
}

// Reusable File Upload Component
function FileUpload({ label, required, hint, onFileSelect }: { label: string, required: boolean, hint?: string, onFileSelect: (base64: string) => void }) {
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMsg('');
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('ファイルサイズが大きすぎます（5MBまで）');
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
          <input type="file" className="hidden" accept="image/*" onChange={handleChange} />
        </label>
        <span className="text-sm text-slate-400 truncate">{fileName || '選択されていません'}</span>
      </div>
      {errorMsg && <p className="text-xs text-red-500 mt-2 font-bold">{errorMsg}</p>}
      {hint && !errorMsg && <p className="text-xs text-slate-400 mt-2">{hint}</p>}
    </div>
  );
}

// Helper component for badges
function Badge({ type }: { type: 'required' | 'optional' }) {
  if (type === 'required') {
    return <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>;
  }
  if (type === 'optional') {
    return <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-bold border border-slate-200">任意</span>;
  }
  return null;
}

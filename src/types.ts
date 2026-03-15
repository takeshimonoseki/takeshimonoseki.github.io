// 画面ルーティング用の状態
export type ViewState =
  | 'top'
  | 'vehicle'
  | 'simulator'
  | 'consult-delivery-estimate'
  | 'consult-delivery-order'
  | 'register'
  | 'terms'
  | 'privacy'
  | 'notice'
  | 'driver-notice'
  | 'pre-open';

// 車両相談の種別
export type VehicleConsultKind = 'purchase' | 'repair' | 'inspection';

// 運賃計算器の入力
export type SimulatorInput = {
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

// 配送相談フォーム（見積・正式依頼共通）
export type DeliveryFormData = {
  name: string;
  email: string;
  phone: string;
  zipcode: string;
  address: string;
};

// 協力ドライバー登録フォーム
export type DriverRegisterFormData = {
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

export type DriverFiles = Record<string, string>;
export type DriverFileNames = Record<string, string>;

// 車両相談フォーム
export type VehicleConsultFormData = {
  name: string;
  phone: string;
  email: string;
  maker: string;
  model: string;
  modelUndecided: boolean;
  purchaseBudget: string;
  purchaseDelivery: string;
  purchaseNotes: string;
  repairSymptom: string;
  repairSince: string;
  repairDrivable: string;
  repairNotes: string;
  inspectionTiming: string;
  inspectionPreference: string;
  inspectionNotes: string;
};

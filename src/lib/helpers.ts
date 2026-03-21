// ストレージ・API・計算・デフォルト値など共通ヘルパー
import type {
  SimulatorInput,
  DeliveryFormData,
  DriverRegisterFormData,
  VehicleConsultFormData,
  VehicleConsultKind
} from '../types';
import { GAS_URL } from '../constants';

// --- LocalStorage ---
export function loadLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveLocalStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}

export function removeLocalStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

// --- デバイス・入力 ---
export function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function normalizeZip(value: string) {
  return value
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, '');
}

export async function searchAddressByZip(zipcode: string) {
  const zip = normalizeZip(zipcode);
  if (zip.length !== 7) return '';
  const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
  const data = await res.json();
  if (!data?.results?.[0]) return '';
  const result = data.results[0];
  return `${result.address1}${result.address2}${result.address3}`;
}

// --- 受付番号・ID ---
export function generateReceiptNo(prefix: 'T' | 'D' | 'V') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const d = parts.find((p) => p.type === 'day')?.value ?? '';
  const dateStr = `${y}${m}${d}`;
  const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${dateStr}-${randomNum}`;
}

export function generateCorrelationId() {
  return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateIdempotencyKey(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

// --- 運賃計算器 ---
export function getOptionsSummary(input: SimulatorInput) {
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

export function calculateFare(input: SimulatorInput) {
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

// --- GAS 送信 ---
/** GAS doPost の JSON 応答（Code.gs の buildJsonResponse_） */
export type GasSubmitResult = {
  result?: string;
  receipt_no?: string;
  saved?: boolean;
  message?: string;
  mail_sent?: boolean;
  line_sent?: boolean;
  debugId?: string;
  ok?: boolean;
};

function getReceiptNoFromPayload(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'receiptNo' in payload) {
    return String((payload as { receiptNo: unknown }).receiptNo ?? '');
  }
  return '';
}

function isGasSuccess(data: GasSubmitResult): boolean {
  return data.saved === true || data.result === 'OK';
}

function buildVerifyUrl(receiptNo: string): string {
  const sep = GAS_URL.includes('?') ? '&' : '?';
  return `${GAS_URL}${sep}type=verify&receiptNo=${encodeURIComponent(receiptNo)}`;
}

/** 受付番号がシートに現れるまで GET で確認（GAS の type=verify） */
async function pollVerifyReceipt(receiptNo: string): Promise<void> {
  for (let i = 0; i < 20; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 2000));
    }
    try {
      const res = await fetch(buildVerifyUrl(receiptNo), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      const text = await res.text();
      const data = JSON.parse(text) as { saved?: boolean };
      if (data.saved === true) return;
    } catch {
      // 再試行
    }
  }
  throw new Error(
    '送信が完了したか確認できませんでした。スプレッドシートまたはメールをご確認ください。'
  );
}

async function tryVerifyOnly(receiptNo: string): Promise<GasSubmitResult> {
  await pollVerifyReceipt(receiptNo);
  return {
    result: 'OK',
    receipt_no: receiptNo,
    saved: true,
    message: '受付を確認しました'
  };
}

/** CORS で応答が読めない場合のフォールバック（no-cors POST → verify GET） */
async function submitNoCorsThenVerify(payload: unknown, receiptNo: string): Promise<GasSubmitResult> {
  await fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload),
    keepalive: true
  });
  await new Promise((r) => setTimeout(r, 2000));
  await pollVerifyReceipt(receiptNo);
  return {
    result: 'OK',
    receipt_no: receiptNo,
    saved: true,
    message: '受付を確認しました'
  };
}

/**
 * GAS に送信し、応答 JSON で成功/失敗を判定する。
 * - 通常: mode=cors で POST、result / saved を解釈
 * - タイムアウト: 受付番号で verify GET のみ試行（二重 POST しない）
 * - CORS/ネットワーク失敗: no-cors POST 後に verify GET
 */
export async function submitToGas(payload: unknown): Promise<GasSubmitResult> {
  const receiptNo = getReceiptNoFromPayload(payload);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    let data: GasSubmitResult;
    try {
      data = JSON.parse(text) as GasSubmitResult;
    } catch {
      throw new Error('サーバーからの応答を読み取れませんでした。');
    }

    if (!isGasSuccess(data)) {
      throw new Error(data.message || '送信に失敗しました');
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    const e = err instanceof Error ? err : new Error(String(err));

    if (e.name === 'AbortError' && receiptNo) {
      try {
        return await tryVerifyOnly(receiptNo);
      } catch {
        throw new Error(
          '送信がタイムアウトしました。スプレッドシートに受付番号があれば受付済みです。ページを閉じず、必要なら再送をご検討ください。'
        );
      }
    }

    if (e instanceof TypeError && receiptNo) {
      return submitNoCorsThenVerify(payload, receiptNo);
    }

    throw e;
  }
}

// --- 車両相談ラベル ---
export function getVehicleKindLabel(kind: VehicleConsultKind) {
  if (kind === 'purchase') return '車両購入相談';
  if (kind === 'repair') return '修理・整備相談';
  return '車検相談';
}

// --- フォームデフォルト値 ---
export function defaultSimulatorInput(): SimulatorInput {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  const preferredDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

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

export function defaultDeliveryFormData(): DeliveryFormData {
  return {
    name: '',
    email: '',
    phone: '',
    zipcode: '',
    address: ''
  };
}

export function defaultDriverRegisterFormData(): DriverRegisterFormData {
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

export function defaultVehicleConsultFormData(): VehicleConsultFormData {
  return {
    name: '',
    phone: '',
    email: '',
    maker: '',
    model: '',
    modelUndecided: false,
    purchaseBudget: '',
    purchaseDelivery: '',
    purchaseNotes: '',
    repairSymptom: '',
    repairSince: '',
    repairDrivable: '',
    repairNotes: '',
    inspectionTiming: '',
    inspectionPreference: '',
    inspectionNotes: ''
  };
}

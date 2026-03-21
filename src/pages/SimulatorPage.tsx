// 運賃計算器ページ
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Info, MapPin, Zap } from 'lucide-react';
import type { ViewState } from '../types';
import type { SimulatorInput } from '../types';
import { COMMON_ROUTES } from '../constants';
import {
  defaultSimulatorInput,
  calculateFare,
  loadLocalStorage,
  saveLocalStorage
} from '../lib/helpers';
import { DevTestBar, OptionBlock } from '../components/ui';

type SetView = (view: ViewState) => void;

export function SimulatorPage({
  setView,
  simulatorInput,
  setSimulatorInput
}: {
  setView: SetView;
  simulatorInput: SimulatorInput;
  setSimulatorInput: React.Dispatch<React.SetStateAction<SimulatorInput>>;
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

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

  const invalidOrigin = showErrors && !simulatorInput.origin.trim();
  const invalidDestination = showErrors && !simulatorInput.destination.trim();
  const invalidDistance = showErrors && !simulatorInput.distance.trim();
  const invalidCargoDetail = showErrors && !simulatorInput.cargoDetail.trim();
  const invalidPreferredDate = showErrors && !simulatorInput.preferredDate.trim();

  const handleProceed = (nextView: ViewState) => {
    setShowErrors(true);
    if (!requiredOk) {
      const firstInvalid = document.querySelector('.simulator-invalid-field');
      if (firstInvalid instanceof HTMLElement) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in firstInvalid) {
          window.setTimeout(() => firstInvalid.focus(), 120);
        }
      }
      return;
    }
    setView(nextView);
  };

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
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                集荷先
                <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simulatorInput.origin}
                  onChange={(e) => update({ origin: e.target.value })}
                  placeholder="例：山口県下関市〇〇"
                  className={`flex-1 p-3 rounded-xl border outline-none ${
                    invalidOrigin
                      ? 'border-red-500 bg-red-50/50 simulator-invalid-field'
                      : 'border-slate-200 focus:border-[#52a285]'
                  }`}
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
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                納品先
                <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>
              </label>
              <input
                type="text"
                value={simulatorInput.destination}
                onChange={(e) => update({ destination: e.target.value })}
                placeholder="例：福岡県福岡市〇〇"
                className={`w-full p-3 rounded-xl border outline-none ${
                  invalidDestination
                    ? 'border-red-500 bg-red-50/50 simulator-invalid-field'
                    : 'border-slate-200 focus:border-[#52a285]'
                }`}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900">
                距離（km）
                <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>
              </label>
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
                className={`w-full p-3 rounded-xl border outline-none bg-white font-mono text-lg ${
                  invalidDistance
                    ? 'border-red-500 bg-red-50/50 simulator-invalid-field'
                    : 'border-blue-200 focus:border-blue-500'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 font-bold">km</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">荷物量</label>
              <select
                value={simulatorInput.cargoSize}
                onChange={(e) => update({ cargoSize: e.target.value as SimulatorInput['cargoSize'] })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#52a285] outline-none bg-white"
              >
                <option value="小">小</option>
                <option value="中">中</option>
                <option value="大">大</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                希望日時
                <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>
              </label>
              <input
                type="datetime-local"
                value={simulatorInput.preferredDate}
                onChange={(e) => update({ preferredDate: e.target.value })}
                className={`w-full p-3 rounded-xl border outline-none bg-white ${
                  invalidPreferredDate
                    ? 'border-red-500 bg-red-50/50 simulator-invalid-field'
                    : 'border-slate-200 focus:border-[#52a285]'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
              荷物内容
              <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">必須</span>
            </label>
            <textarea
              rows={3}
              value={simulatorInput.cargoDetail}
              onChange={(e) => update({ cargoDetail: e.target.value })}
              placeholder="例：段ボール10箱、折りたたみ机1台、椅子2脚"
              className={`w-full p-3 rounded-xl border outline-none resize-none ${
                invalidCargoDetail
                  ? 'border-red-500 bg-red-50/50 simulator-invalid-field'
                  : 'border-slate-200 focus:border-[#52a285]'
              }`}
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
                onChange={(e) => update({ speedType: e.target.value as SimulatorInput['speedType'] })}
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
          <div className="text-5xl font-black text-emerald-400 mb-2">¥{fare.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500">※実際の荷物量や現地状況により変動する場合があります</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <button
            type="button"
            onClick={() => handleProceed('consult-delivery-estimate')}
            className="w-full bg-slate-800 text-white font-black py-5 rounded-2xl hover:bg-slate-900 transition-all shadow-lg text-lg"
          >
            この内容で見積依頼する
          </button>
          <button
            type="button"
            onClick={() => handleProceed('consult-delivery-order')}
            className="w-full bg-[#52a285] text-white font-black py-5 rounded-2xl hover:bg-[#3d7a64] transition-all shadow-lg shadow-emerald-100 text-lg"
          >
            この内容で依頼する
          </button>
        </div>
        {showErrors && !requiredOk && (
          <p className="text-xs text-red-500 font-bold mt-4 flex items-center gap-1">
            <Info size={12} />
            未入力の必須項目があります。赤枠を埋めて、もう一度押してください。
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ルーティング・レイアウト（ヘッダー・メイン・フッター）
import React, { useEffect, useState } from 'react';
import type { ViewState } from './types';
import type { SimulatorInput, DeliveryFormData } from './types';
import {
  SITE_NAME,
  LINE_FRIEND_ADD_URL,
  LINE_QR_URL,
  LINE_ACCOUNT_NAME,
  LOGO_IMAGE_URL,
  SIMULATOR_STORAGE_KEY,
  DELIVERY_ESTIMATE_FORM_STORAGE_KEY,
  DELIVERY_ORDER_FORM_STORAGE_KEY
} from './constants';
import {
  loadLocalStorage,
  saveLocalStorage,
  defaultSimulatorInput,
  defaultDeliveryFormData
} from './lib/helpers';
import { TopPage } from './pages/TopPage';
import { PreOpenPage } from './pages/PreOpenPage';
import { VehicleConsultPage } from './pages/VehicleConsultPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { DeliveryRequestPage } from './pages/DeliveryRequestPage';
import { RegisterPage } from './pages/RegisterPage';
import {
  TermsPage,
  PrivacyPage,
  NoticePage,
  DriverNoticePage
} from './pages/StaticPages';

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

  const isDeliveryActive =
    currentView === 'simulator' ||
    currentView === 'consult-delivery-estimate' ||
    currentView === 'consult-delivery-order';

  return (
    <div className="min-h-screen bg-[#f4f7f6] font-sans text-slate-800">
      <header className="bg-[#f4f7f6]/95 border-b border-slate-200/70 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-4">
            <button
              type="button"
              className="flex items-center gap-3 min-w-0"
              onClick={() => setCurrentView('top')}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-white shadow-sm shrink-0">
                <img src={LOGO_IMAGE_URL} alt={`${SITE_NAME} ロゴ`} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col text-left min-w-0">
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
                className={`hover:text-[#52a285] transition-colors ${currentView === 'top' ? 'text-[#52a285]' : ''}`}
              >
                トップ
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('simulator')}
                className={`hover:text-[#52a285] transition-colors ${isDeliveryActive ? 'text-[#52a285]' : ''}`}
              >
                配送相談・見積依頼
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('register')}
                className={`hover:text-[#52a285] transition-colors ${
                  currentView === 'register' ? 'text-[#52a285]' : ''
                }`}
              >
                協力ドライバー募集・登録
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <img
                src={LINE_QR_URL}
                alt={`${LINE_ACCOUNT_NAME} QRコード`}
                className="w-14 h-14 rounded-lg border border-slate-200 bg-white"
              />
              <div className="text-left">
                <p className="text-[11px] font-black text-slate-700">LINEで補助相談</p>
                <p className="text-[10px] text-slate-400 mb-1">正式受付はフォーム送信</p>
                <a
                  href={LINE_FRIEND_ADD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#06C755] hover:underline"
                >
                  友だち追加はこちら
                </a>
              </div>
            </div>

            <a
              href={LINE_FRIEND_ADD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="xl:hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#06C755] shadow-sm"
            >
              LINE追加
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentView === 'top' && <TopPage setView={setCurrentView} />}
        {currentView === 'pre-open' && <PreOpenPage setView={setCurrentView} />}
        {currentView === 'vehicle' && <VehicleConsultPage setView={setCurrentView} />}
        {currentView === 'simulator' && (
          <SimulatorPage
            setView={setCurrentView}
            simulatorInput={simulatorInput}
            setSimulatorInput={setSimulatorInput}
          />
        )}
        {currentView === 'consult-delivery-estimate' && (
          <DeliveryRequestPage
            mode="estimate"
            setView={setCurrentView}
            simulatorInput={simulatorInput}
            formData={estimateFormData}
            setFormData={setEstimateFormData}
          />
        )}
        {currentView === 'consult-delivery-order' && (
          <DeliveryRequestPage
            mode="order"
            setView={setCurrentView}
            simulatorInput={simulatorInput}
            formData={orderFormData}
            setFormData={setOrderFormData}
          />
        )}
        {currentView === 'register' && <RegisterPage setView={setCurrentView} />}
        {currentView === 'terms' && <TermsPage setView={setCurrentView} />}
        {currentView === 'privacy' && <PrivacyPage setView={setCurrentView} />}
        {currentView === 'notice' && <NoticePage setView={setCurrentView} />}
        {currentView === 'driver-notice' && <DriverNoticePage setView={setCurrentView} />}
      </main>

      <footer className="text-center py-12 text-xs text-slate-400 space-y-2 mt-20 border-t border-slate-200">
        <p>{SITE_NAME} | 山口県下関市を中心に</p>
        <p>配送相談・協力ドライバー登録・車両相談の窓口</p>
        <p>LINEは補助導線、受付完了はフォーム送信が正本です</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
          <button type="button" onClick={() => setCurrentView('terms')} className="hover:text-slate-600 underline">
            利用案内
          </button>
          <button type="button" onClick={() => setCurrentView('privacy')} className="hover:text-slate-600 underline">
            プライバシーポリシー
          </button>
          <button type="button" onClick={() => setCurrentView('notice')} className="hover:text-slate-600 underline">
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

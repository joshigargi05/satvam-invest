import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';

const CheckCircle2 = Lucide.CheckCircle2 || Lucide.CheckCircle || (() => '✓');
const AlertTriangle = Lucide.AlertTriangle || (() => '⚠️');
const DollarSign = Lucide.DollarSign || (() => '$');
const X = Lucide.X || (() => '×');
const ArrowRight = Lucide.ArrowRight || (() => '→');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const ShieldCheck = Lucide.ShieldCheck || (() => '🛡️');
const Zap = Lucide.Zap || (() => '⚡');

/**
 * TradeResultModal
 * Replaces crude browser alert() popups with a sleek, institutional trade execution box.
 * Supports: Buy Confirmation, Sell Confirmation, Insufficient Funds / Order Alerts.
 */
export function TradeResultModal({ modalState, onClose }) {
  let navigate = null;
  try {
    navigate = useNavigate();
  } catch (err) {
    navigate = null;
  }

  if (!modalState || !modalState.isOpen) return null;

  const {
    type = 'success', // 'success' | 'error' | 'warning'
    action = 'BUY',   // 'BUY' | 'SELL'
    ticker = '',
    name = '',
    units = 1,
    price = 0,
    total = 0,
    currency = '$',
    autoExit = null,
    market = 'US',
    balanceAfter = null,
    title = '',
    message = ''
  } = modalState;

  const isSuccess = type === 'success';
  const isBuy = action === 'BUY';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className={`relative w-full max-w-md max-h-[92vh] overflow-y-auto overscroll-contain rounded-2xl p-4 sm:p-6 text-white shadow-2xl border ${
          !isSuccess
            ? 'bg-slate-900/95 border-amber-500/50 shadow-amber-500/20'
            : isBuy
              ? 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-500/20'
              : 'bg-slate-900/95 border-rose-500/50 shadow-rose-500/20'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header Icon + Action Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
              !isSuccess
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : isBuy
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {!isSuccess ? (
              <AlertTriangle size={24} />
            ) : isBuy ? (
              <CheckCircle2 size={24} />
            ) : (
              <DollarSign size={24} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full border ${
                !isSuccess
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : isBuy
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {!isSuccess ? 'Order Notice' : isBuy ? 'Order Filled • Buy' : 'Order Filled • Sold'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {market === 'INDIA' ? '🇮🇳 Indian Market (₹)' : '🇺🇸 US Market ($)'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 leading-tight">
              {title || (isSuccess ? (isBuy ? `Bought ${units} ${units === 1 ? 'Share' : 'Shares'}` : `Sold ${units} ${units === 1 ? 'Share' : 'Shares'}`) : 'Order Not Executed')}
            </h3>
          </div>
        </div>

        {/* Main Body */}
        {isSuccess ? (
          <div className="space-y-4">
            {/* Ticker & Name */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xl font-black text-white">{ticker}</span>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[260px]">{name}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-mono">Execution Price</span>
                <span className="text-sm font-bold text-white font-mono">
                  {currency}{Number(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Transaction Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">{isBuy ? 'Total Invested' : 'Total Proceeds'}</span>
                <span className={`font-mono font-black text-base ${isBuy ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {currency}{Number(total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Updated Cash Balance</span>
                <span className="font-mono font-bold text-sm text-white">
                  {balanceAfter !== null
                    ? `${currency}${Number(balanceAfter).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'Synced'}
                </span>
              </div>
            </div>

            {/* Auto-Exit Rule Pill (if armed) */}
            {autoExit && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-2.5 text-xs text-blue-200">
                <Zap size={16} className="text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold block text-[11px] text-blue-300 uppercase tracking-wider">Auto-Exit Protection Armed</span>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {autoExit.mode === 'percentage'
                      ? `Take Profit @ +${autoExit.targetProfitPct}% (${currency}${Number(autoExit.targetPrice || (price * (1 + autoExit.targetProfitPct / 100))).toFixed(2)})`
                      : `Take Profit @ ${currency}${Number(autoExit.targetPrice).toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (typeof navigate === 'function') {
                    navigate('/portfolio');
                  } else {
                    window.location.href = '/portfolio';
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>📊 View in Portfolio</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Error / Notice Display */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
              {message}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-white/15 transition-all"
            >
              Understand &amp; Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SellPositionModal
 * Interactive sell order box replacing crude window.confirm() dialogs.
 * Lets users choose quantity, see exact proceeds, and liquidate into cash.
 */
export function SellPositionModal({ modalState, onClose, onConfirmSell }) {
  if (!modalState || !modalState.isOpen || !modalState.asset) return null;

  const asset = modalState.asset;
  const maxShares = Number(asset.shares || 1);
  const [sellShares, setSellShares] = useState(String(maxShares));

  const currentPrice = Number(asset.currentPrice || asset.avgPrice || 100);
  const sharesNum = Number(sellShares) || 0;
  const estimatedProceeds = Number((sharesNum * currentPrice).toFixed(2));
  const currency = asset.currency || (asset.market === 'INDIA' ? '₹' : '$');
  const isAllShares = sharesNum >= maxShares;

  const handlePercentageClick = (pct) => {
    const qty = pct === 100 ? maxShares : Number((maxShares * (pct / 100)).toFixed(2));
    setSellShares(String(qty));
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (sharesNum <= 0 || sharesNum > maxShares) return;
    onConfirmSell(asset.ticker, sharesNum, asset.bucket);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto overscroll-contain rounded-2xl p-4 sm:p-6 text-white shadow-2xl border border-rose-500/40 bg-slate-900/95 shadow-rose-500/15">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-lg shrink-0">
            <TrendingDown size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              Liquidate Holding
            </span>
            <h3 className="text-lg font-bold text-white mt-1 leading-tight">
              Sell {asset.ticker}
            </h3>
            <p className="text-xs text-slate-400">{asset.name || asset.ticker}</p>
          </div>
        </div>

        {/* Position Information */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs mb-4">
          <div>
            <span className="text-slate-400 block text-[11px]">Shares Held</span>
            <span className="font-mono font-bold text-white">{maxShares} shares</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Current Market Price</span>
            <span className="font-mono font-bold text-white">
              {currency}{currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Share Quantity Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Quantity to Sell
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.0001"
                max={maxShares}
                step="any"
                value={sellShares}
                onChange={(e) => setSellShares(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/20 text-white font-mono text-sm focus:outline-none focus:border-rose-400"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">shares</span>
            </div>

            {/* Quick Percentage Buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentageClick(pct)}
                  className={`py-1 rounded-lg text-[11px] font-bold font-mono transition-all border ${
                    (pct === 100 && isAllShares) || Math.abs(sharesNum - (maxShares * (pct / 100))) < 0.01
                      ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {pct === 100 ? 'All (100%)' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time Proceeds Callout */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/30 to-slate-900 border border-rose-500/30 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">Estimated Cash Proceeds:</span>
              <span className="text-base font-black font-mono text-rose-300">
                {currency}{estimatedProceeds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Funds will be instantly credited to your active {asset.market === 'INDIA' ? 'Indian (₹)' : 'US ($)'} wallet balance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/15 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sharesNum <= 0 || sharesNum > maxShares}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
            >
              Confirm Liquidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * CrossMarketPromptModal
 * Prompts user to switch markets when attempting to buy a cross-market stock (e.g. QCOM on India tab).
 */
export function CrossMarketPromptModal({ promptState, onClose, onSwitchAndBuy }) {
  if (!promptState || !promptState.isOpen || !promptState.asset) return null;

  const { asset, currentMarket } = promptState;
  const targetMarket = asset.market || (currentMarket === 'INDIA' ? 'US' : 'INDIA');
  const targetExchange = asset.exchange || (targetMarket === 'INDIA' ? 'NSE/BSE' : 'NASDAQ/NYSE');
  const targetCurrency = targetMarket === 'INDIA' ? '₹ INR' : '$ USD';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl p-6 text-white shadow-2xl border border-blue-500/40 bg-slate-900/95 shadow-blue-500/20">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xl shrink-0">
            {targetMarket === 'INDIA' ? '🇮🇳' : '🇺🇸'}
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
              Cross-Market Asset
            </span>
            <h3 className="text-lg font-bold text-white mt-1 leading-tight">
              Switch to {targetMarket === 'INDIA' ? 'Indian' : 'US'} Market to Buy
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300 leading-relaxed mb-4">
          <p>
            <strong className="text-white">{asset.ticker}</strong> ({asset.name}) is traded on <strong className="text-amber-300">{targetExchange}</strong> in <strong className="text-emerald-300">{targetCurrency}</strong>.
          </p>
          <p>
            You are currently browsing the {currentMarket === 'INDIA' ? 'Indian Market (₹ INR)' : 'US Market ($ USD)'}. To purchase this asset, switch to the {targetMarket === 'INDIA' ? 'Indian (₹)' : 'US ($)'} market where your corresponding cash wallet balance will be used.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/15 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSwitchAndBuy(targetMarket, asset)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Switch &amp; Buy</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Building2, Activity, RefreshCw, Database, Search, Home,
  Users, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ArrowUpRight, BarChart3, Target,
  Link2, DollarSign, PieChart
} from 'lucide-react';

const API_BASE = '';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatCompactCurrency = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount}`;
};

function getPaymentStatus(villa) {
  if (!villa.isSold) return 'available';
  if (villa.atsValue === 0) return 'available';
  const pct = villa.received / villa.atsValue;
  if (pct >= 0.75) return 'healthy';
  if (pct >= 0.25) return 'partial';
  if (villa.received > 0) return 'low';
  return 'zero';
}

function getStatusColor(status) {
  switch (status) {
    case 'healthy': return { bg: 'bg-emerald-500/80', border: 'border-emerald-400', text: 'text-emerald-400', label: 'Healthy (>75%)' };
    case 'partial': return { bg: 'bg-amber-500/70', border: 'border-amber-400', text: 'text-amber-400', label: 'Partial (25-75%)' };
    case 'low': return { bg: 'bg-orange-500/70', border: 'border-orange-400', text: 'text-orange-400', label: 'Low (<25%)' };
    case 'zero': return { bg: 'bg-rose-500/70', border: 'border-rose-400', text: 'text-rose-400', label: 'Zero Payment' };
    case 'available': return { bg: 'bg-slate-700/50', border: 'border-slate-600', text: 'text-slate-500', label: 'Available' };
    default: return { bg: 'bg-slate-700/50', border: 'border-slate-600', text: 'text-slate-500', label: '' };
  }
}

export default function VillasDashboard({ onViewChange }) {
  const [villas, setVillas] = useState([]);
  const [loadingState, setLoadingState] = useState('loading');
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('balance');
  const [sortDir, setSortDir] = useState('desc');
  const [hoveredVilla, setHoveredVilla] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsFetching(true);
    try {
      const res = await fetch(`${API_BASE}/api/villas`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setVillas(data.villas || []);
      setLoadingState('loaded');
    } catch (err) {
      console.error('Failed to fetch villas:', err);
      setLoadingState('error');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { fetchData(false); }, [fetchData]);

  const stats = useMemo(() => {
    const sold = villas.filter(v => v.isSold);
    const available = villas.filter(v => !v.isSold);
    const totalAtsValue = sold.reduce((s, v) => s + v.atsValue, 0);
    const totalReceived = sold.reduce((s, v) => s + v.received, 0);
    const totalBalance = sold.reduce((s, v) => s + v.balance, 0);
    const fullInventoryValue = villas.reduce((s, v) => s + (v.atsValue || 5100000), 0);
    const collectionRate = totalAtsValue > 0 ? (totalReceived / totalAtsValue) * 100 : 0;

    const statusGroups = { healthy: 0, partial: 0, low: 0, zero: 0, available: 0 };
    villas.forEach(v => { statusGroups[getPaymentStatus(v)]++; });

    const zeroPayment = sold.filter(v => v.received === 0);
    const topOutstanding = [...sold].sort((a, b) => b.balance - a.balance).slice(0, 5);
    const topCollected = [...sold].sort((a, b) => (b.received / b.atsValue) - (a.received / a.atsValue)).slice(0, 5);

    return {
      total: villas.length, sold: sold.length, available: available.length,
      totalAtsValue, totalReceived, totalBalance, fullInventoryValue,
      collectionRate, statusGroups, zeroPayment, topOutstanding, topCollected
    };
  }, [villas]);

  const filteredVillas = useMemo(() => {
    let list = villas.filter(v => v.isSold);
    if (selectedStatus !== 'all') {
      list = list.filter(v => getPaymentStatus(v) === selectedStatus);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(v => v.clientName.toLowerCase().includes(term) || v.villaNo.toLowerCase().includes(term));
    }
    list.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'name': aVal = a.clientName; bVal = b.clientName; return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'villa': aVal = a.srNo; bVal = b.srNo; break;
        case 'received': aVal = a.received; bVal = b.received; break;
        case 'balance': aVal = a.balance; bVal = b.balance; break;
        case 'pct': aVal = a.atsValue > 0 ? a.received / a.atsValue : 0; bVal = b.atsValue > 0 ? b.received / b.atsValue : 0; break;
        default: aVal = a.balance; bVal = b.balance;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [villas, searchTerm, sortField, sortDir, selectedStatus]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  if (loadingState === 'loading') {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-sm">Loading villa data...</p>
        </div>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Database className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <p className="text-slate-300 text-sm mb-4">Failed to load villa data.</p>
          <button onClick={() => { setLoadingState('loading'); fetchData(false); }} className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  const donutSlices = (() => {
    const total = stats.totalAtsValue || 1;
    const receivedPct = stats.totalReceived / total;
    const balancePct = stats.totalBalance / total;
    const slices = [];
    if (receivedPct > 0) slices.push({ name: 'Collected', pct: receivedPct, color: '#10b981', startPct: 0 });
    if (balancePct > 0) slices.push({ name: 'Outstanding', pct: balancePct, color: '#f43f5e', startPct: receivedPct });
    return slices;
  })();

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-slate-200 font-sans p-2 md:p-3 flex flex-col overflow-x-hidden bg-3d-base">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 shrink-0 gap-2 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2 drop-shadow-md">
            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            The Heritage, Narsinghpura
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5 flex items-center gap-2">
            <Activity className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
            Villa Sales & Collection Dashboard
            <span className="text-emerald-500 text-[10px] ml-1">● Live</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button onClick={() => onViewChange('financial')} className="px-3 py-1.5 text-xs font-semibold transition-colors text-slate-400 hover:text-white hover:bg-white/5">
              <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />Financials
            </button>
            <button className="px-3 py-1.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border-l border-white/10">
              <Home className="w-3.5 h-3.5 inline mr-1.5" />Villas
            </button>
          </div>
          <button onClick={() => fetchData()} disabled={isFetching} className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-purple-400 hover:text-purple-300 ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isFetching ? <RefreshCw className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Link2 className="w-3 h-3 md:w-4 md:h-4" />} Sync
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-3 shrink-0">
        <div className="panel-3d rounded-xl p-2.5 md:p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-[10px] md:text-xs font-medium">Total Inventory</span>
            <Home className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold font-mono text-white">{stats.total}</h3>
          <p className="text-[9px] text-slate-500 mt-0.5">Villas</p>
        </div>
        <div className="panel-3d rounded-xl p-2.5 md:p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-[10px] md:text-xs font-medium">Sold</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold font-mono text-emerald-400">{stats.sold}</h3>
          <p className="text-[9px] text-emerald-500/70 mt-0.5">{stats.total > 0 ? ((stats.sold / stats.total) * 100).toFixed(0) : 0}% sold</p>
        </div>
        <div className="panel-3d rounded-xl p-2.5 md:p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-[10px] md:text-xs font-medium">Available</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold font-mono text-cyan-400">{stats.available}</h3>
          <p className="text-[9px] text-cyan-500/70 mt-0.5">{formatCompactCurrency(stats.available * 5100000)} potential</p>
        </div>
        <div className="panel-3d rounded-xl p-2.5 md:p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-[10px] md:text-xs font-medium">Sales Value</span>
            <DollarSign className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold font-mono text-violet-400">{formatCompactCurrency(stats.totalAtsValue)}</h3>
          <p className="text-[9px] text-slate-500 mt-0.5">of sold units</p>
        </div>
        <div className="panel-3d rounded-xl p-2.5 md:p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-[10px] md:text-xs font-medium">Collected</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold font-mono text-emerald-400">{formatCompactCurrency(stats.totalReceived)}</h3>
          <p className="text-[9px] text-emerald-500/70 mt-0.5">{stats.collectionRate.toFixed(1)}% rate</p>
        </div>
        <div className="panel-3d rounded-xl p-2.5 md:p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-[10px] md:text-xs font-medium">Outstanding</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold font-mono text-rose-400">{formatCompactCurrency(stats.totalBalance)}</h3>
          <p className="text-[9px] text-rose-500/70 mt-0.5">{stats.zeroPayment.length} zero-pay clients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
        <div className="md:col-span-5 panel-3d rounded-xl p-2 md:p-3 flex flex-col max-h-[420px] overflow-hidden">
          <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-2 shrink-0 flex items-center gap-2">
            <Home className="w-3.5 h-3.5 text-blue-400" /> Villa Map
            <span className="text-[9px] text-slate-500 font-normal ml-auto flex gap-2">
              {Object.entries(stats.statusGroups).filter(([,c]) => c > 0).map(([status, count]) => {
                const sc = getStatusColor(status);
                return <span key={status} className="flex items-center gap-1"><span className={`inline-block w-2 h-2 rounded-sm ${sc.bg}`}></span>{count}</span>;
              })}
            </span>
          </h2>
          <div className="flex-1 grid grid-cols-12 gap-0.5 md:gap-1 auto-rows-min content-start overflow-y-auto custom-scrollbar pr-1 relative">
            {villas.map((villa) => {
              const status = getPaymentStatus(villa);
              const sc = getStatusColor(status);
              const pct = villa.atsValue > 0 ? ((villa.received / villa.atsValue) * 100).toFixed(0) : 0;
              const isHovered = hoveredVilla === villa.srNo;

              return (
                <div
                  key={villa.srNo}
                  className={`relative rounded-sm cursor-pointer transition-all duration-200 flex items-center justify-center ${sc.bg} ${isHovered ? `ring-1 ${sc.border} scale-110 z-10` : 'hover:brightness-125'}`}
                  style={{ aspectRatio: '1', minHeight: '20px' }}
                  onMouseEnter={() => setHoveredVilla(villa.srNo)}
                  onMouseLeave={() => setHoveredVilla(null)}
                >
                  <span className="text-[7px] md:text-[8px] font-bold text-white/80">{villa.srNo}</span>
                </div>
              );
            })}
          </div>
          {hoveredVilla && (() => {
            const v = villas.find(v => v.srNo === hoveredVilla);
            if (!v) return null;
            const pct = v.atsValue > 0 ? ((v.received / v.atsValue) * 100).toFixed(1) : 0;
            return (
              <div className="mt-1.5 shrink-0 bg-black/60 rounded-lg px-2.5 py-1.5 border border-white/10 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{v.villaNo}</span>
                  <span className={`font-bold ${getStatusColor(getPaymentStatus(v)).text}`}>{v.isSold ? `${pct}% paid` : 'Available'}</span>
                </div>
                {v.isSold && (
                  <div className="flex justify-between mt-0.5 text-slate-400">
                    <span>{v.clientName}</span>
                    <span>Bal: {formatCompactCurrency(v.balance)}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="md:col-span-3 panel-3d rounded-xl p-2 md:p-3 flex flex-col">
          <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-2 shrink-0 flex items-center gap-2">
            <PieChart className="w-3.5 h-3.5 text-violet-400" /> Collection Health
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <div className="relative w-28 h-28 md:w-36 md:h-36">
              <svg viewBox="-10 -10 120 120" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
                {donutSlices.map((slice, idx) => {
                  const getCoords = (p) => [Math.cos(2 * Math.PI * (p - 0.25)), Math.sin(2 * Math.PI * (p - 0.25))];
                  const [startX, startY] = getCoords(slice.startPct);
                  const endPct = slice.startPct + slice.pct;
                  const safeEnd = slice.pct >= 1 ? slice.startPct + 0.999 : endPct;
                  const [endX, endY] = getCoords(safeEnd);
                  const largeArc = slice.pct > 0.5 ? 1 : 0;
                  const d = [
                    `M ${50 + startX * 44} ${50 + startY * 44}`,
                    `A 44 44 0 ${largeArc} 1 ${50 + endX * 44} ${50 + endY * 44}`,
                    `L ${50 + endX * 28} ${50 + endY * 28}`,
                    `A 28 28 0 ${largeArc} 0 ${50 + startX * 28} ${50 + startY * 28}`, 'Z'
                  ].join(' ');
                  return <path key={idx} d={d} fill={slice.color} style={{ stroke: '#0a1128', strokeWidth: 1.5 }} />;
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg md:text-xl font-bold text-white">{stats.collectionRate.toFixed(0)}%</span>
                <span className="text-[8px] text-slate-400">collected</span>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400">Collected</span>
                <span className="font-mono font-semibold text-emerald-400">{formatCompactCurrency(stats.totalReceived)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-400">Due</span>
                <span className="font-mono font-semibold text-rose-400">{formatCompactCurrency(stats.totalBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 panel-3d rounded-xl p-2 md:p-3 flex flex-col max-h-[420px] overflow-hidden">
          <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-2 shrink-0 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Priority Follow-ups
          </h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
            {stats.topOutstanding.map((v, idx) => {
              const pct = v.atsValue > 0 ? (v.received / v.atsValue) * 100 : 0;
              const status = getPaymentStatus(v);
              const sc = getStatusColor(status);
              return (
                <div key={idx} className="bg-black/20 rounded-lg px-2.5 py-2 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-[11px] font-semibold text-slate-200 truncate">{v.clientName}</p>
                      <p className="text-[9px] text-slate-500">{v.villaNo}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[10px] md:text-[11px] font-bold font-mono text-rose-400">{formatCompactCurrency(v.balance)}</p>
                      <p className="text-[9px] text-slate-500">due</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 50 ? 'bg-emerald-500' : pct >= 25 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className={`text-[9px] font-mono font-semibold ${sc.text}`}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
            {stats.zeroPayment.length > 0 && (
              <div className="mt-1 bg-rose-500/10 rounded-lg px-2.5 py-2 border border-rose-500/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle className="w-3 h-3 text-rose-400" />
                  <span className="text-[10px] font-semibold text-rose-300">Zero Payment Clients ({stats.zeroPayment.length})</span>
                </div>
                <div className="text-[9px] text-rose-400/80 space-y-0.5">
                  {stats.zeroPayment.map((v, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{v.clientName}</span>
                      <span className="font-mono">{v.villaNo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel-3d rounded-xl flex flex-col overflow-hidden" style={{ maxHeight: '500px' }}>
        <div className="p-2 md:p-3 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <h2 className="text-xs md:text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-500" /> Client Collection Details
            <span className="text-slate-400 font-medium text-[9px] md:text-[10px] ml-2 px-1.5 py-0.5 bg-black/30 rounded border border-white/10">
              {filteredVillas.length} client{filteredVillas.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md overflow-hidden border border-white/10 text-[9px]">
              {[
                { key: 'all', label: 'All' },
                { key: 'healthy', label: 'Healthy' },
                { key: 'partial', label: 'Partial' },
                { key: 'low', label: 'Low' },
                { key: 'zero', label: 'Zero' },
              ].map(f => (
                <button key={f.key} onClick={() => setSelectedStatus(f.key)}
                  className={`px-2 py-1 font-medium transition-colors ${selectedStatus === f.key ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-slate-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative w-48">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search client or villa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-[#0a0f1c] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)] border border-white/5 rounded-lg text-xs text-white focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0d1425] z-10 shadow-[0_2px_5px_rgba(0,0,0,0.5)] border-b border-white/5">
              <tr className="text-slate-400 text-[10px] md:text-xs font-semibold uppercase">
                <th className="py-2 px-3 cursor-pointer select-none" onClick={() => handleSort('villa')}>
                  <span className="flex items-center gap-1">Villa <SortIcon field="villa" /></span>
                </th>
                <th className="py-2 px-3 cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">Client <SortIcon field="name" /></span>
                </th>
                <th className="py-2 px-3 text-right">ATS Value</th>
                <th className="py-2 px-3 text-right cursor-pointer select-none" onClick={() => handleSort('received')}>
                  <span className="flex items-center justify-end gap-1">Received <SortIcon field="received" /></span>
                </th>
                <th className="py-2 px-3 text-right cursor-pointer select-none" onClick={() => handleSort('balance')}>
                  <span className="flex items-center justify-end gap-1">Balance <SortIcon field="balance" /></span>
                </th>
                <th className="py-2 px-3 cursor-pointer select-none w-32" onClick={() => handleSort('pct')}>
                  <span className="flex items-center gap-1">Progress <SortIcon field="pct" /></span>
                </th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0f172a]/50">
              {filteredVillas.map((v, idx) => {
                const pct = v.atsValue > 0 ? (v.received / v.atsValue) * 100 : 0;
                const status = getPaymentStatus(v);
                const sc = getStatusColor(status);
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-1.5 px-3 text-xs font-medium text-slate-300">{v.villaNo}</td>
                    <td className="py-1.5 px-3 text-xs font-medium text-slate-200">{v.clientName}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-xs text-slate-400">{formatCurrency(v.atsValue)}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-xs text-emerald-400">{formatCurrency(v.received)}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-xs text-rose-400">{formatCurrency(v.balance)}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct >= 50 ? 'bg-emerald-500' : pct >= 25 ? 'bg-amber-500' : pct > 0 ? 'bg-orange-500' : 'bg-rose-500'}`} style={{ width: `${Math.max(pct, 1)}%` }}></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${sc.bg} ${sc.text} border ${sc.border}/30`}>
                        {sc.label.split(' ')[0]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .bg-3d-base { background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 60%, #020617 100%); }
        .panel-3d { background: linear-gradient(145deg, #162032, #0d131f); box-shadow: 5px 5px 10px #06090f, -5px -5px 10px #1c2941; border: 1px solid rgba(255, 255, 255, 0.03); }
        .btn-3d { background: linear-gradient(145deg, #162032, #0d131f); box-shadow: 2px 2px 4px #06090f, -2px -2px 4px #1c2941; }
        .btn-3d:active { box-shadow: inset 2px 2px 4px #06090f, inset -2px -2px 4px #1c2941; }
      `}} />
    </div>
  );
}

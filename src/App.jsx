import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  BarChart3, ArrowUpRight, ArrowDownRight, Building2, Briefcase,
  Users, Receipt, Zap, Search, Activity, Crosshair, Database,
  Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, PieChart, Download, Upload,
  RefreshCw, Link2, Landmark, Wallet, TrendingUp, Home
} from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE = '';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatCompactCurrency = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount}`;
};

const getCategoryIcon = (category) => {
  switch(category) {
    case 'Brokerage': return <Briefcase className="w-4 h-4" />;
    case 'Land Owner': return <Building2 className="w-4 h-4" />;
    case 'Salary Exp.': return <Users className="w-4 h-4" />;
    case 'Sales & Marketing': return <BarChart3 className="w-4 h-4" />;
    case 'Fees & Taxes': return <Receipt className="w-4 h-4" />;
    case 'Electricity Exp.': return <Zap className="w-4 h-4" />;
    case 'Booking Advances': return <Wallet className="w-4 h-4" />;
    case 'Installments (Linked)': return <Building2 className="w-4 h-4" />;
    case 'Final Settlements': return <Landmark className="w-4 h-4" />;
    default: return <Database className="w-4 h-4" />;
  }
};

const TAB_MAP = { inflow: 'INFLOW', outflow: 'OUTFLOW', refund: 'LEAKAGE', net: 'ALL' };
const TAB_REVERSE = Object.fromEntries(Object.entries(TAB_MAP).map(([k, v]) => [v, k]));

function getInitialTab() {
  if (typeof window === 'undefined') return 'INFLOW';
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return (tab && TAB_MAP[tab]) || 'INFLOW';
}

export default function Dashboard({ onViewChange }) {
  const [appData, setAppData] = useState({ revenue: {}, refunds: { totalRefunds: { name: 'Refund', total: 0 } }, expenses: {} });
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState(new Set());
  const [rangeStart, setRangeStart] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(getInitialTab);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [activePieSlice, setActivePieSlice] = useState(null);
  const [hoveredPieSlice, setHoveredPieSlice] = useState(null);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [expandedFilterYears, setExpandedFilterYears] = useState(new Set());
  const [periodMenuPos, setPeriodMenuPos] = useState({ top: 0, right: 0 });
  const [hoveredBar, setHoveredBar] = useState(null);
  const [loadingState, setLoadingState] = useState('loading');

  const inflowFileInputRef = useRef(null);
  const outflowFileInputRef = useRef(null);
  const periodBtnRef = useRef(null);
  const chartScrollRef = useRef(null);

  const isAllSelected = selectedPeriods.size === 0;

  const getItemValue = useCallback((item) => {
    if (isAllSelected) return Number(item.total) || 0;
    let sum = 0;
    for (const p of selectedPeriods) {
      sum += Number(item[p]) || 0;
    }
    return sum;
  }, [selectedPeriods, isAllSelected]);

  const periodsByYear = useMemo(() => {
    const map = {};
    availablePeriods.forEach(p => {
      const parts = p.split('-');
      const yr = parts.length === 2 ? parts[1] : 'Other';
      if (!map[yr]) map[yr] = [];
      map[yr].push(p);
    });
    return map;
  }, [availablePeriods]);

  const periodLabel = useMemo(() => {
    if (isAllSelected) return 'Overall Total';
    if (selectedPeriods.size === 1) return [...selectedPeriods][0];
    const years = Object.entries(periodsByYear);
    for (const [yr, months] of years) {
      if (months.length === selectedPeriods.size && months.every(m => selectedPeriods.has(m))) {
        return `FY ${yr}`;
      }
    }
    return `${selectedPeriods.size} Months`;
  }, [selectedPeriods, isAllSelected, periodsByYear]);

  const togglePeriod = useCallback((month, shiftKey) => {
    setSelectedPeriods(prev => {
      const next = new Set(prev);
      if (shiftKey && rangeStart) {
        const startIdx = availablePeriods.indexOf(rangeStart);
        const endIdx = availablePeriods.indexOf(month);
        if (startIdx !== -1 && endIdx !== -1) {
          const from = Math.min(startIdx, endIdx);
          const to = Math.max(startIdx, endIdx);
          for (let i = from; i <= to; i++) next.add(availablePeriods[i]);
        }
      } else {
        if (next.has(month)) next.delete(month); else next.add(month);
      }
      return next;
    });
    setRangeStart(month);
  }, [rangeStart, availablePeriods]);

  const selectYear = useCallback((yr) => {
    const months = periodsByYear[yr] || [];
    setSelectedPeriods(prev => {
      const allSelected = months.every(m => prev.has(m));
      const next = new Set(prev);
      if (allSelected) {
        months.forEach(m => next.delete(m));
      } else {
        months.forEach(m => next.add(m));
      }
      return next;
    });
  }, [periodsByYear]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', TAB_REVERSE[activeFilter] || 'inflow');
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [activeFilter]);

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsFetching(true);
    try {
      const response = await fetch(`${API_BASE}/api/data`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      setAppData({ revenue: data.revenue, refunds: data.refunds, expenses: data.expenses });
      setAvailablePeriods(data.periods);
      setLoadingState('loaded');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoadingState('error');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const downloadTemplate = async (type) => {
    try {
      const response = await fetch(`${API_BASE}/api/template/${type}`);
      if (!response.ok) throw new Error('Failed to download template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heritage_${type}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download failed:', error);
      alert('Failed to download template. Make sure the server is running.');
    }
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      const dataRows = allRows.slice(1).filter(row => row.length >= 2 && String(row[0]).trim());
      const cleanRows = dataRows.map(row =>
        row.map(cell => {
          if (cell === '' || cell == null) return '';
          const num = Number(cell);
          return isNaN(num) ? String(cell).trim() : num;
        })
      );

      if (cleanRows.length === 0) {
        alert('No data rows found. Please add entries below the header row.');
        return;
      }

      try {
        setIsFetching(true);
        const response = await fetch(`${API_BASE}/api/${type}/append`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: cleanRows }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Upload failed');
        }
        const result = await response.json();
        await fetchData();
        setActiveFilter(type === 'inflow' ? 'INFLOW' : 'OUTFLOW');
        setSelectedPeriods(new Set());
        alert(`${result.added} new row(s) added to ${type === 'inflow' ? 'Inflow' : 'Outflow'} sheet.`);
      } catch (error) {
        console.error(`Failed to upload ${type}:`, error);
        alert(`Failed to upload: ${error.message}`);
      } finally {
        setIsFetching(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null;
  };

  const aggregates = useMemo(() => {
    let totalRevenue = 0;
    Object.values(appData.revenue).forEach(items => {
      items.forEach(item => { totalRevenue += getItemValue(item); });
    });

    let totalRefunds = getItemValue(appData.refunds.totalRefunds);
    let totalExpenses = 0;

    Object.values(appData.expenses).forEach(items => {
      items.forEach(item => { totalExpenses += getItemValue(item); });
    });

    const categoryTotals = [];
    const allTransactions = [];

    Object.entries(appData.revenue).forEach(([category, items]) => {
      let catSum = 0;
      items.forEach(item => {
        const val = getItemValue(item);
        catSum += val;
        if (val > 0 && (activeFilter === 'ALL' || activeFilter === 'INFLOW')) {
          allTransactions.push({ ...item, category, displayAmount: val, type: 'INFLOW' });
        }
      });
      if (catSum > 0 && (activeFilter === 'ALL' || activeFilter === 'INFLOW')) {
        categoryTotals.push({ category, amount: catSum, type: 'INFLOW' });
      }
    });

    if ((activeFilter === 'ALL' || activeFilter === 'LEAKAGE') && totalRefunds > 0) {
      categoryTotals.push({ category: 'Refunds Issued', amount: totalRefunds, type: 'LEAKAGE' });
      const refundItems = appData.refunds.items || [];
      if (refundItems.length > 0) {
        refundItems.forEach(item => {
          const val = getItemValue(item);
          if (val > 0) {
            allTransactions.push({ name: item.name, category: 'Refund', displayAmount: val, type: 'LEAKAGE' });
          }
        });
      } else {
        allTransactions.push({ name: 'Customer Refunds', category: 'Refund', displayAmount: totalRefunds, type: 'LEAKAGE' });
      }
    }

    Object.entries(appData.expenses).forEach(([category, items]) => {
      let catSum = 0;
      items.forEach(item => {
        const val = getItemValue(item);
        catSum += val;
        if (val > 0 && (activeFilter === 'ALL' || activeFilter === 'OUTFLOW')) {
          allTransactions.push({ ...item, category, displayAmount: val, type: 'OUTFLOW' });
        }
      });
      if (catSum > 0 && (activeFilter === 'ALL' || activeFilter === 'OUTFLOW')) {
        categoryTotals.push({ category, amount: catSum, type: 'OUTFLOW' });
      }
    });

    categoryTotals.sort((a, b) => b.amount - a.amount);
    allTransactions.sort((a, b) => b.displayAmount - a.displayAmount);

    const maxCategoryAmount = categoryTotals.length > 0 ? Math.max(...categoryTotals.map(c => c.amount)) : 1;

    return {
      revenue: totalRevenue,
      refunds: totalRefunds,
      expenses: totalExpenses,
      net: totalRevenue - totalExpenses - totalRefunds,
      categories: categoryTotals,
      transactions: allTransactions,
      maxCategoryAmount
    };
  }, [getItemValue, activeFilter, appData]);

  const filteredTransactions = aggregates.transactions.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const monthlyTrendData = useMemo(() => {
    if (activeFilter === 'ALL') return { data: [], maxAmount: 0 };

    const chartPeriods = isAllSelected ? availablePeriods : availablePeriods.filter(p => selectedPeriods.has(p));

    const data = chartPeriods.map(month => {
      let sum = 0;
      if (activeFilter === 'INFLOW') {
        Object.values(appData.revenue).forEach(items => {
          items.forEach(item => sum += (Number(item[month]) || 0));
        });
      } else if (activeFilter === 'OUTFLOW') {
        Object.values(appData.expenses).forEach(items => {
          items.forEach(item => sum += (Number(item[month]) || 0));
        });
      } else if (activeFilter === 'LEAKAGE') {
        sum += (Number(appData.refunds.totalRefunds[month]) || 0);
      }
      return { month, amount: sum };
    });

    const maxAmount = data.length > 0 ? Math.max(...data.map(d => d.amount)) : 1;
    return { data, maxAmount };
  }, [appData, availablePeriods, activeFilter, selectedPeriods, isAllSelected]);

  const displayRevenue = aggregates.revenue;
  const displayExpenses = aggregates.expenses;
  const displayRefunds = aggregates.refunds;
  const currentNetPosition = aggregates.net;

  const donutData = useMemo(() => {
    const total = aggregates.categories.reduce((sum, cat) => sum + cat.amount, 0);
    let currentPercent = 0;
    const legend = [];
    const slices = [];
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];
    const outflowColors = ['#f43f5e', '#fb7185', '#e11d48', '#fda4af', '#be123c', '#9f1239'];
    const inflowColors = ['#10b981', '#14b8a6', '#06b6d4', '#059669', '#0891b2'];

    aggregates.categories.forEach((cat, idx) => {
      const percent = total > 0 ? cat.amount / total : 0;
      let color = colors[idx % colors.length];

      if (cat.type === 'INFLOW') color = inflowColors[idx % inflowColors.length];
      if (cat.type === 'LEAKAGE') color = '#f59e0b';
      if (cat.type === 'OUTFLOW') color = outflowColors[idx % outflowColors.length];

      legend.push({ name: cat.category, color, percent: percent * 100, amount: cat.amount });

      if (percent > 0) {
        slices.push({
          name: cat.category,
          color,
          startPercent: currentPercent,
          endPercent: currentPercent + percent
        });
        currentPercent += percent;
      }
    });

    return { legend, slices, total };
  }, [aggregates.categories]);

  const filterLabel = activeFilter === 'ALL' ? '' : `(${activeFilter === 'INFLOW' ? 'Inflow' : activeFilter === 'OUTFLOW' ? 'Outflow' : 'Refunds'})`;
  const periodText = periodLabel;

  if (loadingState === 'loading') {
    return (
      <div className="h-screen w-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-sm">Loading data from Google Sheets...</p>
        </div>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="h-screen w-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Database className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <p className="text-slate-300 text-sm mb-4">Failed to connect to the API server. Make sure the server is running:</p>
          <code className="text-blue-400 text-xs bg-black/40 px-3 py-2 rounded block">npm run server</code>
          <button onClick={() => { setLoadingState('loading'); fetchData(false); }} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0f172a] text-slate-200 font-sans p-2 md:p-3 flex flex-col overflow-hidden bg-3d-base">

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 shrink-0 gap-2 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2 drop-shadow-md">
            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            The Heritage, Narsinghpura
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5 flex items-center gap-2">
            <Activity className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
            Financial Summary Dashboard
            <span className="text-emerald-500 text-[10px] ml-1">● Live</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="flex rounded-lg overflow-hidden border border-white/10 mr-1">
            <button className="px-3 py-1.5 text-xs font-semibold bg-blue-500/20 text-blue-300">
              <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />Financials
            </button>
            <button onClick={() => onViewChange && onViewChange('villas')} className="px-3 py-1.5 text-xs font-semibold transition-colors text-slate-400 hover:text-white hover:bg-white/5 border-l border-white/10">
              <Home className="w-3.5 h-3.5 inline mr-1.5" />Villas
            </button>
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".xlsx,.csv" ref={inflowFileInputRef} onChange={(e) => handleUpload(e, 'inflow')} className="hidden" />
            <input type="file" accept=".xlsx,.csv" ref={outflowFileInputRef} onChange={(e) => handleUpload(e, 'outflow')} className="hidden" />
            {activeFilter === 'INFLOW' && (
              <>
                <button onClick={() => downloadTemplate('inflow')} className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-emerald-400 hover:text-emerald-300">
                  <Download className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="whitespace-nowrap">Template</span>
                </button>
                <button onClick={() => inflowFileInputRef.current.click()} className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-emerald-400 hover:text-emerald-300">
                  <Upload className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="whitespace-nowrap">Add Entries</span>
                </button>
              </>
            )}
            {(activeFilter === 'OUTFLOW' || activeFilter === 'LEAKAGE') && (
              <>
                <button onClick={() => downloadTemplate('outflow')} className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-rose-400 hover:text-rose-300">
                  <Download className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="whitespace-nowrap">Template</span>
                </button>
                <button onClick={() => outflowFileInputRef.current.click()} className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-rose-400 hover:text-rose-300">
                  <Upload className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="whitespace-nowrap">Add Entries</span>
                </button>
              </>
            )}
            <button onClick={() => fetchData()} disabled={isFetching} className={`flex items-center gap-1.5 px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-purple-400 hover:text-purple-300 ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isFetching ? <RefreshCw className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Link2 className="w-3 h-3 md:w-4 md:h-4" />} Sync
            </button>
          </div>

          <div className="relative">
            <button
              ref={periodBtnRef}
              onClick={() => {
                if (!showPeriodMenu && periodBtnRef.current) {
                  const rect = periodBtnRef.current.getBoundingClientRect();
                  setPeriodMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                }
                setShowPeriodMenu(!showPeriodMenu);
                setRangeStart(null);
              }}
              className="flex items-center justify-between gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-md transition-all btn-3d text-slate-200 hover:text-white min-w-[145px]"
            >
              <span className="whitespace-nowrap">{periodLabel}</span>
              <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-blue-400 transition-transform ${showPeriodMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPeriodMenu && (
              <>
                <div className="fixed inset-0 z-[998]" onClick={() => setShowPeriodMenu(false)}></div>
                <div
                  className="fixed rounded-xl z-[999] flex flex-col"
                  style={{ top: periodMenuPos.top, right: periodMenuPos.right, width: '280px', maxHeight: '360px', backgroundColor: '#1a2742', border: '2px solid rgba(96,165,250,0.4)', boxShadow: '0 25px 60px rgba(0,0,0,1), inset 0 1px 0 rgba(255,255,255,0.06)' }}
                >
                  <div className="p-2 border-b border-white/10 shrink-0">
                    <button
                      onClick={() => { setSelectedPeriods(new Set()); setShowPeriodMenu(false); }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${isAllSelected ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40' : 'text-slate-200 hover:bg-white/10 border border-transparent'}`}
                    >
                      Overall Total
                    </button>
                  </div>

                  <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider px-1 font-semibold mb-1">Click month to select · Shift+click for range</p>
                    {Object.entries(periodsByYear).map(([yr, months]) => {
                      const allYrSelected = months.every(m => selectedPeriods.has(m));
                      const someYrSelected = months.some(m => selectedPeriods.has(m));
                      const isExpanded = expandedFilterYears.has(yr);
                      return (
                        <div key={yr} className="rounded-lg overflow-hidden" style={{ backgroundColor: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setExpandedFilterYears(prev => { const next = new Set(prev); next.has(yr) ? next.delete(yr) : next.add(yr); return next; })}
                              className={`flex-1 flex items-center justify-between px-2 py-2 rounded-md text-[11px] font-bold transition-colors ${allYrSelected ? 'bg-blue-500/20 text-blue-300' : someYrSelected ? 'text-blue-200' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                            >
                              <span className="flex items-center gap-1.5">
                                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                FY 20{yr}
                              </span>
                              <span className={`text-[9px] font-medium ${allYrSelected ? 'text-blue-400' : someYrSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                                {someYrSelected ? `${months.filter(m => selectedPeriods.has(m)).length}/${months.length}` : ''}
                              </span>
                            </button>
                            <button
                              onClick={() => selectYear(yr)}
                              className={`px-2 py-1 rounded text-[9px] font-medium transition-colors shrink-0 ${allYrSelected ? 'text-blue-400 hover:text-blue-300' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              {allYrSelected ? 'Deselect' : 'All'}
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="grid grid-cols-4 gap-1 px-1.5 pb-2 pt-1">
                              {months.map(m => {
                                const monthName = m.split('-')[0];
                                const isSel = selectedPeriods.has(m);
                                return (
                                  <button
                                    key={m}
                                    onClick={(e) => togglePeriod(m, e.shiftKey)}
                                    className={`px-1 py-1.5 rounded text-[10px] font-medium transition-all ${isSel ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'}`}
                                  >
                                    {monthName}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedPeriods.size > 0 && (
                    <div className="p-2 border-t border-white/10 flex justify-between items-center shrink-0" style={{ backgroundColor: '#1a2742' }}>
                      <span className="text-[10px] text-slate-400">{selectedPeriods.size} month{selectedPeriods.size !== 1 ? 's' : ''} selected</span>
                      <button onClick={() => setSelectedPeriods(new Set())} className="text-[10px] text-rose-400 hover:text-rose-300 font-medium">Clear</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 shrink-0">
        <div onClick={() => setActiveFilter('INFLOW')} className={`rounded-xl p-3 md:p-4 cursor-pointer transition-all flex flex-col justify-between ${activeFilter === 'INFLOW' ? 'panel-3d-active-inflow' : 'panel-3d hover:brightness-110'} `}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-xs md:text-sm font-medium">Total Inflow</span>
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          </div>
          <h3 className="text-lg md:text-2xl font-bold font-mono tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-emerald-400">
            {formatCurrency(displayRevenue)}
          </h3>
        </div>

        <div onClick={() => setActiveFilter('OUTFLOW')} className={`rounded-xl p-3 md:p-4 cursor-pointer transition-all flex flex-col justify-between ${activeFilter === 'OUTFLOW' ? 'panel-3d-active-outflow' : 'panel-3d hover:brightness-110'} `}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-xs md:text-sm font-medium">Total Outflow</span>
            <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5 text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
          </div>
          <h3 className="text-lg md:text-2xl font-bold font-mono tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-rose-400">
            {formatCurrency(displayExpenses)}
          </h3>
        </div>

        <div onClick={() => setActiveFilter('LEAKAGE')} className={`rounded-xl p-3 md:p-4 cursor-pointer transition-all flex flex-col justify-between ${activeFilter === 'LEAKAGE' ? 'panel-3d-active-leakage' : 'panel-3d hover:brightness-110'} `}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-xs md:text-sm font-medium">Refunds Issued</span>
            <Crosshair className="w-4 h-4 md:w-5 md:h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
          </div>
          <h3 className="text-lg md:text-2xl font-bold font-mono tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-amber-400">
            {formatCurrency(displayRefunds)}
          </h3>
        </div>

        <div onClick={() => setActiveFilter('ALL')} className={`rounded-xl p-3 md:p-4 cursor-pointer transition-all flex flex-col justify-between ${activeFilter === 'ALL' ? 'panel-3d-active-net' : 'panel-3d hover:brightness-110'} `}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-xs md:text-sm font-medium">Net Position (All)</span>
            <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
          </div>
          <h3 className={`text-lg md:text-2xl font-bold font-mono tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${currentNetPosition >= 0 ? 'text-white' : 'text-rose-500'}`}>
            {formatCurrency(currentNetPosition)}
          </h3>
        </div>
      </div>

      {activeFilter === 'ALL' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 bg-[#121f42]/40 rounded-xl border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.3)] shrink-0 min-h-[45vh] animate-fade-in">
          <Database className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mb-4 opacity-50 drop-shadow-lg" />
          <h2 className="text-base md:text-xl font-bold text-slate-300 mb-2 tracking-wide">Net Position Overview Active</h2>
          <p className="text-xs md:text-sm text-slate-500 text-center max-w-lg leading-relaxed">
            Detailed charts and transaction logs are hidden in the combined view to prevent data overlap.
            <br className="hidden md:block mb-2" />
            Please click on <span className="text-emerald-400 font-semibold cursor-pointer hover:text-emerald-300 transition-colors" onClick={() => setActiveFilter('INFLOW')}>Total Inflow</span>, <span className="text-rose-400 font-semibold cursor-pointer hover:text-rose-300 transition-colors" onClick={() => setActiveFilter('OUTFLOW')}>Total Outflow</span>, or <span className="text-amber-400 font-semibold cursor-pointer hover:text-amber-300 transition-colors" onClick={() => setActiveFilter('LEAKAGE')}>Refunds</span> to view detailed reports.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 h-[28vh] md:h-[32vh] shrink-0 relative z-10" style={{overflow: 'visible'}}>
            <div className="md:col-span-4 panel-3d rounded-xl p-2 md:p-3 flex flex-col h-full overflow-hidden">
              <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-1.5 shrink-0 flex items-center gap-2 drop-shadow-sm">
                <Filter className="w-3 h-3 md:w-4 md:h-4 text-blue-500" /> Category Breakdown <span className="text-blue-400 font-bold text-[10px] md:text-xs">{filterLabel}</span>
              </h2>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                {aggregates.categories.map((cat, idx) => {
                  const percentage = aggregates.maxCategoryAmount > 0 ? ((cat.amount / aggregates.maxCategoryAmount) * 100).toFixed(1) : 0;
                  let barColor = 'bg-gradient-to-r from-blue-600 to-blue-400';
                  let textColor = 'text-blue-400';
                  if (cat.type === 'INFLOW') {
                    const theme = [{ bar: 'from-emerald-600 to-emerald-400', text: 'text-emerald-400' }, { bar: 'from-teal-600 to-teal-400', text: 'text-teal-400' }, { bar: 'from-cyan-600 to-cyan-400', text: 'text-cyan-400' }][idx % 3];
                    barColor = `bg-gradient-to-r ${theme.bar}`; textColor = theme.text;
                  } else if (cat.type === 'LEAKAGE') {
                    barColor = 'bg-gradient-to-r from-amber-600 to-amber-400'; textColor = 'text-amber-400';
                  } else if (cat.type === 'OUTFLOW') {
                    barColor = 'bg-gradient-to-r from-rose-600 to-rose-400'; textColor = 'text-rose-400';
                  }
                  const isExpanded = expandedCategory === cat.category;
                  const subItems = aggregates.transactions.filter(t => t.category === cat.category);

                  const catPercent = donutData.total > 0 ? ((cat.amount / donutData.total) * 100).toFixed(1) : 0;

                  return (
                    <div key={idx} className="relative group flex flex-col gap-1">
                      <div className="cursor-pointer" onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}>
                        <div className="flex justify-between items-center mb-0.5">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <div className={`text-slate-500 group-hover:${textColor} transition-colors`}>{getCategoryIcon(cat.category)}</div>
                            <span className="font-medium text-slate-200 text-[10px] md:text-xs group-hover:text-white transition-colors flex items-center gap-1">
                              {cat.category} {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                            </span>
                          </div>
                          <span className={`font-bold font-mono text-slate-300 text-[10px] md:text-xs group-hover:${textColor} transition-colors`}>
                            {formatCurrency(cat.amount)}
                          </span>
                        </div>
                        <div className="w-full progress-track-3d rounded-full h-1 overflow-hidden relative">
                          <div className={`${barColor} h-1 rounded-full transition-all duration-1000 ease-out progress-bar-3d`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[9px] py-1.5 px-2.5 rounded pointer-events-none whitespace-nowrap z-20 transition-opacity border border-white/10 shadow-lg">
                          <span className="font-semibold">{cat.category}</span> · {formatCompactCurrency(cat.amount)} · <span style={{color: donutData.legend.find(l => l.name === cat.category)?.color || '#fff'}}>{catPercent}%</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-1 mb-1 pl-2 pr-1 py-1.5 border-l-2 border-slate-600/50 rounded-r-md space-y-1 transition-all bg-[#0a0f1c]/40 shadow-inner">
                          {subItems.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-[9px] md:text-[10px]">
                              <span className="text-slate-400 truncate pr-2" title={item.name}>{item.name}</span>
                              <span className="font-mono text-slate-500">{formatCurrency(item.displayAmount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-4 bg-[#121f42] rounded-xl p-2 md:p-3 flex flex-col h-full overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_5px_15px_rgba(0,0,0,0.5)] border border-white/5">
              <div className="flex items-center justify-between shrink-0 mb-1.5 relative">
                <h2 className="text-xs md:text-sm font-semibold text-slate-300 flex items-center gap-2 drop-shadow-sm">
                  <PieChart className="w-3 h-3 md:w-4 md:h-4 text-purple-400" /> Distribution <span className="text-purple-300 font-bold text-[10px] md:text-xs">{filterLabel}</span>
                </h2>
                {(hoveredPieSlice || activePieSlice) && (() => {
                  const legendItem = donutData.legend.find(l => l.name === (hoveredPieSlice || activePieSlice));
                  if (!legendItem) return null;
                  return (
                    <div className="absolute right-0 top-0 flex items-center gap-1.5 bg-black/80 px-2 py-1 rounded-md border border-white/10 z-20 shadow-lg">
                      <span className="text-slate-200 text-[10px] font-medium">{legendItem.name}</span>
                      <span className="text-white text-[11px] font-bold font-mono">{formatCurrency(legendItem.amount)}</span>
                      <span className="text-[10px] font-bold" style={{color: legendItem.color}}>{legendItem.percent.toFixed(1)}%</span>
                    </div>
                  );
                })()}
              </div>
              <div className="flex-1 flex flex-row items-center justify-center min-h-0 relative py-1 md:py-2">
                {donutData.legend.length > 0 ? (
                  <>
                    <div className="relative aspect-square h-full max-h-[140px] flex items-center justify-center shrink-0">
                      <svg viewBox="-10 -10 120 120" className="w-full h-full overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
                        {donutData.slices.map((slice, idx) => {
                          const isActive = activePieSlice === slice.name;
                          const isHovered = hoveredPieSlice === slice.name;
                          const safeEnd = slice.endPercent - slice.startPercent >= 1 ? slice.startPercent + 0.999 : slice.endPercent;
                          const getCoords = (p) => [Math.cos(2 * Math.PI * (p - 0.25)), Math.sin(2 * Math.PI * (p - 0.25))];
                          const [startX, startY] = getCoords(slice.startPercent);
                          const [endX, endY] = getCoords(safeEnd);
                          const [midX, midY] = getCoords((slice.startPercent + safeEnd) / 2);
                          const largeArcFlag = safeEnd - slice.startPercent > 0.5 ? 1 : 0;
                          const shift = (isActive || isHovered) ? 8 : 0;
                          const transform = `translate(${midX * shift}, ${midY * shift})`;
                          const pathData = [`M ${50 + startX * 46} ${50 + startY * 46}`, `A 46 46 0 ${largeArcFlag} 1 ${50 + endX * 46} ${50 + endY * 46}`, `L ${50 + endX * 26} ${50 + endY * 26}`, `A 26 26 0 ${largeArcFlag} 0 ${50 + startX * 26} ${50 + startY * 26}`, `Z`].join(' ');
                          return <path key={idx} d={pathData} fill={slice.color} transform={transform} onClick={() => setActivePieSlice(isActive ? null : slice.name)} onMouseEnter={() => setHoveredPieSlice(slice.name)} onMouseLeave={() => setHoveredPieSlice(null)} className="cursor-pointer transition-all duration-300 ease-out outline-none" style={{ stroke: '#0a1128', strokeWidth: 1.5, opacity: isHovered ? 0.85 : 1 }} />;
                        })}
                      </svg>
                    </div>
                    <div className="ml-2 md:ml-4 flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 max-h-full">
                      {donutData.legend.map((item, idx) => (
                        <div key={idx} className={`flex items-center justify-between gap-1.5 p-1 rounded-md cursor-pointer transition-all duration-200 ${activePieSlice === item.name ? 'bg-white/10' : 'hover:bg-white/5'}`} onClick={() => setActivePieSlice(activePieSlice === item.name ? null : item.name)}>
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                            <div className="truncate text-[9px] md:text-[10px] text-slate-300">{item.name}</div>
                          </div>
                          <div className="font-mono font-medium text-[9px] md:text-[10px] text-slate-400">{item.percent.toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-xs">No Data Available</div>
                )}
              </div>
            </div>

            <div className="md:col-span-4 panel-3d rounded-xl p-2 md:p-3 flex flex-col h-full relative" style={{overflow: 'visible'}}>
              <div className="flex items-center justify-between shrink-0 mb-1 relative">
                <h2 className="text-xs md:text-sm font-semibold text-slate-300 flex items-center gap-2 drop-shadow-sm">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /> Monthly Trend <span className="text-emerald-300 font-bold text-[10px] md:text-xs">{filterLabel}</span>
                </h2>
                {hoveredBar && (
                  <div className="absolute right-0 top-0 flex items-center gap-1.5 bg-black/80 px-2 py-1 rounded-md border border-white/10 z-20 shadow-lg">
                    <span className="text-slate-300 text-[10px] font-medium">{hoveredBar.month}</span>
                    <span className="text-white text-[11px] font-bold font-mono">{formatCurrency(hoveredBar.amount)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex min-h-0 mt-1" style={{overflow: 'visible'}}>
                {(() => {
                  const max = monthlyTrendData.maxAmount || 1;
                  const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0];
                  return (
                    <div className="flex flex-col justify-between pr-1 py-0.5 shrink-0" style={{width: '38px'}}>
                      {ticks.map((val, i) => (
                        <span key={i} className="text-[8px] md:text-[9px] text-slate-500 font-mono text-right leading-none">
                          {val >= 10000000 ? `${(val / 10000000).toFixed(1)}Cr` : val >= 100000 ? `${(val / 100000).toFixed(0)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                        </span>
                      ))}
                    </div>
                  );
                })()}
                <div className="flex-1 flex flex-col min-w-0 relative">
                  {monthlyTrendData.data.length > 12 && (
                    <>
                      <button
                        onClick={() => chartScrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' })}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-5 flex items-center justify-center rounded-full bg-slate-800/90 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => chartScrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' })}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-5 h-5 flex items-center justify-center rounded-full bg-slate-800/90 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  <div ref={chartScrollRef} className={`flex-1 flex flex-col min-w-0 ${monthlyTrendData.data.length > 12 ? 'overflow-x-auto custom-scrollbar mx-5' : ''}`}>
                    <div className={`flex-1 flex items-end gap-0.5 relative border-l border-b border-slate-700/50 pb-0.5 pl-0.5 ${monthlyTrendData.data.length > 12 ? '' : 'justify-between'}`} style={monthlyTrendData.data.length > 12 ? { minWidth: `${monthlyTrendData.data.length * 32}px` } : {}}>
                      {monthlyTrendData.data.map((d, i) => {
                        const heightPercent = monthlyTrendData.maxAmount > 0 ? (d.amount / monthlyTrendData.maxAmount) * 100 : 0;
                        let barGradient = 'from-rose-500 to-rose-700';
                        if (activeFilter === 'INFLOW') barGradient = 'from-emerald-400 to-emerald-600';
                        if (activeFilter === 'LEAKAGE') barGradient = 'from-amber-400 to-amber-600';

                        return (
                          <div
                            key={i}
                            className={`relative flex flex-col items-center h-full justify-end ${monthlyTrendData.data.length > 12 ? '' : 'flex-1 min-w-0'}`}
                            style={monthlyTrendData.data.length > 12 ? { width: '28px', flexShrink: 0 } : {}}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredBar({ month: d.month, amount: d.amount, x: rect.left + rect.width / 2, y: rect.top });
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div
                              className={`w-full max-w-[22px] bg-gradient-to-t ${barGradient} rounded-t-sm transition-all duration-700 ease-out border-t border-white/20`}
                              style={{ height: `${Math.max(heightPercent, 2)}%` }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                    <div className={`flex pl-0.5 mt-0.5 shrink-0 ${monthlyTrendData.data.length > 12 ? '' : 'justify-between'}`} style={monthlyTrendData.data.length > 12 ? { minWidth: `${monthlyTrendData.data.length * 32}px` } : {}}>
                      {monthlyTrendData.data.map((d, i) => (
                        <span key={i} className={`text-center text-[7px] md:text-[8px] text-slate-400 leading-tight ${monthlyTrendData.data.length > 12 ? 'whitespace-nowrap' : 'flex-1 truncate'}`} style={monthlyTrendData.data.length > 12 ? { width: '28px', flexShrink: 0 } : {}}>
                          {d.month.split('-')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-3d rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-2 md:p-3 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-3 shrink-0">
              <h2 className="text-xs md:text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Database className="w-3 h-3 md:w-4 md:h-4 text-blue-500" /> Transaction Log
                <span className="text-slate-400 font-medium text-[9px] md:text-[10px] ml-2 px-1.5 py-0.5 bg-black/30 rounded border border-white/10">{periodText}</span>
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-3 h-3 md:w-4 md:h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 md:py-2 bg-[#0a0f1c] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)] border border-white/5 rounded-lg text-xs md:text-sm text-white focus:outline-none" />
              </div>
            </div>
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="sticky top-0 bg-[#0d1425] z-10 shadow-[0_2px_5px_rgba(0,0,0,0.5)] border-b border-white/5">
                  <tr className="text-slate-400 text-[10px] md:text-xs font-semibold uppercase">
                    <th className="py-2 px-3">Entity / Payee Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0f172a]/50">
                  {filteredTransactions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-1.5 md:py-2 px-3 text-xs md:text-sm font-medium text-slate-200">{item.name}</td>
                      <td className="py-1.5 md:py-2 px-3 text-xs md:text-sm text-slate-400">
                        <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs font-medium bg-[#0a0f1c] text-slate-300">{item.category}</span>
                      </td>
                      <td className={`py-1.5 md:py-2 px-3 text-right font-mono text-xs md:text-sm font-medium ${item.type === 'INFLOW' ? 'text-emerald-400' : item.type === 'OUTFLOW' ? 'text-rose-400' : 'text-amber-400'}`}>
                        {formatCurrency(item.displayAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .bg-3d-base { background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 60%, #020617 100%); }
        .panel-3d { background: linear-gradient(145deg, #162032, #0d131f); box-shadow: 5px 5px 10px #06090f, -5px -5px 10px #1c2941; border: 1px solid rgba(255, 255, 255, 0.03); }
        .panel-3d-active-inflow { background: #0f172a; box-shadow: inset 4px 4px 8px #06090f, inset -4px -4px 8px #1c2941; border: 1px solid rgba(16, 185, 129, 0.4); }
        .panel-3d-active-outflow { background: #0f172a; box-shadow: inset 4px 4px 8px #06090f, inset -4px -4px 8px #1c2941; border: 1px solid rgba(244, 63, 94, 0.4); }
        .panel-3d-active-leakage { background: #0f172a; box-shadow: inset 4px 4px 8px #06090f, inset -4px -4px 8px #1c2941; border: 1px solid rgba(251, 191, 36, 0.4); }
        .panel-3d-active-net { background: #0f172a; box-shadow: inset 4px 4px 8px #06090f, inset -4px -4px 8px #1c2941; border: 1px solid rgba(59, 130, 246, 0.4); }
        .btn-3d { background: linear-gradient(145deg, #162032, #0d131f); box-shadow: 2px 2px 4px #06090f, -2px -2px 4px #1c2941; }
        .btn-3d:active { box-shadow: inset 2px 2px 4px #06090f, inset -2px -2px 4px #1c2941; }
        .progress-track-3d { background: #06090f; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.8); }
        .progress-bar-3d { box-shadow: inset 0px 2px 3px rgba(255,255,255,0.3); }
      `}} />
    </div>
  );
}

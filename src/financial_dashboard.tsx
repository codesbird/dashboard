import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart3, ArrowUpRight, ArrowDownRight, Building2, Briefcase, 
  Users, Receipt, Zap, Search, Activity, Crosshair, Database, 
  Filter, ChevronDown, ChevronUp, PieChart, Download, Upload, 
  RefreshCw, Link2, Landmark, Wallet, TrendingUp
} from 'lucide-react';

const defaultPeriods = [
  "Apr-26", "May-26", "Jun-26", "Jul-26", "Aug-26", "Sep-26", 
  "Oct-26", "Nov-26", "Dec-26", "Jan-27", "Feb-27", "Mar-27"
];

const financialData = {
  revenue: {
    "Booking Advances": [
      { name: "Block A Bookings", total: 2159366, "Apr-26": 1079683, "Jun-26": 100000, "Jul-26": 200000, "Aug-26": 55220, "Nov-26": 200000, "Jan-27": 522300, "Mar-27": 2163 },
      { name: "Block B Bookings", total: 2489032, "Apr-26": 1244516, "Sep-26": 552260, "Oct-26": 200000, "Dec-26": 200000, "Feb-27": 265306, "Mar-27": 26950 }
    ],
    "Installments (Linked)": [
      { name: "Plinth Level", total: 5531634, "Jul-26": 5220032, "Dec-26": 200000, "Feb-27": 23050, "Mar-27": 88552 },
      { name: "Slab Casting", total: 9778738, "Apr-26": 1530361, "May-26": 7030102, "Jun-26": 200000, "Jul-26": 200000, "Aug-26": 200000, "Oct-26": 200000, "Nov-26": 200000, "Jan-27": 206533, "Mar-27": 11742 }
    ],
    "Final Settlements": [
      { name: "Handover Dues", total: 2991892, "Apr-26": 1802000, "May-26": 789658, "Jun-26": 234, "Jul-26": 200000, "Sep-26": 200000 }
    ]
  },
  refunds: {
    totalRefunds: { name: "Refund", total: 0 }
  },
  expenses: {
    "Brokerage": [
      { name: "Sky Bridge Realty", total: 1557500, "Apr-26": 500000, "May-26": 1057500 }
    ],
    "Electricity Exp.": [
      { name: "Electricity Exp. Heritage", total: 389695, "Apr-26": 140624, "May-26": 249071 }
    ],
    "Salary Exp.": [
      { name: "Rawal Singh", total: 274725, "Apr-26": 41581, "May-26": 233144 }
    ],
    "Work Contract": [
      { name: "Karni Construction", total: 4000000, "Apr-26": 2000000, "May-26": 2000000 }
    ]
  }
};

const GOOGLE_SHEETS_API_URL = "";

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

export default function Dashboard() {
  const [appData, setAppData] = useState(financialData);
  const [availablePeriods, setAvailablePeriods] = useState(defaultPeriods);
  const [period, setPeriod] = useState('total');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('OUTFLOW'); 
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [activePieSlice, setActivePieSlice] = useState(null);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  
  const inflowFileInputRef = useRef(null);
  const outflowFileInputRef = useRef(null);

  const fetchLiveSheetData = async () => {
    if (!GOOGLE_SHEETS_API_URL) {
      alert("Please add your Google Apps Script URL to the code to use this feature.");
      return;
    }
    setIsFetching(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_API_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      setAppData(data);
      alert("Dashboard updated with live data!");
    } catch (error) {
      alert("Failed to connect to Sheets.");
    } finally {
      setIsFetching(false);
    }
  };

  const downloadInflowCSV = () => {
    let csv = `Category,Payee Name,Total,${availablePeriods.join(',')}\n`;
    Object.entries(appData.revenue).forEach(([category, items]) => {
      items.forEach(item => {
        const cleanName = item.name.replace(/,/g, '');
        const monthVals = availablePeriods.map(m => item[m] || 0).join(',');
        csv += `${category},${cleanName},${item.total},${monthVals}\n`;
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'heritage_inflow_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadOutflowCSV = () => {
    let csv = `Category,Payee Name,Total,${availablePeriods.join(',')}\n`;
    const refundVals = availablePeriods.map(m => appData.refunds.totalRefunds[m] || 0).join(',');
    csv += `Refund,Total Refunds,${appData.refunds.totalRefunds.total},${refundVals}\n`;
    
    Object.entries(appData.expenses).forEach(([category, items]) => {
      items.forEach(item => {
        const cleanName = item.name.replace(/,/g, '');
        const monthVals = availablePeriods.map(m => item[m] || 0).join(',');
        csv += `${category},${cleanName},${item.total},${monthVals}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'heritage_outflow_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleInflowUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n');
      if (rows.length === 0) return;

      const headers = rows[0].split(',').map(h => h.trim().replace(/["\r]/g, ''));
      if (headers.length < 4) {
        alert("Invalid CSV. Expected: Category, Payee Name, Total, Month1, Month2...");
        return;
      }
      
      const monthHeaders = headers.slice(3); // Extract dynamic months (Apr-26, etc)
      setAvailablePeriods(monthHeaders);

      const newRevenue = {};
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const cols = rows[i].split(',');
        if (cols.length < 4) continue;

        const category = cols[0].trim().replace(/["\r]/g, '');
        const name = cols[1].trim().replace(/["\r]/g, '');
        const total = parseInt(cols[2]) || 0;

        const item = { name, total };
        monthHeaders.forEach((month, idx) => {
          item[month] = parseInt(cols[3 + idx]) || 0;
        });

        if (!newRevenue[category]) newRevenue[category] = [];
        newRevenue[category].push(item);
      }
      setAppData(prev => ({ ...prev, revenue: newRevenue }));
      setActiveFilter('INFLOW'); // Auto switch view
      setPeriod('total');
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleOutflowUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n');
      if (rows.length === 0) return;

      const headers = rows[0].split(',').map(h => h.trim().replace(/["\r]/g, ''));
      const monthHeaders = headers.slice(3);
      setAvailablePeriods(monthHeaders);

      const newRefunds = { totalRefunds: { name: "Refund", total: 0 } };
      const newExpenses = {};

      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const cols = rows[i].split(',');
        if (cols.length < 4) continue;

        const category = cols[0].trim().replace(/["\r]/g, '');
        const name = cols[1].trim().replace(/["\r]/g, '');
        const total = parseInt(cols[2]) || 0;

        const item = { name, total };
        monthHeaders.forEach((month, idx) => {
          item[month] = parseInt(cols[3 + idx]) || 0;
        });

        if (category.toLowerCase().includes('refund')) {
          newRefunds.totalRefunds = item;
        } else {
          if (!newExpenses[category]) newExpenses[category] = [];
          newExpenses[category].push(item);
        }
      }
      setAppData(prev => ({ ...prev, refunds: newRefunds, expenses: newExpenses }));
      setActiveFilter('OUTFLOW'); // Auto switch view
      setPeriod('total');
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const aggregates = useMemo(() => {
    let totalRevenue = 0;
    Object.values(appData.revenue).forEach(items => {
      items.forEach(item => {
        totalRevenue += Number(item[period] !== undefined ? item[period] : item.total) || 0;
      });
    });

    let totalRefunds = Number(appData.refunds.totalRefunds[period] !== undefined ? appData.refunds.totalRefunds[period] : appData.refunds.totalRefunds.total) || 0;
    let totalExpenses = 0;
    
    Object.values(appData.expenses).forEach(items => {
      items.forEach(item => {
        totalExpenses += Number(item[period] !== undefined ? item[period] : item.total) || 0;
      });
    });

    const categoryTotals = [];
    const allTransactions = [];

    // Process Inflow dynamically
    Object.entries(appData.revenue).forEach(([category, items]) => {
      let catSum = 0;
      items.forEach(item => {
        const val = Number(item[period] !== undefined ? item[period] : item.total) || 0;
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
      allTransactions.push({ name: 'Customer Refunds', category: 'Refund', displayAmount: totalRefunds, type: 'LEAKAGE' });
    }

    // Process Outflow dynamically
    Object.entries(appData.expenses).forEach(([category, items]) => {
      let catSum = 0;
      items.forEach(item => {
        const val = Number(item[period] !== undefined ? item[period] : item.total) || 0;
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
  }, [period, activeFilter, appData]);

  const filteredTransactions = aggregates.transactions.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const monthlyTrendData = useMemo(() => {
    if (activeFilter === 'ALL') return { data: [], maxAmount: 0 }; // Hidden in ALL view anyway

    const data = availablePeriods.map(month => {
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
  }, [appData, availablePeriods, activeFilter]);

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
  const periodText = period === 'total' ? 'Overall Total' : period;

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
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 items-center">
          {/* Data Management Buttons */}
          <div className="flex gap-2">
            <button onClick={downloadInflowCSV} className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-emerald-400 hover:text-emerald-300 min-w-[50px] md:min-w-[70px]">
              <Download className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="whitespace-nowrap">In</span>
            </button>
            <button onClick={downloadOutflowCSV} className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-rose-400 hover:text-rose-300 min-w-[50px] md:min-w-[70px]">
              <Download className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="whitespace-nowrap">Out</span>
            </button>
            <input type="file" accept=".csv" ref={inflowFileInputRef} onChange={handleInflowUpload} className="hidden" />
            <button onClick={() => inflowFileInputRef.current.click()} className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-emerald-400 hover:text-emerald-300 min-w-[50px] md:min-w-[70px]">
              <Upload className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="whitespace-nowrap">In</span>
            </button>
            <input type="file" accept=".csv" ref={outflowFileInputRef} onChange={handleOutflowUpload} className="hidden" />
            <button onClick={() => outflowFileInputRef.current.click()} className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-rose-400 hover:text-rose-300 min-w-[50px] md:min-w-[70px]">
              <Upload className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="whitespace-nowrap">Out</span>
            </button>
            <button onClick={fetchLiveSheetData} disabled={isFetching} className={`flex items-center gap-1.5 px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-md transition-all btn-3d text-purple-400 hover:text-purple-300 ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isFetching ? <RefreshCw className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Link2 className="w-3 h-3 md:w-4 md:h-4" />} Sync
            </button>
          </div>

          {/* DYNAMIC PERIOD DROPDOWN */}
          <div className="relative animate-fade-in">
            <button 
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="flex items-center justify-between gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-md transition-all btn-3d text-slate-200 hover:text-white min-w-[145px]"
            >
              <span className="whitespace-nowrap">
                {period === 'total' ? 'Overall Total' : period}
              </span>
              <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-blue-400 transition-transform ${showPeriodMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPeriodMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPeriodMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto custom-scrollbar panel-3d rounded-lg z-50 flex flex-col border border-white/10 shadow-2xl">
                  {[
                    { id: 'total', label: 'Overall Total' },
                    ...availablePeriods.map(p => ({ id: p, label: p }))
                  ].map(btn => (
                    <button 
                      key={btn.id}
                      onClick={() => { setPeriod(btn.id); setShowPeriodMenu(false); }}
                      className={`px-4 py-2.5 text-left text-xs md:text-sm font-medium transition-colors ${period === btn.id ? 'bg-blue-600/30 text-blue-400 border-l-2 border-blue-500' : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent'}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 shrink-0">
        <div onClick={() => setActiveFilter('INFLOW')} className={`rounded-xl p-3 md:p-4 cursor-pointer transition-all flex flex-col justify-between ${activeFilter === 'INFLOW' ? 'panel-3d-active-inflow' : 'panel-3d hover:brightness-110'} ${activeFilter !== 'INFLOW' && activeFilter !== 'ALL' ? 'opacity-60 grayscale-[30%]' : ''}`}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-xs md:text-sm font-medium">Total Inflow</span>
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          </div>
          <h3 className="text-lg md:text-2xl font-bold font-mono tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-emerald-400">
            {formatCurrency(displayRevenue)}
          </h3>
        </div>

        <div onClick={() => setActiveFilter('OUTFLOW')} className={`rounded-xl p-3 md:p-4 cursor-pointer transition-all flex flex-col justify-between ${activeFilter === 'OUTFLOW' ? 'panel-3d-active-outflow' : 'panel-3d hover:brightness-110'} ${activeFilter !== 'OUTFLOW' && activeFilter !== 'ALL' ? 'opacity-60 grayscale-[30%]' : ''}`}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-xs md:text-sm font-medium">Total Outflow</span>
            <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5 text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
          </div>
          <h3 className="text-lg md:text-2xl font-bold font-mono tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-rose-400">
            {formatCurrency(displayExpenses)}
          </h3>
        </div>

        <div onClick={() => setActiveFilter('LEAKAGE')} className={`rounded-xl p-3 md:p-4 cursor-pointer transition-all flex flex-col justify-between ${activeFilter === 'LEAKAGE' ? 'panel-3d-active-leakage' : 'panel-3d hover:brightness-110'} ${activeFilter !== 'LEAKAGE' && activeFilter !== 'ALL' ? 'opacity-60 grayscale-[30%]' : ''}`}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-xs md:text-sm font-medium">Refunds Issued</span>
            <Crosshair className="w-4 h-4 md:w-5 md:h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
          </div>
          <h3 className="text-lg md:text-2xl font-bold font-mono tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-amber-400">
            {formatCurrency(displayRefunds)}
          </h3>
        </div>

        <div onClick={() => setActiveFilter('ALL')} className={`rounded-xl p-3 md:p-4 cursor-pointer transition-all flex flex-col justify-between ${activeFilter === 'ALL' ? 'panel-3d-active-net' : 'panel-3d hover:brightness-110'} ${activeFilter !== 'ALL' ? 'opacity-60 grayscale-[30%]' : ''}`}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-slate-400 text-xs md:text-sm font-medium">Net Position (All)</span>
            <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
          </div>
          <h3 className={`text-lg md:text-2xl font-bold font-mono tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${currentNetPosition >= 0 ? 'text-white' : 'text-rose-500'}`}>
            {formatCurrency(currentNetPosition)}
          </h3>
        </div>
      </div>

      {}
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 h-[28vh] md:h-[32vh] shrink-0">
            {/* Category Breakdown (List) */}
            <div className="md:col-span-4 panel-3d rounded-xl p-2 md:p-3 flex flex-col h-full overflow-hidden">
              <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-1.5 shrink-0 flex items-center gap-2 drop-shadow-sm">
                <Filter className="w-3 h-3 md:w-4 md:h-4 text-blue-500" /> Category Breakdown <span className="text-blue-400 font-bold text-[10px] md:text-xs">{filterLabel}</span>
              </h2>
              <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
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
                        <div className="w-full progress-track-3d rounded-full h-1 overflow-hidden">
                          <div className={`${barColor} h-1 rounded-full transition-all duration-1000 ease-out progress-bar-3d`} style={{ width: `${percentage}%` }}></div>
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

            {/* Donut Chart */}
            <div className="md:col-span-4 bg-[#121f42] rounded-xl p-2 md:p-3 flex flex-col h-full overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_5px_15px_rgba(0,0,0,0.5)] border border-white/5">
              <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-1.5 shrink-0 flex items-center gap-2 drop-shadow-sm">
                <PieChart className="w-3 h-3 md:w-4 md:h-4 text-purple-400" /> Distribution <span className="text-purple-300 font-bold text-[10px] md:text-xs">{filterLabel}</span>
              </h2>
              <div className="flex-1 flex flex-row items-center justify-center min-h-0 relative py-1 md:py-2">
                {donutData.legend.length > 0 ? (
                  <>
                    <div className="relative aspect-square h-full max-h-[140px] flex items-center justify-center shrink-0">
                      <svg viewBox="-10 -10 120 120" className="w-full h-full overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
                        {donutData.slices.map((slice, idx) => {
                          const isActive = activePieSlice === slice.name;
                          const safeEnd = slice.endPercent - slice.startPercent >= 1 ? slice.startPercent + 0.999 : slice.endPercent;
                          const getCoords = (p) => [Math.cos(2 * Math.PI * (p - 0.25)), Math.sin(2 * Math.PI * (p - 0.25))];
                          const [startX, startY] = getCoords(slice.startPercent);
                          const [endX, endY] = getCoords(safeEnd);
                          const [midX, midY] = getCoords((slice.startPercent + safeEnd) / 2);
                          const largeArcFlag = safeEnd - slice.startPercent > 0.5 ? 1 : 0;
                          const shift = isActive ? 8 : 0; 
                          const transform = `translate(${midX * shift}, ${midY * shift})`;
                          const pathData = [`M ${50 + startX * 46} ${50 + startY * 46}`, `A 46 46 0 ${largeArcFlag} 1 ${50 + endX * 46} ${50 + endY * 46}`, `L ${50 + endX * 26} ${50 + endY * 26}`, `A 26 26 0 ${largeArcFlag} 0 ${50 + startX * 26} ${50 + startY * 26}`, `Z`].join(' ');
                          return <path key={idx} d={pathData} fill={slice.color} transform={transform} onClick={() => setActivePieSlice(isActive ? null : slice.name)} className="cursor-pointer transition-all duration-300 ease-out outline-none" style={{ stroke: '#0a1128', strokeWidth: 1.5 }} />;
                        })}
                      </svg>
                    </div>
                    <div className="ml-2 md:ml-4 flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 max-h-full">
                      {donutData.legend.map((item, idx) => (
                        <div key={idx} className={`flex items-center justify-between gap-1.5 p-1 rounded-md cursor-pointer transition-all duration-200 ${activePieSlice === item.name ? 'bg-white/10' : 'hover:bg-white/5'}`} onClick={() => setActivePieSlice(item.name)}>
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

            {/* Monthly Trend Bar Chart */}
            <div className="md:col-span-4 panel-3d rounded-xl p-2 md:p-3 flex flex-col h-full overflow-hidden relative">
              <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-1.5 shrink-0 flex items-center gap-2 drop-shadow-sm">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /> Monthly Trend <span className="text-emerald-300 font-bold text-[10px] md:text-xs">{filterLabel}</span>
              </h2>
              <div className="flex-1 flex items-end justify-between gap-1 mt-2 min-h-0 overflow-x-auto pb-4 custom-scrollbar">
                {monthlyTrendData.data.map((d, i) => {
                  const heightPercent = monthlyTrendData.maxAmount > 0 ? (d.amount / monthlyTrendData.maxAmount) * 100 : 0;
                  // Set color based on active filter
                  let barGradient = 'from-rose-500 to-rose-700'; // Default Outflow
                  if (activeFilter === 'INFLOW') barGradient = 'from-emerald-400 to-emerald-600';
                  if (activeFilter === 'LEAKAGE') barGradient = 'from-amber-400 to-amber-600';

                  return (
                    <div key={i} className="relative flex flex-col items-center flex-1 group min-w-[20px] h-full justify-end">
                       {/* Tooltip on hover */}
                       <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                         {formatCompactCurrency(d.amount)}
                       </div>
                       
                       {/* The Bar */}
                       <div 
                         className={`w-full max-w-[24px] bg-gradient-to-t ${barGradient} rounded-t-sm transition-all duration-700 ease-out border-t border-white/20`}
                         style={{ height: `${Math.max(heightPercent, 2)}%` }} // min 2% height so empty months are slightly visible
                       ></div>
                       
                       {/* X-Axis Label */}
                       <span className="absolute -bottom-4 text-[8px] md:text-[9px] text-slate-400 whitespace-nowrap rotate-[-45deg] origin-top-left mt-1">
                         {d.month.split('-')[0]} {/* Shows just 'Apr', 'May' etc */}
                       </span>
                    </div>
                  );
                })}
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

      {}
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
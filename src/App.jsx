import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
} from 'recharts';
import { 
  Building2, Database, DollarSign, Briefcase, BarChart2, Users, Receipt, Zap, Calendar, 
  Search, ArrowUpRight, ArrowDownRight, Crosshair, Filter, Activity, ChevronDown, 
  ChevronUp, PieChart as PieChartIcon, Target, RefreshCw, Download, Upload, Info
} from 'lucide-react';

const initialRawData = [
  { type: 'Revenue', category: 'Collection', payeeName: 'Total Collection', total: 32560463, apr25:25530361, may25:7030102, jun25:0, jul25:0, aug25:0, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Refund', category: 'Refund', payeeName: 'Total Refunds', total: 350000, apr25:350000, may25:0, jun25:0, jul25:0, aug25:0, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Brokerage', payeeName: 'THE HERITAGE -NARSINGHPUR (BROKERAGE)', total: 6386000, apr25:3193000, may25:100000, jun25:0, jul25:1000000, aug25:2093000, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Other Expenses', payeeName: 'ELECTRICITY EXP. HERITAGE', total: 765022, apr25:382511, may25:211092, jun25:0, jul25:30795, aug25:18547, sep25:24304, oct25:46886, nov25:26915, dec25:23972, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Other Expenses', payeeName: 'GRAPHITE DESIGN STUFIO', total: 1180000, apr25:590000, may25:0, jun25:0, jul25:590000, aug25:0, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Fees & Taxes', payeeName: 'JDA REGULATION FEES', total: 19910032, apr25:9955016, may25:2003095, jun25:0, jul25:750000, aug25:7201921, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Land Owner', payeeName: 'LAND OWNER-HERITAGE', total: 81600000, apr25:40800000, may25:0, jun25:0, jul25:40800000, aug25:0, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Other Expenses', payeeName: 'LAND SCAPEING CONSULTANCY CHARGES', total: 389400, apr25:194700, may25:77880, jun25:0, jul25:116820, aug25:0, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Legal & Professional', payeeName: 'LEGAL/PROFESSIONAL/CONSULTANCY EXP', total: 931884, apr25:465942, may25:0, jun25:0, jul25:465942, aug25:0, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Office Expenses', payeeName: 'OFFICE EXP.', total: 139922, apr25:69961, may25:0, jun25:1800, jul25:6598, aug25:10664, sep25:9385, oct25:10469, nov25:31045, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Fees & Taxes', payeeName: 'Rera Registration Heritage Exp', total: 657007.66, apr25:328503.83, may25:0, jun25:0, jul25:0, aug25:328503.83, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Salary', payeeName: 'SALARY EXP.', total: 1093170, apr25:545591, may25:11667, jun25:16667, jul25:38000, aug25:39667, sep25:68000, oct25:43000, nov25:38833, dec25:39774, jan26:18000, feb26:45500, mar26:18000, apr26:18000, may26:18000, jun26:54000, jul26:78483, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Sales & Marketing', payeeName: 'SALES & MARKETING EXP.', total: 23910239, apr25:10593170, may25:137947, jun25:371700, jul25:34161, aug25:0, sep25:245853, oct25:86140, nov25:117051, dec25:1139285, jan26:2243374, feb26:6217659, mar26:2723899, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Site Expenses', payeeName: 'SITE EXPENSES-HERITAGE', total: 5447798, apr25:2723899, may25:30000, jun25:86865, jul25:467165, aug25:0, sep25:12600, oct25:121807, nov25:33950, dec25:37908, jan26:456240, feb26:1477364, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Fees & Taxes', payeeName: 'STAMP DUTY- HERITAGE', total: 4564570, apr25:2282285, may25:2281585, jun25:0, jul25:700, aug25:0, sep25:0, oct25:0, nov25:0, dec25:0, jan26:0, feb26:0, mar26:0, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
  { type: 'Expense', category: 'Work Contractor', payeeName: 'WORK CONTRACT', total: 48957914, apr25:17181086, may25:34150, jun25:1222830, jul25:882621, aug25:40600, sep25:9554900, oct25:5216511, nov25:7683750, dec25:75000, jan26:67450, feb26:6243210, mar26:5216511, apr26:0, may26:0, jun26:0, jul26:0, aug26:0, sep26:0 },
];

const generateMonthsList = (startYear, startMonth, totalMonths) => {
  const list = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentYear = startYear;
  let currentMonthIdx = startMonth - 1;

  for (let i = 0; i < totalMonths; i++) {
    const monthStr = monthNames[currentMonthIdx];
    const yearStr = currentYear.toString().slice(2);
    const key = `${monthStr.toLowerCase()}${yearStr}`;
    const label = `${monthStr} ${currentYear}`;
    list.push({ index: i, key, label, year: currentYear, month: monthStr });
    currentMonthIdx++;
    if (currentMonthIdx > 11) {
      currentMonthIdx = 0;
      currentYear++;
    }
  }
  return list;
};

const monthsList = generateMonthsList(2025, 4, 24);
const COMPARE_COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b'];

const getCategoryIcon = (category) => {
  switch(category) {
    case 'Brokerage': return <Briefcase size={14} />;
    case 'Land Owner': return <Building2 size={14} />;
    case 'Salary': return <Users size={14} />;
    case 'Sales & Marketing': return <BarChart2 size={14} />;
    case 'Fees & Taxes': return <Receipt size={14} />;
    case 'Other Expenses': return <Zap size={14} />;
    case 'Collection': return <Target size={14} />;
    case 'Refund': return <RefreshCw size={14} />;
    default: return <Database size={14} />;
  }
};

const Custom3DBar = (props) => {
  const { fill, x, y, width, height } = props;
  if (!height || height <= 0) return null;
  const depth = Math.min(6, width / 2.5); 
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      <path d={`M${x + width},${y} L${x + width + depth},${y - depth} L${x + width + depth},${y + height - depth} L${x + width},${y + height} Z`} fill={fill} />
      <path d={`M${x + width},${y} L${x + width + depth},${y - depth} L${x + width + depth},${y + height - depth} L${x + width},${y + height} Z`} fill="black" fillOpacity={0.35} />
      <path d={`M${x},${y} L${x + depth},${y - depth} L${x + width + depth},${y - depth} L${x + width},${y} Z`} fill={fill} />
      <path d={`M${x},${y} L${x + depth},${y - depth} L${x + width + depth},${y - depth} L${x + width},${y} Z`} fill="white" fillOpacity={0.3} />
    </g>
  );
};

const CustomStyles = () => (
  <style>{`
    html, body, #root { height: 100%; margin: 0; overflow: hidden; background: #0f172a; }
    .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    .bg-3d-base { background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 60%, #020617 100%); }
    .panel-3d { background: linear-gradient(145deg, #162032, #0d131f); box-shadow: 5px 5px 10px #06090f, -5px -5px 10px #1c2941; border: 1px solid rgba(255, 255, 255, 0.03); }
    .panel-3d-active-inflow { background: #0f172a; box-shadow: inset 4px 4px 8px #06090f, inset -4px -4px 8px #1c2941; border: 1px solid rgba(16, 185, 129, 0.4); }
    .panel-3d-active-outflow { background: #0f172a; box-shadow: inset 4px 4px 8px #06090f, inset -4px -4px 8px #1c2941; border: 1px solid rgba(244, 63, 94, 0.4); }
    .panel-3d-active-leakage { background: #0f172a; box-shadow: inset 4px 4px 8px #06090f, inset -4px -4px 8px #1c2941; border: 1px solid rgba(251, 191, 36, 0.4); }
    .panel-3d-active-net { background: #0f172a; box-shadow: inset 4px 4px 8px #06090f, inset -4px -4px 8px #1c2941; border: 1px solid rgba(59, 130, 246, 0.4); }
    .progress-track-3d { background: #06090f; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.8); }
    .date-popover { animation: popIn 0.2s ease-out forwards; transform-origin: top left; }
    @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
  `}</style>
);

export default function App() {
  const [transactionData, setTransactionData] = useState(initialRawData);
  const [tableView, setTableView] = useState('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('All');
  const [logCategoryFilter, setLogCategoryFilter] = useState('All');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [currencyFormat, setCurrencyFormat] = useState('default');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateConfig, setDateConfig] = useState({
    mode: 'all',
    single: 'apr25',
    range: { start: 'may25', end: 'dec25' },
    compare: ['jun25', 'dec25']
  });
  const [popoverYearTab, setPopoverYearTab] = useState(2025);
  const [selectionStep, setSelectionStep] = useState(0); 
  const [pieDrillDownCategory, setPieDrillDownCategory] = useState(null);
  const [activePieIndex, setActivePieIndex] = useState(-1);
  const fileInputRef = useRef(null);

  const downloadCSV = () => {
    const headerRow = ['Type', 'Category', 'Payee Name', 'Total', ...monthsList.map(m => m.label)].join(',');
    let csv = headerRow + '\n';
    transactionData.forEach(item => {
      if (item.payeeName === 'Total Collection' && item.type === 'Revenue') return;
      const cleanName = item.payeeName.replace(/,/g, ' ');
      const row = [item.type, item.category, cleanName, item.total, ...monthsList.map(m => item[m.key] || 0)];
      csv += row.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heritage_dashboard_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n');
      if (rows.length < 2) return;
      const newData = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const cols = rows[i].split(',');
        if (cols.length < 4) continue;
        const item = {
          type: cols[0].trim(),
          category: cols[1].trim(),
          payeeName: cols[2].trim(),
          total: parseFloat(cols[3]) || 0
        };
        monthsList.forEach((m, idx) => {
          item[m.key] = parseFloat(cols[4 + idx]) || 0;
        });
        newData.push(item);
      }
      setTransactionData(newData);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const formatCurrency = (value) => {
    if (currencyFormat === 'lakhs') return '₹' + (value / 100000).toFixed(2) + ' L';
    if (currencyFormat === 'crores') return '₹' + (value / 10000000).toFixed(2) + ' Cr';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const getLabelForKey = (k) => monthsList.find(m => m.key === k)?.label || k;

  const getAmountForRules = (item, mode, cfg) => {
    if (mode === 'all') return item.total;
    if (mode === 'single') return item[cfg.single] || 0;
    if (mode === 'range') {
      let sum = 0;
      const sIdx = monthsList.find(m => m.key === cfg.range.start)?.index || 0;
      const eIdx = monthsList.find(m => m.key === cfg.range.end)?.index || 0;
      const min = Math.min(sIdx, eIdx); const max = Math.max(sIdx, eIdx);
      monthsList.forEach(m => { if (m.index >= min && m.index <= max) sum += (item[m.key] || 0); });
      return sum;
    }
    return 0;
  };

  const getFilterDisplayLabel = () => {
    if (dateConfig.mode === 'all') return 'All Time';
    if (dateConfig.mode === 'single') return getLabelForKey(dateConfig.single);
    if (dateConfig.mode === 'range') return `${getLabelForKey(dateConfig.range.start)} - ${getLabelForKey(dateConfig.range.end)}`;
    if (dateConfig.mode === 'compare') {
      if (dateConfig.compare.length === 0) return 'Select Months';
      if (dateConfig.compare.length === 1) return getLabelForKey(dateConfig.compare[0]);
      if (dateConfig.compare.length === 2) return `${getLabelForKey(dateConfig.compare[0])} vs ${getLabelForKey(dateConfig.compare[1])}`;
      return `Comparing ${dateConfig.compare.length} Months`;
    }
    return 'Custom';
  };

  const processedData = useMemo(() => {
    const buildStats = (amountExtractor) => {
      let inflow = 0; let outflow = 0; let refunds = 0;
      const categoryTotals = {};
      const transactions = [];
      transactionData.forEach(item => {
        let amount = amountExtractor(item);
        if (amount === 0) return;
        if (item.type === 'Revenue') inflow += amount;
        else if (item.type === 'Refund') { refunds += amount; outflow += amount; } 
        else if (item.type === 'Expense') outflow += amount;
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + amount;
        transactions.push({ ...item, currentAmount: amount });
      });
      const netPosition = inflow - outflow;
      let filteredCategories = Object.entries(categoryTotals).map(([name, value]) => {
        let type = 'Expense';
        if (name === 'Collection') type = 'Revenue';
        if (name === 'Refund') type = 'Refund';
        return { name, value, type };
      });
      if (logTypeFilter !== 'All') filteredCategories = filteredCategories.filter(cat => cat.type === logTypeFilter);
      const breakdownData = filteredCategories.sort((a, b) => b.value - a.value);
      const maxCategoryAmount = breakdownData.length > 0 ? breakdownData[0].value : 1;
      return { inflow, outflow, refunds, netPosition, breakdownData, maxCategoryAmount, transactions: transactions.sort((a, b) => b.currentAmount - a.currentAmount) };
    };

    if (dateConfig.mode === 'compare') {
       const multiStats = dateConfig.compare.map(key => ({ key, stats: buildStats(item => item[key] || 0) }));
       const allCats = Array.from(new Set(multiStats.flatMap(m => m.stats.breakdownData.map(c=>c.name))));
       const compChartData = allCats.map(c => {
          const row = { name: c, total: 0 };
          multiStats.forEach(m => {
             const val = m.stats.breakdownData.find(x => x.name === c)?.value || 0;
             row[m.key] = val;
             row.total += val;
          });
          return row;
       }).filter(c => c.name !== 'Collection' && c.name !== 'Refund').sort((a,b)=>b.total - a.total).slice(0,8);
       const uniquePayees = new Map();
       transactionData.forEach(t => {
           let hasVal = false;
           dateConfig.compare.forEach(k => { if(t[k] > 0) hasVal = true; });
           if(hasVal) uniquePayees.set(t.payeeName, t);
       });
       const unifiedTransactions = Array.from(uniquePayees.values()).map(t => ({...t, currentAmount: 0}));
       return { isComparing: true, multiStats, compChartData, transactions: unifiedTransactions };
    } else {
       const stats = buildStats(item => getAmountForRules(item, dateConfig.mode, dateConfig));
       return { isComparing: false, A: stats, transactions: stats.transactions };
    }
  }, [dateConfig, transactionData, logTypeFilter]);

  const filteredTransactions = useMemo(() => {
    return processedData.transactions.filter(trx => {
      const matchesSearch = trx.payeeName.toLowerCase().includes(searchTerm.toLowerCase()) || trx.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = logTypeFilter === 'All' || trx.type === logTypeFilter;
      const matchesCategory = logCategoryFilter === 'All' || trx.category === logCategoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [processedData.transactions, searchTerm, logTypeFilter, logCategoryFilter]);

  const donutData = useMemo(() => {
    if (processedData.isComparing) return null;
    const colorsList = ['#3B82F6', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#fbbf24', '#f43f5e', '#84cc16'];
    let legend = [];
    if (pieDrillDownCategory) {
      const categoryTransactions = processedData.transactions.filter(t => t.category === pieDrillDownCategory);
      const total = categoryTransactions.reduce((sum, t) => sum + t.currentAmount, 0);
      categoryTransactions.forEach((trx, idx) => {
        const percent = total > 0 ? (trx.currentAmount / total) * 100 : 0;
        legend.push({ name: trx.payeeName, color: colorsList[idx % colorsList.length], percent, amount: trx.currentAmount });
      });
      return { legend, total, isDrillDown: true, title: pieDrillDownCategory };
    } else {
      const total = processedData.A.breakdownData.reduce((sum, cat) => sum + cat.value, 0);
      processedData.A.breakdownData.forEach((cat, idx) => {
        const percent = total > 0 ? (cat.value / total) * 100 : 0;
        let color = colorsList[idx % colorsList.length];
        if (cat.name === 'Collection') color = '#10b981';
        else if (cat.name === 'Refund') color = '#f59e0b';
        legend.push({ name: cat.name, color, percent, amount: cat.value });
      });
      return { legend, total, isDrillDown: false, title: 'Categories' };
    }
  }, [processedData, pieDrillDownCategory]);

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, percent } = props;
    const explodeOffset = outerRadius * 0.25; 
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const ex = cx + (explodeOffset * cos);
    const ey = cy + (explodeOffset * sin);
    return (
      <g>
        <Sector cx={ex} cy={ey + 6} innerRadius={innerRadius} outerRadius={outerRadius + 3} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.6} />
        <Sector cx={ex} cy={ey} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <text x={ex + (outerRadius + 20) * cos} y={ey + (outerRadius + 20) * sin} textAnchor={cos >= 0 ? 'start' : 'end'} fill="#e2e8f0" dominantBaseline="central" fontSize={11} fontWeight="bold">
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    );
  };

  const handleMonthClick = (key) => {
     if (dateConfig.mode === 'single') {
        setDateConfig({...dateConfig, single: key});
        setShowDatePicker(false);
     } else if (dateConfig.mode === 'range') {
        if (selectionStep === 0) { setDateConfig({...dateConfig, range: {start: key, end: key}}); setSelectionStep(1); }
        else { setDateConfig({...dateConfig, range: {...dateConfig.range, end: key}}); setSelectionStep(0); setShowDatePicker(false); }
     } else if (dateConfig.mode === 'compare') {
        let newComp = [...dateConfig.compare];
        if (newComp.includes(key)) newComp = newComp.filter(k => k !== key);
        else {
           if (newComp.length >= 4) newComp.shift();
           newComp.push(key);
        }
        setDateConfig({...dateConfig, compare: newComp});
     }
  };

  const isMonthSelected = (key) => {
     if (dateConfig.mode === 'single') return dateConfig.single === key;
     if (dateConfig.mode === 'compare') return dateConfig.compare.includes(key);
     if (dateConfig.mode === 'range') {
        const target = monthsList.find(m=>m.key===key)?.index;
        const s = monthsList.find(m=>m.key===dateConfig.range.start)?.index;
        const e = monthsList.find(m=>m.key===dateConfig.range.end)?.index;
        if(target===undefined || s===undefined || e===undefined) return false;
        return target >= Math.min(s,e) && target <= Math.max(s,e);
     }
     return false;
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col p-2 md:p-3 overflow-hidden text-slate-200 font-sans bg-[#0f172a] bg-3d-base relative box-border">
      <CustomStyles />
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 shrink-0 gap-2 relative z-50">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" /> The Heritage, Narsinghpura
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5 flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-400" /> Unified Dashboard <span className="bg-blue-500/20 text-blue-300 px-1.5 rounded text-[10px] font-bold border border-blue-500/30">V12</span>
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="flex gap-1.5 mr-1">
            <button onClick={downloadCSV} className="flex panel-3d px-2 py-1 md:px-3 md:py-1.5 rounded-lg items-center gap-1.5 text-[10px] md:text-xs font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30">
              <Download size={14} /> Export CSV
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current.click()} className="flex panel-3d px-2 py-1 md:px-3 md:py-1.5 rounded-lg items-center gap-1.5 text-[10px] md:text-xs font-bold text-blue-400 hover:text-blue-300 border border-blue-500/30">
              <Upload size={14} /> Import Data
            </button>
          </div>
          <div className="flex panel-3d p-0.5 rounded-lg items-center relative border border-emerald-500/30">
            <div className="pl-1.5 pr-1"><DollarSign size={12} className="text-emerald-400" /></div>
            <select value={currencyFormat} onChange={(e) => setCurrencyFormat(e.target.value)} className="bg-transparent text-slate-200 text-[10px] md:text-xs font-semibold py-1 pl-1 pr-5 focus:outline-none cursor-pointer appearance-none">
              <option value="default" className="bg-[#0f172a]">Default (₹)</option>
              <option value="lakhs" className="bg-[#1e293b]">In Lakhs (L)</option>
              <option value="crores" className="bg-[#1e293b]">In Crores (Cr)</option>
            </select>
          </div>
          <div className="relative">
            <div className="flex bg-[#0d1425] p-1.5 rounded-lg items-center border border-blue-500/30 cursor-pointer" onClick={() => setShowDatePicker(!showDatePicker)}>
              <Calendar size={14} className="text-blue-400 ml-1" />
              <div className="w-px h-4 bg-slate-600 mx-2"></div>
              <span className="text-xs font-bold text-slate-100 px-1">{getFilterDisplayLabel()}</span>
              <ChevronDown size={12} className="text-slate-400 ml-2 mr-1" />
            </div>
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 w-[340px] panel-3d rounded-xl border border-blue-500/40 shadow-2xl z-[100] p-3 date-popover flex flex-col gap-3">
                <div className="flex bg-[#0a0f1c] rounded-md p-1 border border-white/5">
                  {['all', 'single', 'range', 'compare'].map(m => (
                    <button key={m} onClick={() => { setDateConfig({...dateConfig, mode: m}); setSelectionStep(0); if(m==='all') setShowDatePicker(false); }} className={`flex-1 text-[10px] py-1.5 rounded font-bold uppercase ${dateConfig.mode === m ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                      {m}
                    </button>
                  ))}
                </div>
                {dateConfig.mode !== 'all' && (
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] text-blue-300 font-medium text-center">
                       {dateConfig.mode === 'range' && (selectionStep === 0 ? "Select START month" : "Select END month")}
                       {dateConfig.mode === 'compare' && "Select up to 4 months"}
                       {dateConfig.mode === 'single' && "Select a month"}
                    </div>
                    <div className="flex gap-2">
                      {[2025, 2026].map(y => (
                        <button key={y} onClick={() => setPopoverYearTab(y)} className={`flex-1 py-1 rounded text-xs font-bold border ${popoverYearTab === y ? 'bg-slate-700 text-white' : 'bg-[#0a0f1c] text-slate-400'}`}>Year {y}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 bg-[#0a0f1c] p-2 rounded-lg border border-white/5">
                      {monthsList.filter(m => m.year === popoverYearTab).map(m => {
                        const selected = isMonthSelected(m.key);
                        let bgClass = 'bg-slate-800/40 text-slate-400';
                        if (selected) {
                           if (dateConfig.mode === 'compare') {
                              bgClass = `${COMPARE_COLORS[dateConfig.compare.indexOf(m.key)]} text-white`;
                           } else bgClass = 'bg-blue-600 text-white';
                        }
                        return (
                          <button key={m.key} onClick={() => handleMonthClick(m.key)} className={`py-2 rounded text-[10px] font-bold border ${bgClass}`}>
                            {m.month}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 shrink-0">
        {[
          { key: 'inflow', label: 'Total Inflow', icon: ArrowUpRight, color: 'emerald' },
          { key: 'outflow', label: 'Total Expenses', icon: ArrowDownRight, color: 'rose' },
          { key: 'refunds', label: 'Refunds', icon: Crosshair, color: 'amber' },
          { key: 'netPosition', label: 'Net Fund Flow', icon: Database, color: 'blue' },
        ].map((kpi, idx) => {
          const FilterTrigger = kpi.key === 'netPosition' ? 'All' : (kpi.key === 'inflow' ? 'Revenue' : (kpi.key === 'outflow' ? 'Expense' : 'Refund'));
          const totalValue = !processedData.isComparing ? processedData.A[kpi.key] : processedData.multiStats.reduce((sum, stat) => sum + stat.stats[kpi.key], 0);
          return (
            <div key={idx} className={`rounded-xl p-3 cursor-pointer transition-all flex flex-col group ${logTypeFilter === FilterTrigger ? `panel-3d-active-${kpi.key==='netPosition'?'net':(kpi.key==='inflow'?'inflow':'outflow')}` : 'panel-3d'}`}
                 onClick={() => { setLogTypeFilter(FilterTrigger); setLogCategoryFilter('All'); setExpandedCategory(null); setPieDrillDownCategory(null); setActivePieIndex(-1); }}>
              <div className="flex justify-between items-start mb-1">
                <span className="text-slate-400 text-[10px] md:text-xs font-medium uppercase">{kpi.label}</span>
                <kpi.icon size={16} className={`text-${kpi.color}-400 opacity-70`} />
              </div>
              <h3 className={`text-lg md:text-2xl font-bold font-mono ${kpi.key==='netPosition' && totalValue < 0 ? 'text-rose-500' : 'text-white'}`}>
                {totalValue < 0 ? '-' : ''}{formatCurrency(Math.abs(totalValue))}
              </h3>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 h-[28vh] md:h-[30vh] shrink-0">
        <div className="md:col-span-6 panel-3d rounded-xl p-2 md:p-3 flex flex-col h-full overflow-hidden">
          <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-2"><Filter size={14} className="text-blue-500" /> Category Breakdown</span>
          </h2>
          <div className="space-y-1.5 overflow-y-auto pr-2 custom-scroll flex-1">
            {(!processedData.isComparing ? processedData.A.breakdownData : processedData.multiStats[0]?.stats.breakdownData || []).map((cat, idx) => {
              const isExpanded = expandedCategory === cat.name;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="cursor-pointer" onClick={() => { setExpandedCategory(isExpanded ? null : cat.name); setLogCategoryFilter(isExpanded ? 'All' : cat.name); }}>
                    <div className="flex justify-between items-end mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">{getCategoryIcon(cat.name)}</span>
                        <span className="font-medium text-slate-200 text-[10px] md:text-xs flex items-center gap-1">
                           {cat.name} {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-[10px] text-slate-300">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="w-full progress-track-3d rounded-full h-1 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-1 rounded-full" style={{ width: `${(cat.value / processedData.A.maxCategoryAmount)*100}%` }}></div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-1 pl-2 pr-1 py-1.5 border-l-2 border-slate-600 rounded-r bg-[#0a0f1c]/60 space-y-1">
                      {processedData.transactions.filter(t => t.category === cat.name).map((item, i) => (
                        <div key={i} className="flex justify-between text-[9px]">
                          <span className="text-slate-400">{item.payeeName}</span>
                          <span className="font-mono text-slate-300">{formatCurrency(item.currentAmount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-6 panel-3d rounded-xl p-2 md:p-3 flex flex-col h-full overflow-hidden">
          <h2 className="text-xs md:text-sm font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-2"><PieChartIcon size={14} className="text-purple-400" /> 3D Distribution</span>
          </h2>
          <div className="flex-1 w-full relative flex items-center justify-center">
            {donutData && donutData.legend.length > 0 ? (
              <div className="flex items-center w-full h-full">
                <div className="w-[160px] h-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData.legend} cx="50%" cy="50%" outerRadius={55} dataKey="amount" activeIndex={activePieIndex} activeShape={renderActiveShape} onClick={(_, idx) => setActivePieIndex(activePieIndex === idx ? -1 : idx)}>
                        {donutData.legend.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} formatter={(val) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll space-y-1 pl-2">
                  {donutData.legend.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[9px] text-slate-300">
                      <div className="flex items-center gap-1.5 truncate"><div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div><span className="truncate">{item.name}</span></div>
                      <span className="font-mono font-bold">{item.percent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="text-slate-500 text-xs">No Data Available</div>}
          </div>
        </div>
      </div>

      <div className="panel-3d rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="p-2 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xs md:text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Database size={14} className="text-blue-500" /> Transaction Detail Log
          </h2>
          <div className="flex gap-2">
            <div className="flex panel-3d p-0.5 rounded-lg border border-white/5">
              <button onClick={() => setTableView('standard')} className={`px-3 py-1 text-[10px] font-bold ${tableView==='standard'?'bg-blue-600 text-white':'text-slate-400'}`}>Summary</button>
              <button onClick={() => setTableView('monthly')} className={`px-3 py-1 text-[10px] font-bold ${tableView==='monthly'?'bg-purple-600 text-white':'text-slate-400'}`}>Full Spread</button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-3 py-1 bg-[#0a0f1c] border border-white/5 rounded-lg text-xs text-white focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="overflow-auto flex-1 custom-scroll">
          {tableView === 'standard' ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0d1425] z-10 border-b border-white/5 text-[10px] text-slate-400 uppercase">
                <tr><th className="py-2 px-3">Type</th><th className="py-2 px-3">Entity / Payee Name</th><th className="py-2 px-3">Category</th><th className="py-2 px-3 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredTransactions.map((trx, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="py-1.5 px-3"><span className="px-1.5 py-0.5 rounded text-[9px] bg-[#0a0f1c] text-slate-400">{trx.type}</span></td>
                    <td className="py-1.5 px-3 font-medium text-slate-200">{trx.payeeName}</td>
                    <td className="py-1.5 px-3 text-slate-400">{trx.category}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-slate-100">{formatCurrency(trx.currentAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 bg-[#0d1425] z-10 border-b border-white/5 text-[9px] text-slate-400 uppercase">
                <tr><th className="py-2 px-2 sticky left-0 bg-[#0d1425] z-20">Entity</th><th className="py-2 px-2 text-right text-blue-400">Total</th>{monthsList.map(m => <th key={m.key} className="py-2 px-2 text-right">{m.month}-{m.year.toString().slice(2)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[10px]">
                {filteredTransactions.map((trx, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="py-1.5 px-2 font-medium text-slate-200 sticky left-0 bg-[#0d1425] truncate max-w-[200px]">{trx.payeeName}</td>
                    <td className="py-1.5 px-2 text-right font-bold font-mono text-blue-300 bg-blue-900/10">{formatCurrency(trx.total)}</td>
                    {monthsList.map(m => <td key={m.key} className={`py-1.5 px-2 text-right font-mono ${trx[m.key] > 0 ? 'text-slate-300' : 'text-slate-600'}`}>{trx[m.key] > 0 ? formatCurrency(trx[m.key]) : '-'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
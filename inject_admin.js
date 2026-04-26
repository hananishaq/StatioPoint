const fs = require('fs');

let content = fs.readFileSync('frontend/admin.html', 'utf8');

// 1. Chart js CDN
if (!content.includes('chart.js')) {
  content = content.replace('</head>', '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n</head>');
}

// 2. Sidebar buttons
if (!content.includes("onclick=\"nav('analytics')\"")) {
  content = content.replace(
      '<button class="nav-item"        onclick="nav(\'reports\')"   title="Reports">📊</button>',
      `<button class="nav-item"        onclick="nav('reports')"   title="Reports">📊</button>
  <button class="nav-item"        onclick="nav('analytics')" title="Chart Analytics">📈</button>
  <button class="nav-item"        onclick="nav('restock')"   title="Smart Restock">🛒</button>`
  );
}

// 3. Screens
const analyticsScreen = `
    <!-- ── ANALYTICS SCREEN ────────────────────── -->
    <div class="screen" id="scr-analytics">
      <div style="display:flex;align-items:center;margin-bottom:20px;">
        <div class="sec-title" style="margin:0">Revenue Analytics</div>
        <div class="topbar-space"></div>
      </div>
      <div class="grid2" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">
        <div class="kpi kpi-gold"><div class="kpi-icon">💰</div><div class="kpi-lbl">Total Revenue</div><div class="kpi-val" id="an-revenue" style="color:var(--gold)">—</div></div>
        <div class="kpi kpi-teal"><div class="kpi-icon">🧾</div><div class="kpi-lbl">Total Sales</div><div class="kpi-val" id="an-sales" style="color:var(--teal)">—</div></div>
        <div class="kpi kpi-green"><div class="kpi-icon">🏆</div><div class="kpi-lbl">Best Product</div><div class="kpi-val" id="an-product" style="font-size:16px;line-height:1.2;margin-top:4px;">—</div></div>
        <div class="kpi"><div class="kpi-icon">👤</div><div class="kpi-lbl">Best Cashier</div><div class="kpi-val" id="an-cashier" style="font-size:16px;line-height:1.2;margin-top:4px;">—</div></div>
      </div>
      <div class="grid2" style="margin-bottom:20px;">
        <div class="chart-box">
          <div class="sec-title">Weekly Revenue</div>
          <div><canvas id="weeklyRevenueChart" height="200"></canvas></div>
        </div>
        <div class="chart-box">
          <div class="sec-title">Sales by Category</div>
          <div><canvas id="categoryRevenueChart" height="200"></canvas></div>
        </div>
      </div>
      <div class="chart-box">
        <div class="sec-title">Top 5 Best Selling Products</div>
        <div><canvas id="topProductsChart" height="240"></canvas></div>
      </div>
    </div>

    <!-- ── RESTOCK SCREEN ──────────────────────── -->
    <div class="screen" id="scr-restock">
      <div style="display:flex;align-items:center;margin-bottom:20px;">
        <div class="sec-title" style="margin:0">Smart Restock Report</div>
        <div class="topbar-space"></div>
        <button class="btn btn-outline" onclick="exportRestockCSV()">⬇️ Export CSV</button>
      </div>
      <div class="tbl-wrap" style="margin-bottom:20px;">
        <div class="tbl-head" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr;">
          <span>Product</span><span>Stock</span><span>Min</span><span>Order Qty</span><span>Est. Cost</span><span>Status</span>
        </div>
        <div id="restock-body"><div style="padding:20px;color:var(--txt3);font-size:12px;">Loading...</div></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:20px;background:var(--card);padding:20px;border-radius:14px;border:1px solid var(--border);">
        <div><div style="font-size:10px;color:var(--txt3);text-transform:uppercase;">Items to Restock</div><div id="re-items" style="font-size:24px;font-weight:700;">0</div></div>
        <div><div style="font-size:10px;color:var(--txt3);text-transform:uppercase;">Total Est. Cost</div><div id="re-cost" style="font-size:24px;font-weight:700;color:var(--gold)">Rs 0</div></div>
      </div>
    </div>
`;
if (!content.includes('id="scr-analytics"')) {
   content = content.replace('<!-- ── PROFILE SCREEN', analyticsScreen + '\n    <!-- ── PROFILE SCREEN');
}

// 4. JS variables
if (!content.includes("analytics:['Revenue Analytics'")) {
  content = content.replace(
    "reports:['Reports & Analytics','SALES PERFORMANCE'], profile:['My Profile','ACCOUNT SETTINGS']",
    "reports:['Reports & Analytics','SALES PERFORMANCE'], analytics:['Revenue Analytics','CHART DASHBOARD'], restock:['Smart Restock Report','INVENTORY PLANNING'], profile:['My Profile','ACCOUNT SETTINGS']"
  );
}

// 5. JS nav cases
if (!content.includes("if (screen==='analytics') loadAnalytics();")) {
  content = content.replace(
    "if (screen==='reports')   loadReports('monthly');",
    "if (screen==='reports')   loadReports('monthly');\n  if (screen==='analytics') loadAnalytics();\n  if (screen==='restock')   loadRestock();"
  );
}

// 6. JS custom logic
const jsLogic = `
// ── ANALYTICS ──────────────────────────────────────
let chartRefs = {};
async function loadAnalytics() {
  const [sumRes, weekRes, catRes, topRes] = await Promise.all([
    api('/analytics/summary'),
    api('/analytics/weekly-revenue'),
    api('/analytics/category-revenue'),
    api('/analytics/top-products')
  ]);

  if(sumRes.success) {
    document.getElementById('an-revenue').textContent = 'Rs ' + Number(sumRes.data.totalRevenue).toLocaleString();
    document.getElementById('an-sales').textContent   = sumRes.data.totalSalesCount;
    document.getElementById('an-product').textContent = sumRes.data.bestProduct;
    document.getElementById('an-cashier').textContent = sumRes.data.bestCashier;
  }

  const renderChart = (id, type, data, options) => {
    if(chartRefs[id]) chartRefs[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    chartRefs[id] = new Chart(ctx, { type, data, options });
  };

  if(weekRes.success) {
    if(!weekRes.data.length) {
      document.getElementById('weeklyRevenueChart').parentElement.innerHTML = '<div style="color:var(--txt3);font-size:12px;padding:20px">No data for last 7 days</div>';
    } else {
      renderChart('weeklyRevenueChart', 'bar', {
        labels: weekRes.data.map(d => new Date(d.date).toLocaleDateString('en-US', {weekday:'short'})),
        datasets: [{
          label: 'Revenue (Rs)',
          data: weekRes.data.map(d => d.revenue),
          backgroundColor: '#3B82F6',
          borderRadius: 4
        }]
      }, { responsive:true, maintainAspectRatio:false });
    }
  }

  if(catRes.success) {
    if(!catRes.data.length) {
      document.getElementById('categoryRevenueChart').parentElement.innerHTML = '<div style="color:var(--txt3);font-size:12px;padding:20px">No category data</div>';
    } else {
      renderChart('categoryRevenueChart', 'doughnut', {
        labels: catRes.data.map(d => d.category),
        datasets: [{
          data: catRes.data.map(d => d.revenue),
          backgroundColor: ['#3B82F6', '#0EA5E9', '#10B981', '#F5C842', '#EF4444', '#8B5CF6'],
          borderWidth: 0
        }]
      }, { responsive:true, maintainAspectRatio:false, cutout: '70%'});
    }
  }

  if(topRes.success) {
    if(!topRes.data.length) {
      document.getElementById('topProductsChart').parentElement.innerHTML = '<div style="color:var(--txt3);font-size:12px;padding:20px">No products data</div>';
    } else {
      renderChart('topProductsChart', 'bar', {
        labels: topRes.data.map(d => d.productName),
        datasets: [{
          label: 'Units Sold',
          data: topRes.data.map(d => d.quantitySold),
          backgroundColor: '#10B981',
          borderRadius: 4
        }]
      }, { indexAxis: 'y', responsive:true, maintainAspectRatio:false });
    }
  }
}

// ── RESTOCK REPORT ─────────────────────────────────
let restockData = [];
async function loadRestock() {
  const data = await api('/inventory/restock-report');
  if(!data.success) return;
  restockData = data.data;

  let totItems = restockData.length;
  let totCost = restockData.reduce((acc, curr) => acc + curr.estimatedCost, 0);

  document.getElementById('re-items').textContent = totItems;
  document.getElementById('re-cost').textContent = 'Rs ' + Number(totCost).toLocaleString();

  if(!restockData.length) {
     document.getElementById('restock-body').innerHTML = '<div style="padding:20px;color:var(--txt3);font-size:12px;">All products have sufficient stock.</div>';
     return;
  }

  document.getElementById('restock-body').innerHTML = restockData.map(r => \`
    <div class="tbl-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr;">
      <span class="name">\${r.productName}</span>
      <span style="font-weight:700;\${r.currentStock===0?'color:var(--red)':'color:var(--gold)'}">\${r.currentStock}</span>
      <span>\${r.minStock}</span>
      <span style="font-weight:700;">\${r.unitsToOrder}</span>
      <span style="color:var(--gold)">Rs \${Number(r.estimatedCost).toLocaleString()}</span>
      <span><span class="badge \${r.status==='Critical'?'badge-red':'badge-gold'}">\${r.status}</span></span>
    </div>
  \`).join('');
}

function exportRestockCSV() {
  if(!restockData.length) return toast('No data to export', 'error');
  const headers = ['Product Name', 'Current Stock', 'Min Stock', 'Order Qty', 'Estimated Cost (Rs)', 'Status'];
  const rows = restockData.map(r => [
    '"'+r.productName+'"', r.currentStock, r.minStock, r.unitsToOrder, r.estimatedCost, r.status
  ]);
  const csvFormat = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');

  const blob = new Blob([csvFormat], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Restock_Report_' + new Date().toISOString().split('T')[0] + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ── PROFILE
`;
if (!content.includes('loadAnalytics() {')) {
  content = content.replace('// ── PROFILE', jsLogic);
}

fs.writeFileSync('frontend/admin.html', content);

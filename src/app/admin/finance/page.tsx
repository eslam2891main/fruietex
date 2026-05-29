"use client";

import React, { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

interface PartnerTransaction {
  id: string;
  amount: number;
  type: string;
  date: string;
}

interface Partner {
  id: string;
  name: string;
  sharePercent: number;
  transactions: PartnerTransaction[];
}

interface FinanceStats {
  totalRevenue: number;
  totalCost: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalCapitalDeposits: number;
  totalWithdrawals: number;
  liquidity: number;
}

interface ExpensesBreakdown {
  SALARY: number;
  MARKETING: number;
  PACKAGING: number;
  GENERAL: number;
}

interface FinanceData {
  stats: FinanceStats;
  partners: Partner[];
  expenses: Expense[];
  expensesBreakdown: ExpensesBreakdown;
}

export default function AdminFinance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  // Forms state
  const [partnerForm, setPartnerForm] = useState({ name: "", sharePercent: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", category: "GENERAL" });
  const [transactionForm, setTransactionForm] = useState({ amount: "", type: "DEPOSIT", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/finance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching finance data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExpenses = () => {
    if (!data?.expenses) return;
    const headers = {
      date: "التاريخ",
      title: "البيان / الوصف",
      category: "الفئة",
      amount: "المبلغ (ج.م)"
    };

    const categoriesAr: Record<string, string> = {
      GENERAL: "عام",
      MARKETING: "إعلانات وتسويق",
      SALARY: "رواتب",
      PACKAGING: "تغليف"
    };

    const formattedData = data.expenses.map(e => ({
      date: new Date(e.date).toLocaleDateString("ar-EG"),
      title: e.title,
      category: categoriesAr[e.category] || e.category,
      amount: e.amount
    }));

    const csvHeaders = Object.values(headers).join(",") + "\n";
    const keys = Object.keys(headers);
    
    const csvRows = formattedData.map(item => {
      return keys.map(key => {
        const val = item[key as keyof typeof item] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
    }).join("\n");
    
    const csvBlob = new Blob(["\uFEFF" + csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses_report_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPartners = () => {
    if (!data?.partners) return;
    const headers = {
      name: "اسم الشريك",
      sharePercent: "النسبة (%)",
      capital: "رأس المال المدفوع (ج.م)",
      withdrawals: "إجمالي المسحوبات (ج.م)",
      profitShare: "نصيب الأرباح (ج.م)",
      balance: "الرصيد الحالي (ج.م)"
    };

    const formattedData = data.partners.map(partner => {
      const capital = partner.transactions
        .filter((t) => t.type === "DEPOSIT")
        .reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = partner.transactions
        .filter((t) => t.type === "WITHDRAWAL")
        .reduce((sum, t) => sum + t.amount, 0);
      const profitShare = ((data.stats.netProfit || 0) * partner.sharePercent) / 100;
      const balance = capital + profitShare - withdrawals;

      return {
        name: partner.name,
        sharePercent: `${partner.sharePercent}%`,
        capital: capital,
        withdrawals: withdrawals,
        profitShare: profitShare,
        balance: balance
      };
    });

    const csvHeaders = Object.values(headers).join(",") + "\n";
    const keys = Object.keys(headers);
    
    const csvRows = formattedData.map(item => {
      return keys.map(key => {
        const val = item[key as keyof typeof item] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
    }).join("\n");
    
    const csvBlob = new Blob(["\uFEFF" + csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `partners_ledger_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      await fetch("/api/finance/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(partnerForm),
      });
      setShowPartnerModal(false);
      fetchFinanceData();
    } finally { setIsSubmitting(false); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      await fetch("/api/finance/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(expenseForm),
      });
      setShowExpenseModal(false);
      fetchFinanceData();
    } finally { setIsSubmitting(false); }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      await fetch("/api/finance/partner-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...transactionForm, partnerId: selectedPartnerId }),
      });
      setShowTransactionModal(false);
      fetchFinanceData();
    } finally { setIsSubmitting(false); }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>جاري تحميل البيانات المالية...</p>
      </div>
    );
  }

  const calculatePartnerBalance = (partner: Partner) => {
    const capital = partner.transactions
      .filter((t) => t.type === "DEPOSIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = partner.transactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Profit share = (Net profit * sharePercent) / 100
    const profitShare = data ? ((data.stats.netProfit || 0) * partner.sharePercent) / 100 : 0;
    
    return capital + profitShare - withdrawals;
  };

  const totalExpenses = data?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div>
      <AdminPageHeader
        title="💰 الإدارة المالية"
        subtitle="متابعة الإيرادات والمصروفات وأرباح الشركاء"
        action={
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={handleExportPartners}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--radius-full)",
              background: "#16a34a",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "inherit"
            }}
          >
            📊 كشف الشركاء
          </button>
          <button
            className="btn-primary"
            onClick={fetchFinanceData}
            style={{ fontFamily: "inherit", fontSize: "0.9rem" }}
          >
            🔄 تحديث البيانات
          </button>
        </div>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        <div className="stat-card-glow sales" style={{ padding: "1.5rem" }}>
          <div style={{ color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>إجمالي المبيعات (الإيرادات)</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--primary)", fontFamily: "var(--font-sans)" }}>
            {data?.stats.totalRevenue.toLocaleString("ar-EG")} ج.م
          </div>
        </div>
        
        <div className="stat-card-glow" style={{ padding: "1.5rem", borderRight: "5px solid #64748b" }}>
          <div style={{ color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>تكلفة البضاعة المباعة (COGS)</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#475569", fontFamily: "var(--font-sans)" }}>
            {data?.stats.totalCost.toLocaleString("ar-EG")} ج.م
          </div>
        </div>

        <div className="stat-card-glow" style={{ padding: "1.5rem", borderRight: "5px solid #ef4444" }}>
          <div style={{ color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>المصروفات التشغيلية</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ef4444", fontFamily: "var(--font-sans)" }}>
            {data?.stats.totalExpenses.toLocaleString("ar-EG")} ج.م
          </div>
        </div>

        <div className="stat-card-glow revenue" style={{ padding: "1.5rem" }}>
          <div style={{ color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>صافي الأرباح التشغيلية</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--secondary)", fontFamily: "var(--font-sans)" }}>
            {data?.stats.netProfit.toLocaleString("ar-EG")} ج.م
          </div>
        </div>

        <div className="stat-card-glow orders" style={{ padding: "1.5rem" }}>
          <div style={{ color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>السيولة الكاش بالصندوق</div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#2563eb", fontFamily: "var(--font-sans)" }}>
            {data?.stats.liquidity.toLocaleString("ar-EG")} ج.م
          </div>
        </div>
      </div>

      {/* Partners Section (Full Width Table Ledger) */}
      <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>🤝 دفتر حسابات الشركاء ورأس المال</h2>
          <button className="btn-primary" onClick={() => setShowPartnerModal(true)} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "var(--radius-full)" }}>➕ شريك جديد</button>
        </div>

        <div className="glass-table-container">
          <div style={{ overflowX: "auto" }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>اسم الشريك</th>
                  <th>الحصة (%)</th>
                  <th>رأس المال المدفوع</th>
                  <th>الأرباح التشغيلية المستحقة</th>
                  <th>إجمالي المسحوبات</th>
                  <th>الرصيد الصافي المتاح</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data?.partners.map(partner => {
                  const capital = partner.transactions.filter(t => t.type === "DEPOSIT").reduce((s, t) => s + t.amount, 0);
                  const withdrawals = partner.transactions.filter(t => t.type === "WITHDRAWAL").reduce((s, t) => s + t.amount, 0);
                  const profitShare = data ? ((data.stats.netProfit || 0) * partner.sharePercent) / 100 : 0;
                  const balance = calculatePartnerBalance(partner);

                  return (
                    <tr key={partner.id}>
                      <td style={{ fontWeight: "700" }}>{partner.name}</td>
                      <td style={{ fontWeight: "800", color: "var(--primary)", fontFamily: "var(--font-sans)" }}>{partner.sharePercent}%</td>
                      <td style={{ fontWeight: "600", fontFamily: "var(--font-sans)" }}>{capital.toLocaleString("ar-EG")} ج.م</td>
                      <td style={{ fontWeight: "600", color: "#16a34a", fontFamily: "var(--font-sans)" }}>{profitShare.toLocaleString("ar-EG")} ج.م</td>
                      <td style={{ fontWeight: "600", color: "#dc2626", fontFamily: "var(--font-sans)" }}>{withdrawals.toLocaleString("ar-EG")} ج.م</td>
                      <td style={{ fontWeight: "800", color: balance >= 0 ? "var(--secondary)" : "#dc2626", fontFamily: "var(--font-sans)", fontSize: "1rem" }}>
                        {balance.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td>
                        <button 
                          onClick={() => { setSelectedPartnerId(partner.id); setShowTransactionModal(true); }} 
                          className="btn-primary" 
                          style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", borderRadius: "var(--radius-full)" }}
                        >
                          💸 تسجيل حركة
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Expenses List & Category Breakdown */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>💸 تحليل ومراقبة المصروفات</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleExportExpenses}
                style={{
                  padding: "0.4rem 0.8rem",
                  fontSize: "0.85rem",
                  borderRadius: "var(--radius-md)",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontFamily: "inherit"
                }}
              >
                📊 تصدير
              </button>
              <button className="btn-primary" onClick={() => setShowExpenseModal(true)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", borderRadius: "var(--radius-full)" }}>➕ مصروف جديد</button>
            </div>
          </div>

          {/* Expenses breakdown visual */}
          {data && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", background: "rgba(0,0,0,0.01)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "0.5rem" }}>📊 تحليل المصروفات التشغيلية حسب الفئة</h4>
              {[
                { key: "SALARY", label: "💵 رواتب وأجور الفريق", val: data.expensesBreakdown.SALARY, color: "#ef4444" },
                { key: "MARKETING", label: "📢 إعلانات وتسويق المتجر", val: data.expensesBreakdown.MARKETING, color: "#3b82f6" },
                { key: "PACKAGING", label: "📦 تغليف وشحن عبوات", val: data.expensesBreakdown.PACKAGING, color: "#f59e0b" },
                { key: "GENERAL", label: "⚙️ مصروفات عامة وتشغيلية", val: data.expensesBreakdown.GENERAL, color: "#64748b" }
              ].map(item => {
                const pct = totalExpenses > 0 ? (item.val / totalExpenses) * 100 : 0;
                return (
                  <div key={item.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: "600" }}>
                      <span>{item.label}</span>
                      <span style={{ fontFamily: "var(--font-sans)" }}>{item.val.toLocaleString("ar-EG")} ج.م ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--border-color)", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: item.color, borderRadius: "99px", transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="glass-table-container">
            <div style={{ overflowX: "auto" }}>
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>البيان</th>
                    <th>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.expenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        {new Date(exp.date).toLocaleDateString("ar-EG")}
                      </td>
                      <td style={{ fontWeight: "700" }}>{exp.title}</td>
                      <td style={{ fontWeight: "700", color: "#dc2626", fontFamily: "var(--font-sans)" }}>{exp.amount.toLocaleString("ar-EG")} ج.م</td>
                    </tr>
                  ))}
                  {(!data?.expenses || data.expenses.length === 0) && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        لا توجد مصروفات مسجلة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Log / History placeholder or extra details */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>📜 الحركات والعمليات الأخيرة</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>كشف كامل بالعمليات المالية وعمليات الإيداع والسحب المقيدة حديثاً بالدفاتر:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxHeight: "400px" }}>
            {data?.partners.flatMap(p => p.transactions.map(t => ({...t, partnerName: p.name}))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", background: "rgba(0,0,0,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                <div>
                  <strong style={{ fontSize: "0.9rem" }}>{t.partnerName}</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "0.5rem" }}>
                    {t.type === "DEPOSIT" ? "📥 إيداع رأس مال" : "📤 سحب أرباح"}
                  </span>
                </div>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontWeight: "700", color: t.type === "DEPOSIT" ? "var(--secondary)" : "#dc2626", fontFamily: "var(--font-sans)" }}>
                    {t.type === "DEPOSIT" ? "+" : "-"}{t.amount.toLocaleString("ar-EG")} ج.م
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {new Date(t.date).toLocaleDateString("ar-EG")}
                  </div>
                </div>
              </div>
            ))}
            {(!data?.partners.some(p => p.transactions.length > 0)) && (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                لا توجد حركات مالية مسجلة للشركاء بعد.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ padding: "2.5rem", width: "420px", borderRadius: "var(--radius-lg)", background: "var(--bg-card)", position: "relative", animation: "fadeIn 0.3s ease" }}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.3rem", fontWeight: "700" }}>👥 إضافة شريك جديد</h3>
            <form onSubmit={handleAddPartner} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="text" placeholder="اسم الشريك الكامل" className="form-input" required value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
              <input type="number" placeholder="حصة الشريك القانونية (%)" className="form-input" required min="0" max="100" value={partnerForm.sharePercent} onChange={e => setPartnerForm({...partnerForm, sharePercent: e.target.value})} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 2 }}>حفظ البيانات</button>
                <button type="button" onClick={() => setShowPartnerModal(false)} style={{ padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", flex: 1, cursor: "pointer", background: "none" }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ padding: "2.5rem", width: "420px", borderRadius: "var(--radius-lg)", background: "var(--bg-card)", position: "relative", animation: "fadeIn 0.3s ease" }}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.3rem", fontWeight: "700" }}>💸 إضافة مصروف تشغيلي جديد</h3>
            <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="text" placeholder="البيان (مثال: فاتورة كهرباء، إعلان فيسبوك...)" className="form-input" required value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
              <input type="number" placeholder="المبلغ المطلق (ج.م)" className="form-input" required min="0" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
              <select className="form-input" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", width: "100%", background: "var(--bg-card)" }}>
                <option value="GENERAL">عمومية وتشغيلية ⚙️</option>
                <option value="MARKETING">تسويق وإعلانات 📢</option>
                <option value="SALARY">رواتب وأجور الفريق 💵</option>
                <option value="PACKAGING">تغليف وشحن العلب 📦</option>
              </select>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 2 }}>تأكيد المصروف</button>
                <button type="button" onClick={() => setShowExpenseModal(false)} style={{ padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", flex: 1, cursor: "pointer", background: "none" }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ padding: "2.5rem", width: "420px", borderRadius: "var(--radius-lg)", background: "var(--bg-card)", position: "relative", animation: "fadeIn 0.3s ease" }}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.3rem", fontWeight: "700" }}>📥 تسجيل حركة خزينة للشريك</h3>
            <form onSubmit={handleAddTransaction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <select className="form-input" value={transactionForm.type} onChange={e => setTransactionForm({...transactionForm, type: e.target.value})} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", width: "100%", background: "var(--bg-card)" }}>
                <option value="DEPOSIT">📥 إيداع رأس مال جديد</option>
                <option value="WITHDRAWAL">📤 سحب من الأرباح / رأس المال</option>
              </select>
              <input type="number" placeholder="المبلغ المقيد (ج.م)" className="form-input" required min="0" value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
              <input type="text" placeholder="البيان التوضيحي للحركة" className="form-input" value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }} />
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 2 }}>تقييد الحركة</button>
                <button type="button" onClick={() => setShowTransactionModal(false)} style={{ padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", flex: 1, cursor: "pointer", background: "none" }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

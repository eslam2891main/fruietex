"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/storefront/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطأ في تسجيل الدخول");
      }

      localStorage.setItem("customer_token", data.token);
      localStorage.setItem("customer_user", JSON.stringify(data.customer));
      
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div className="glass-panel" style={{ maxWidth: "440px", width: "100%", padding: "2.5rem 2rem", borderRadius: "var(--radius-lg)" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: "800", marginBottom: "0.5rem", textAlign: "center", color: "var(--primary)" }}>تسجيل الدخول لحسابك 👤</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "2rem" }}>مرحباً بك مجدداً في متجر طبيعة الصحي</p>
        
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", fontSize: "0.85rem", fontWeight: "600", textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>📞 رقم الهاتف</label>
            <input 
              type="tel" 
              required 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="01xxxxxxxxx" 
              style={{ padding: "0.75rem 1rem", width: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "inherit", fontSize: "0.95rem", fontFamily: "var(--font-numbers)", transition: "var(--transition)" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>🔑 كلمة المرور</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              style={{ padding: "0.75rem 1rem", width: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "inherit", fontSize: "0.95rem", transition: "var(--transition)" }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading} 
            style={{ padding: "0.8rem", fontSize: "1rem", marginTop: "0.5rem", borderRadius: "var(--radius-full)", fontWeight: "700" }}
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول بالرقم ✓"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "600" }}>
          ليس لديك حساب؟ <Link href="/register" style={{ color: "var(--primary)", fontWeight: "700" }}>سجل حساب جديد الآن</Link>
        </div>
      </div>
    </div>
  );
}

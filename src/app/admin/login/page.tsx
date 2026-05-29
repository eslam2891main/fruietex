"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../admin.css";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "بيانات الدخول غير صحيحة");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      router.push("/admin");
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-wrap">
      <div className="glass-panel admin-login-card animate-fade-in">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>🍇</div>
          <h1 className="admin-page-title" style={{ fontSize: "1.5rem" }}>
            لوحة التحكم
          </h1>
          <p className="admin-page-subtitle">سجّل دخولك لإدارة منصة طبيعة</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label className="admin-page-subtitle" style={{ display: "block", marginBottom: "0.4rem" }}>
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="admin"
              style={{
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-color)",
                background: "var(--bg-color)",
              }}
            />
          </div>
          <div>
            <label className="admin-page-subtitle" style={{ display: "block", marginBottom: "0.4rem" }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••"
              style={{
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-color)",
                background: "var(--bg-color)",
              }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: "0.85rem", marginTop: "0.5rem" }}>
            {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

        <p
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            padding: "0.75rem",
            background: "hsla(var(--primary-hue), 95%, 45%, 0.06)",
            borderRadius: "var(--radius-md)",
          }}
        >
          للتجربة: <strong>admin</strong> / <strong>admin123</strong>
        </p>

        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/" className="admin-topbar-link">
            العودة للمتجر
          </Link>
        </p>
      </div>
    </div>
  );
}

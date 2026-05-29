export const EMOJI_MAP: Record<string, string> = {
  مانجو: "🥭",
  فراولة: "🍓",
  توت: "🫐",
  تين: "🌰",
  مشمش: "🍑",
  تمر: "🌴",
  زبيب: "🍇",
  أناناس: "🍍",
  جوز: "🥜",
  لوز: "🌰",
  كاجو: "🥜",
  فستق: "🥜",
};

export const CATEGORIES = ["الكل", "فواكه مجففة", "مكسرات", "تمور", "أخرى"] as const;

export const CARD_COLORS = [
  "#fef3c7",
  "#fee2e2",
  "#e0e7ff",
  "#d1fae5",
  "#fce7f3",
  "#f3e8ff",
];

export function getEmoji(name: string): string {
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (name.includes(key)) return emoji;
  }
  return "🍎";
}

export function getProductCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("تمر") || n.includes("بلح")) return "تمور";
  if (
    n.includes("كاجو") ||
    n.includes("فستق") ||
    n.includes("لوز") ||
    n.includes("جوز") ||
    n.includes("بندق") ||
    n.includes("مكسرات")
  )
    return "مكسرات";
  if (
    n.includes("تين") ||
    n.includes("مشمش") ||
    n.includes("قراصيا") ||
    n.includes("زبيب") ||
    n.includes("مانجو") ||
    n.includes("فراولة") ||
    n.includes("توت") ||
    n.includes("أناناس") ||
    n.includes("مجفف")
  )
    return "فواكه مجففة";
  return "أخرى";
}

export const ORDER_STATUS_AR: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "قيد الانتظار", bg: "#fef3c7", color: "#d97706" },
  PROCESSING: { label: "قيد التجهيز", bg: "#dbeafe", color: "#2563eb" },
  SHIPPED: { label: "تم الشحن", bg: "#e0e7ff", color: "#4f46e5" },
  COMPLETED: { label: "مكتمل", bg: "#dcfce7", color: "#16a34a" },
  CANCELLED: { label: "ملغي", bg: "#fee2e2", color: "#dc2626" },
};

export const PAYMENT_LABELS: Record<string, string> = {
  INSTAPAY: "إنستاباي",
  VODAFONE_CASH: "فودافون كاش",
  PAYMOB: "بيموب",
  CASH: "الدفع عند الاستلام",
};

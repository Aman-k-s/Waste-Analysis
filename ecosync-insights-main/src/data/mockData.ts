export const DEVICES = ["D1 - Kitchen Main", "D2 - Kitchen Prep", "D3 - Buffet Line", "D4 - Cold Storage", "D5 - Dining Hall"];
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"];
export const CATEGORIES = ["Rice", "Bread", "Vegetables", "Fruits", "Dairy", "Meat", "Beverages"];
export const WEEKS = [
  { label: "Mar 3 – Mar 9", value: "w1" },
  { label: "Mar 10 – Mar 16", value: "w2" },
  { label: "Mar 17 – Mar 23", value: "w3" },
  { label: "Mar 24 – Mar 30", value: "w4" },
  { label: "Mar 31 – Apr 6", value: "w5" },
];

export const KPI_DATA = {
  totalWaste: 1247.5,
  totalScans: 3842,
  totalDevices: 5,
  abnormalDays: 8,
  costLoss: 18720,
  co2Impact: 3118.75,
};

export const WASTE_BY_CATEGORY = [
  { name: "Rice", value: 382 },
  { name: "Bread", value: 198 },
  { name: "Vegetables", value: 245 },
  { name: "Fruits", value: 167 },
  { name: "Dairy", value: 112 },
  { name: "Meat", value: 89 },
  { name: "Beverages", value: 54 },
];

export const REASON_BREAKDOWN: Record<string, { reason: string; pct: number }[]> = {
  Rice: [
    { reason: "Overproduction", pct: 42 },
    { reason: "Plate waste", pct: 28 },
    { reason: "Spoilage", pct: 15 },
    { reason: "Quality issue", pct: 10 },
    { reason: "Other", pct: 5 },
  ],
  Bread: [
    { reason: "Overproduction", pct: 38 },
    { reason: "Expired", pct: 30 },
    { reason: "Plate waste", pct: 18 },
    { reason: "Quality issue", pct: 9 },
    { reason: "Other", pct: 5 },
  ],
  Vegetables: [
    { reason: "Spoilage", pct: 35 },
    { reason: "Overproduction", pct: 28 },
    { reason: "Plate waste", pct: 22 },
    { reason: "Trimming", pct: 10 },
    { reason: "Other", pct: 5 },
  ],
  Fruits: [
    { reason: "Spoilage", pct: 45 },
    { reason: "Overripe", pct: 25 },
    { reason: "Plate waste", pct: 15 },
    { reason: "Damaged", pct: 10 },
    { reason: "Other", pct: 5 },
  ],
  Dairy: [
    { reason: "Expired", pct: 40 },
    { reason: "Overproduction", pct: 25 },
    { reason: "Temperature issue", pct: 20 },
    { reason: "Plate waste", pct: 10 },
    { reason: "Other", pct: 5 },
  ],
  Meat: [
    { reason: "Overproduction", pct: 35 },
    { reason: "Temperature issue", pct: 25 },
    { reason: "Plate waste", pct: 20 },
    { reason: "Quality issue", pct: 15 },
    { reason: "Other", pct: 5 },
  ],
  Beverages: [
    { reason: "Overproduction", pct: 50 },
    { reason: "Expired", pct: 25 },
    { reason: "Spillage", pct: 15 },
    { reason: "Other", pct: 10 },
  ],
};

export const WASTE_BY_MEAL = [
  { name: "Breakfast", value: 280, fill: "hsl(155, 43%, 21%)" },
  { name: "Lunch", value: 485, fill: "hsl(38, 92%, 50%)" },
  { name: "Dinner", value: 365, fill: "hsl(200, 70%, 50%)" },
  { name: "Snacks", value: 117, fill: "hsl(270, 60%, 55%)" },
];

export const TOP_DEVICES = [
  { name: "D3 - Buffet Line", value: 398 },
  { name: "D1 - Kitchen Main", value: 312 },
  { name: "D5 - Dining Hall", value: 245 },
  { name: "D2 - Kitchen Prep", value: 178 },
  { name: "D4 - Cold Storage", value: 114 },
];

export const WASTE_TREND = [
  { date: "Mar 3", value: 38, spike: false },
  { date: "Mar 4", value: 42, spike: false },
  { date: "Mar 5", value: 35, spike: false },
  { date: "Mar 6", value: 55, spike: false },
  { date: "Mar 7", value: 48, spike: false },
  { date: "Mar 8", value: 30, spike: false },
  { date: "Mar 9", value: 25, spike: false },
  { date: "Mar 10", value: 41, spike: false },
  { date: "Mar 11", value: 44, spike: false },
  { date: "Mar 12", value: 72, spike: true },
  { date: "Mar 13", value: 50, spike: false },
  { date: "Mar 14", value: 46, spike: false },
  { date: "Mar 15", value: 28, spike: false },
  { date: "Mar 16", value: 32, spike: false },
  { date: "Mar 17", value: 39, spike: false },
  { date: "Mar 18", value: 45, spike: false },
  { date: "Mar 19", value: 82, spike: true },
  { date: "Mar 20", value: 58, spike: false },
  { date: "Mar 21", value: 51, spike: false },
  { date: "Mar 22", value: 34, spike: false },
  { date: "Mar 23", value: 29, spike: false },
  { date: "Mar 24", value: 43, spike: false },
  { date: "Mar 25", value: 47, spike: false },
  { date: "Mar 26", value: 68, spike: true },
  { date: "Mar 27", value: 52, spike: false },
  { date: "Mar 28", value: 49, spike: false },
  { date: "Mar 29", value: 31, spike: false },
  { date: "Mar 30", value: 36, spike: false },
];

export const WEEKLY_WASTE = [
  { week: "Mar 3 – Mar 9", value: 273 },
  { week: "Mar 10 – Mar 16", value: 313 },
  { week: "Mar 17 – Mar 23", value: 338 },
  { week: "Mar 24 – Mar 30", value: 326 },
];

export const WEEKDAY_WASTE = [
  { day: "Mon", value: 198 },
  { day: "Tue", value: 212 },
  { day: "Wed", value: 185 },
  { day: "Thu", value: 225 },
  { day: "Fri", value: 195 },
  { day: "Sat", value: 128 },
  { day: "Sun", value: 104 },
];

export const THRESHOLD_ALERTS = [
  { item: "Rice", value: 82, change: 34, direction: "up" as const },
  { item: "Buffet Line D3", value: 68, change: 22, direction: "up" as const },
  { item: "Lunch Service", value: 75, change: 18, direction: "up" as const },
  { item: "Vegetables", value: 45, change: -12, direction: "down" as const },
];

export const HIGH_WASTE_DAYS = [
  { date: "Mar 19", value: 82 },
  { date: "Mar 12", value: 72 },
  { date: "Mar 26", value: 68 },
  { date: "Mar 6", value: 55 },
  { date: "Mar 20", value: 58 },
];

export const PATTERN_ALERTS = [
  { icon: "🍚", text: "Rice has been wasted for 5 consecutive days (Mar 15–19), averaging 48 kg/day — 34% above normal." },
  { icon: "🍎", text: "Fruits has been wasted for 10 consecutive days (Mar 10–19), primarily due to spoilage in cold storage." },
  { icon: "🍞", text: "Bread waste peaks every Monday, likely due to weekend overproduction carry-over." },
  { icon: "📍", text: "Device D3 (Buffet Line) consistently exceeds threshold during lunch service (11am–2pm)." },
];

export const KEY_INSIGHTS = [
  "Rice accounts for 31% of total waste — the single largest contributor.",
  "Lunch service generates 39% of all food waste, 2x more than breakfast.",
  "Device D3 (Buffet Line) is responsible for 32% of waste across all devices.",
  "8 abnormal days detected in March, concentrated around mid-month.",
  "Weekend waste is 42% lower than weekday average, indicating production scaling issues.",
];

export const RECOMMENDED_ACTIONS = [
  "Reduce rice production by 20% during weekday lunch service — potential savings of ₹3,800/week.",
  "Implement real-time alerts on Device D3 when waste exceeds 50 kg/day.",
  "Shift fruit procurement to twice-weekly with smaller batches to reduce spoilage.",
  "Review Monday bread production — align with actual Sunday evening consumption data.",
  "Set up automated threshold monitoring for all categories above 40 kg/day.",
];

export const COST_IMPACT = {
  costLoss: 18720,
  co2Impact: 3118.75,
  mealsSaved: 2495,
  petrolSaved: 156,
};

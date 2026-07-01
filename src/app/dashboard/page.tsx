import { redirect } from "next/navigation";

// Дашборд переехал в раздел «Здоровье» первой вкладкой.
export default function DashboardPage() {
  redirect("/health");
}

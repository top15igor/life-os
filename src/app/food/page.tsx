import { redirect } from "next/navigation";

export default function FoodRedirect() {
  redirect("/health?tab=food");
}

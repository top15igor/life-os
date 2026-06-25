import { redirect } from "next/navigation";

export default function InsightsRedirect() {
  redirect("/goals?tab=ideas");
}

import { redirect } from "next/navigation";

export default function EnergyRedirect() {
  redirect("/health?tab=energy");
}

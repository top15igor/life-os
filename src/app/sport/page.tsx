import { redirect } from "next/navigation";

export default function SportRedirect() {
  redirect("/health?tab=sport");
}

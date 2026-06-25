import { redirect } from "next/navigation";

export default function TasksRedirect() {
  redirect("/goals?tab=tasks");
}

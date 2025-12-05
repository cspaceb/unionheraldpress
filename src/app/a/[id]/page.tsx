import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function PremadeRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check if middleware flagged this as a bot
  const h = await headers();
  const isBot = h.get("x-uhp-bot") === "1";

  // If it's a bot, DO NOT redirect — metadata.ts must run
  if (isBot) return <></>;

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return redirect("/404");

  switch (data.premade) {
    case "monkey":
      return redirect("/monkey");
    case "sodumb":
      return redirect("/sodumb");
    case "crying-jordan":
      return redirect("/crying-jordan");
    default:
      return redirect("/404");
  }
}

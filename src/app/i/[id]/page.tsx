import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function CustomRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Detect bot from middleware header
  const h = await headers();
  const isBot = h.get("x-uhp-bot") === "1";

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  // If it's a bot, DO NOT redirect or render
  // Let metadata.ts generate OG preview
  if (isBot) return <></>;

  // If missing row or custom image, show 404 for real users
  if (!data || !data.custom_image_url) {
    return redirect("/404");
  }

  // Human visitors see the custom image page
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <img
        src={data.custom_image_url}
        className="max-w-full max-h-[80vh] object-contain rounded-xl"
      />
    </div>
  );
}

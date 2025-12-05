export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase-server";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const { id } = params;

  const supabase = createServerSupabase();

  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    return {
      title: "Union Herald Press **",
      description: "Parody news generator.",
    };
  }

  return {
    title: data.headline,
    description: "Union Herald Press – Fake news generator",
    openGraph: {
      title: data.headline,
      description: "Union Herald Press – Fake news generator",
      url: `https://unionheraldpress.com/a/${id}`,
      images: [
        {
          url: `https://unionheraldpress.com/a/${id}/opengraph-image`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.headline,
      description: "Union Herald Press – Fake news generator",
      images: [`https://unionheraldpress.com/a/${id}/opengraph-image`],
    },
  };
}

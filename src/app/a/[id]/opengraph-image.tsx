import { ImageResponse } from "next/og";
import { createServerSupabase } from "@/lib/supabase-server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  const image = data?.og_image_url;

  if (!image) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "black",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 48,
          fontWeight: "bold",
        }}
      >
        unionheraldpress.com
      </div>,
      size
    );
  }

  return new ImageResponse(
    <img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />,
    size
  );
}

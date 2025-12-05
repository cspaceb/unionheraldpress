import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const uploadToR2 = async (file: File, path: string) => {
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: path,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return `${process.env.PUBLIC_R2_URL}/${path}`;
};

export async function POST(req: Request) {
  const form = await req.formData();

  const headline = form.get("headline") as string;
  const mode = form.get("mode") as string;
  const premade = form.get("premade") as string | null;

  const ogFile = form.get("ogImage") as File;
  const customFile = form.get("customImage") as File | null;

  const id = nanoid(8);

  // Upload OG preview image
  const og_url = await uploadToR2(ogFile, `og/${id}.png`);

  let custom_url = null;
  if (mode === "custom" && customFile) {
    custom_url = await uploadToR2(customFile, `custom/${id}.png`);
  }

  await supabase.from("articles").insert({
    id,
    headline,
    mode,
    premade,
    og_image_url: og_url,
    custom_image_url: custom_url,
  });

  const link =
    mode === "premade"
      ? `${process.env.PUBLIC_SITE_URL}/a/${id}`
      : `${process.env.PUBLIC_SITE_URL}/i/${id}`;

  return NextResponse.json({ id, url: link });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const isBot = /facebook|twitter|discord|telegram|whatsapp|bot|crawler|spider|preview|iMessage/i.test(ua);

  const res = NextResponse.next();

  // Tag bot requests so page.tsx can detect them
  if (isBot) {
    res.headers.set("x-uhp-bot", "1");
  }

  return res;
}

export const config = {
  matcher: ["/a/:path*", "/i/:path*"],
};

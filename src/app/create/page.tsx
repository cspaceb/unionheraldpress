"use client";

import { useState, ChangeEvent } from "react";

type JokeMode = "premade" | "custom";

export default function CreateArticlePage() {
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [jokeMode, setJokeMode] = useState<JokeMode>("premade");

  const [premadePage, setPremadePage] = useState("monkey");
  const [customRedirectImage, setCustomRedirectImage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Upload handlers
  const handleOgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setOgImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCustomImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomRedirectImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async () => {
    setIsSubmitting(true);

    const form = new FormData();
    form.append("headline", headline);
    form.append("mode", jokeMode);
    form.append("premade", jokeMode === "premade" ? premadePage : "");

    const ogInput = document.getElementById("og-upload") as HTMLInputElement;
    if (!ogInput?.files?.[0]) {
      alert("Please upload an OG image.");
      setIsSubmitting(false);
      return;
    }
    form.append("ogImage", ogInput.files[0]);

    if (jokeMode === "custom") {
      const cInput = document.getElementById("custom-upload") as HTMLInputElement;
      if (cInput?.files?.[0]) {
        form.append("customImage", cInput.files[0]);
      }
    }

    const res = await fetch("/api/create", {
      method: "POST",
      body: form
    });

    const data = await res.json();
    setResultUrl(data.url);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-10">

        <h1 className="text-4xl font-semibold text-center">Create Fake Article</h1>

        {/* OG Image */}
        <div className="space-y-2">
          <label className="text-lg font-medium">Preview Image (OG Image)</label>
          <div className="border border-neutral-700 rounded-xl p-4 bg-neutral-900">
            <input
              id="og-upload"
              type="file"
              accept="image/*"
              onChange={handleOgUpload}
              className="block text-sm"
            />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <label className="text-lg font-medium">Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Enter a hilarious headline..."
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white"
          />
        </div>

        {/* Joke Mode */}
        <div className="space-y-4">
          <label className="text-lg font-medium">Joke Page</label>

          <label className="flex gap-3">
            <input
              type="radio"
              checked={jokeMode === "premade"}
              onChange={() => setJokeMode("premade")}
            />
            <span>Use a Pre-Made Page</span>
          </label>

          {jokeMode === "premade" && (
            <select
              value={premadePage}
              onChange={(e) => setPremadePage(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl"
            >
              <option value="monkey">Monkey</option>
              <option value="sodumb">So Dumb</option>
              <option value="crying-jordan">Crying Jordan</option>
            </select>
          )}

          <label className="flex gap-3">
            <input
              type="radio"
              checked={jokeMode === "custom"}
              onChange={() => setJokeMode("custom")}
            />
            <span>Use a Custom Redirect Image</span>
          </label>

          {jokeMode === "custom" && (
            <div className="border border-neutral-700 p-4 rounded-xl bg-neutral-900">
              <input
                id="custom-upload"
                type="file"
                accept="image/*"
                onChange={handleCustomImageUpload}
                className="block text-sm"
              />
            </div>
          )}
        </div>

        {/* iMessage Preview */}
        {/* ——— (Exact code you already approved) ——— */}
        <div className="mt-14">
          <h2 className="text-2xl font-medium mb-4 text-center">iMessage Preview</h2>

          <div className="max-w-sm mx-auto bg-black border border-neutral-800 rounded-3xl p-6 text-white space-y-4">

            <div className="text-center">
              <p className="text-sm text-neutral-400">iMessage</p>
              <p className="text-xs text-neutral-500 mt-1">Today 9:35 PM</p>
            </div>

            <div className="flex justify-end">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[80%] text-sm shadow-lg">
                Hey, you won’t believe this!
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[80%] mt-1">

                <div className="bg-white rounded-xl overflow-hidden text-black shadow-lg">
                  <div className="w-full h-40 bg-neutral-200 flex items-center justify-center">
                    {ogImage ? (
                      <img src={ogImage} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-neutral-500 text-sm">No image selected</span>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="font-semibold text-sm leading-tight">
                      {headline || "Your headline will appear here"}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">
                      unionheraldpress.com
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex justify-end">
              <p className="text-neutral-500 text-xs">Read 9:36 PM</p>
            </div>

          </div>
        </div>

        {/* Generate Link */}
        <div className="pt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 text-lg bg-white text-black rounded-xl font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Generating..." : "Generate Link"}
          </button>
        </div>

        {/* SUCCESS CARD */}
        {resultUrl && (
          <div className="mt-10 max-w-xl mx-auto bg-neutral-900 border border-neutral-700 rounded-2xl p-6 text-center space-y-6">

            <h3 className="text-xl font-semibold text-white">Your Article Is Ready!</h3>

            <div className="bg-black border border-neutral-800 rounded-xl px-4 py-3 break-all text-neutral-300">
              {resultUrl}
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(resultUrl)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium"
            >
              Copy Link
            </button>

            <div className="flex items-center justify-center gap-4">

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resultUrl)}`}
                target="_blank"
                className="px-4 py-2 bg-[#1877F2] text-white rounded-lg text-sm"
              >
                Facebook
              </a>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(resultUrl)}&text=${encodeURIComponent(headline)}`}
                target="_blank"
                className="px-4 py-2 bg-black border border-neutral-700 text-white rounded-lg text-sm"
              >
                X
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

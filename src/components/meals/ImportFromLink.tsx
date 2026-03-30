"use client";

import { useState } from "react";
import { Link as LinkIcon, Loader2, AlertTriangle, Check } from "lucide-react";

interface ImportFromLinkProps {
  onImport: (data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    sourceUrl: string;
  }) => void;
  onSkip: () => void;
}

export function ImportFromLink({ onImport, onSkip }: ImportFromLinkProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        // Still pass through the URL even on parse failure
        onImport({ sourceUrl: url.trim() });
        return;
      }

      onImport({
        title: data.title || undefined,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
        sourceUrl: url.trim(),
      });
    } catch {
      setError("Could not connect. You can still add the meal manually.");
      onImport({ sourceUrl: url.trim() });
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (s: string) => {
    try {
      new URL(s);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-stone-500" />
        <h3 className="text-sm font-semibold text-stone-700">
          Import from Link
        </h3>
      </div>

      <p className="text-xs text-stone-500">
        Paste an Instagram, TikTok, or recipe link. We&apos;ll try to extract what we
        can — you can fill in the rest.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.instagram.com/p/..."
          className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          onClick={handleImport}
          disabled={loading || !isValidUrl(url)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors tap-highlight-none flex items-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Import
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      <button
        onClick={onSkip}
        className="text-xs text-stone-400 hover:text-stone-600"
      >
        Skip — add manually instead
      </button>
    </div>
  );
}

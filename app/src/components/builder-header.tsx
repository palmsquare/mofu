"use client";

import Link from "next/link";
import { useState } from "react";

interface BuilderHeaderProps {
  onPublish: () => void;
  isPublishing: boolean;
}

export function BuilderHeader({ onPublish, isPublishing }: BuilderHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
          LM
        </div>
        <div>
          <p className="text-lg font-semibold text-zinc-900">LeadMagnet Studio</p>
          <p className="text-xs text-zinc-500">Personnalise ta page de capture</p>
        </div>
      </Link>
      <button
        onClick={onPublish}
        disabled={isPublishing}
        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPublishing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Publication...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Publier
          </>
        )}
      </button>
    </header>
  );
}


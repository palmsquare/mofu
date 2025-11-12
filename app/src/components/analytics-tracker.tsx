"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsTracker({ leadMagnetSlug }: { leadMagnetSlug: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track on capture pages
    if (!pathname.startsWith("/c/") || !leadMagnetSlug) {
      return;
    }

    // Track page view
    const trackView = async () => {
      try {
        // Get UTM parameters from URL
        const utm_source = searchParams.get("utm_source");
        const utm_medium = searchParams.get("utm_medium");
        const utm_campaign = searchParams.get("utm_campaign");

        await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: "view",
            leadMagnetSlug,
            metadata: {
              utm_source,
              utm_medium,
              utm_campaign,
              path: pathname,
            },
          }),
        });
      } catch (error) {
        console.error("Failed to track view:", error);
        // Silent fail - don't break the page
      }
    };

    // Small delay to ensure page is loaded
    const timeoutId = setTimeout(trackView, 500);

    return () => clearTimeout(timeoutId);
  }, [pathname, leadMagnetSlug, searchParams]);

  return null;
}


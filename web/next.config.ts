import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next's own default (1MB) is well under MAX_PHOTO_BYTES (10MB) in
      // lib/storage/attachments.ts - symptom-photo uploads go through a
      // Server Action, so without raising this every photo over 1MB
      // would 500 before ever reaching that check. A bit of headroom
      // above 10MB covers multipart/form-data's own boundary overhead.
      bodySizeLimit: "20mb",
    },
    // A second, separate limit from serverActions.bodySizeLimit above -
    // proxy.ts (renamed from middleware.ts in this Next.js version) runs
    // on every request, including symptom-photo uploads, and has its own
    // independent body-reading cap that otherwise truncates the request
    // at its 10MB default before the Server Action ever sees it (surfaces
    // as a confusing "Unexpected end of form" parser error, not a clean
    // size-limit error). Needs to match serverActions.bodySizeLimit.
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;

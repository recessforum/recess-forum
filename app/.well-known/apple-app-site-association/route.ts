import { NextResponse } from "next/server";

// Served at /.well-known/apple-app-site-association (no file extension — that's
// required by Apple, not a typo). Lets iOS treat /auth/callback links as
// Universal Links that open in the app instead of Safari, so OAuth sign-in
// (Google/Apple) started inside the app can hand the session back to the
// app's own webview instead of stranding the user logged into Safari.
//
// TEAM_ID must be replaced with the real 10-character Apple Developer Team
// ID before this does anything — Apple's CDN won't associate the domain
// with the app until it does.
const TEAM_ID = "TEAM_ID";
const APP_ID = `${TEAM_ID}.com.recessforum.app`;

export async function GET() {
  return NextResponse.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: APP_ID,
          paths: ["/auth/callback"],
        },
      ],
    },
  });
}

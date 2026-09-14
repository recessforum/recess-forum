import { NextResponse } from "next/server";

// Served at /.well-known/apple-app-site-association (no file extension — that's
// required by Apple, not a typo). Lets iOS treat /auth/callback links as
// Universal Links that open in the app instead of Safari, so OAuth sign-in
// (Google/Apple) started inside the app can hand the session back to the
// app's own webview instead of stranding the user logged into Safari.
//
const TEAM_ID = "623K9BU5H6";
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

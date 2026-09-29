import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Prints a tool document. On the web this is just window.print(). Inside the
 * iOS/Android app the webview ignores window.print(), so the document opens
 * in the in-app browser (Safari View Controller / Chrome Custom Tab), where
 * /print/[slug] shows it and opens the print dialog. The data travels in the
 * URL fragment, which never reaches the server.
 */
export async function printDocument(slug: string, data: unknown) {
  if (!Capacitor.isNativePlatform()) {
    window.print();
    return;
  }
  const url = `${window.location.origin}/print/${slug}#${encodeURIComponent(JSON.stringify(data))}`;
  if (Capacitor.isPluginAvailable("Browser")) {
    await Browser.open({ url });
  } else {
    // Very old app builds without the Browser plugin: hand off to the system browser.
    window.open(url, "_blank");
  }
}

import { describe, expect, it } from "vitest";
import { qrDownload } from "./qr-download";

describe("qrDownload", () => {
  it("creates a named SVG download for a newly registered Household", () => {
    expect(qrDownload("<svg>Dompet Gizi</svg>", "HH-1234")).toEqual({
      filename: "dompet-gizi-HH-1234.svg",
      href: "data:image/svg+xml;charset=utf-8,%3Csvg%3EDompet%20Gizi%3C%2Fsvg%3E",
    });
  });
});

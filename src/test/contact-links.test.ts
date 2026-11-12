import { describe, expect, it } from "vitest";

import { getTelephoneUrl, getWhatsAppUrl } from "@/lib/contact-links";

describe("portfolio contact links", () => {
  it("formats the supplied Nigerian WhatsApp number as an international wa.me link", () => {
    expect(getWhatsAppUrl("09099494789")).toBe("https://wa.me/2349099494789");
  });

  it("formats the supplied Nigerian phone number for international dialing", () => {
    expect(getTelephoneUrl("08145240136")).toBe("tel:+2348145240136");
  });
});
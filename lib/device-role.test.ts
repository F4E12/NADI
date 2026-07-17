import { describe, expect, it } from "vitest";
import {
  isLaptopAddress,
  isValidMac,
  macForIp,
  normalizeMac,
  roleForIp,
} from "./device-role";

describe("normalizeMac", () => {
  it("pads single-digit octets the way macOS arp strips them", () => {
    expect(normalizeMac("92:9a:f:f:eb:61")).toBe("92:9a:0f:0f:eb:61");
  });

  it("lowercases", () => {
    expect(normalizeMac("2A:C1:36:89:C0:44")).toBe("2a:c1:36:89:c0:44");
  });

  it("accepts the hyphenated format shown by some phones", () => {
    expect(normalizeMac("2A-C1-36-89-C0-44")).toBe("2a:c1:36:89:c0:44");
  });
});

describe("isValidMac", () => {
  it("accepts complete colon- and hyphen-separated addresses", () => {
    expect(isValidMac("2A:C1:36:89:C0:44")).toBe(true);
    expect(isValidMac("2A-C1-36-89-C0-44")).toBe(true);
  });

  it("rejects incomplete and non-hex addresses", () => {
    expect(isValidMac("2a:c1:36:89:c0")).toBe(false);
    expect(isValidMac("not-a-device")).toBe(false);
  });
});

describe("isLaptopAddress", () => {
  it("treats loopback in all spellings as the laptop", () => {
    expect(isLaptopAddress("127.0.0.1")).toBe(true);
    expect(isLaptopAddress("::1")).toBe(true);
    expect(isLaptopAddress("::ffff:127.0.0.1")).toBe(true);
  });

  it("rejects a random LAN address", () => {
    expect(isLaptopAddress("192.0.2.55")).toBe(false);
  });
});

describe("macForIp", () => {
  it("returns null for an IP absent from the ARP table", async () => {
    expect(await macForIp("192.0.2.1")).toBeNull();
  });
});

describe("roleForIp", () => {
  it("fails closed on a missing IP", async () => {
    expect(await roleForIp("")).toBe("RESIDENT");
  });

  it("treats the laptop as Volunteer with no registration", async () => {
    expect(await roleForIp("127.0.0.1")).toBe("VOLUNTEER");
  });

  it("treats an ARP-unresolvable device as Resident", async () => {
    expect(await roleForIp("192.0.2.77")).toBe("RESIDENT");
  });
});

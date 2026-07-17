import { describe, expect, it } from "vitest";
import { registrationHealthStatus } from "./registration-policy";

describe("registrationHealthStatus", () => {
  it("does not let a Resident confirm an illness state", () => {
    expect(registrationHealthStatus("SICK", "RESIDENT")).toBe("WELL");
    expect(registrationHealthStatus("RECOVERING", "RESIDENT")).toBe("WELL");
  });

  it("keeps Volunteer-confirmed health status", () => {
    expect(registrationHealthStatus("SICK", "VOLUNTEER")).toBe("SICK");
  });
});

import { describe, expect, it } from "vitest";
import { isResidentRouteAllowed } from "./resident-access";

describe("Resident route access", () => {
  it("allows the household registration journey", () => {
    expect(isResidentRouteAllowed("/register")).toBe(true);
    expect(isResidentRouteAllowed("/register/new")).toBe(true);
  });

  it("keeps Volunteer operations protected", () => {
    expect(isResidentRouteAllowed("/inventory")).toBe(false);
  });
});

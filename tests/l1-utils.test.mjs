import { describe, it, expect } from "vitest";
import { parseCSV } from "../handlers/costing/house/l1-utils.js";

describe("l1-utils", () => {
  describe("parseCSV", () => {
    it("should parse the CSV template and return constituent data", () => {
      const result = parseCSV();

      // Basic structure checks
      expect(result).toHaveProperty("constituentList");
      expect(result).toHaveProperty("constituents");
      expect(Array.isArray(result.constituentList)).toBe(true);
      expect(result.constituentList.length).toBeGreaterThan(0);
    });
  });
});

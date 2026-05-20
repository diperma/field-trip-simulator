import { describe, expect, it } from "vitest";
import { provinceRates } from "./rates";

describe("provinceRates", () => {
  it("contains the complete SBM TA 2026 province list used by the planner", () => {
    expect(provinceRates).toHaveLength(38);
    expect(provinceRates.map((rate) => rate.province)).toEqual([
      "Aceh",
      "Sumatera Utara",
      "Riau",
      "Kep. Riau",
      "Jambi",
      "Sumatera Barat",
      "Sumatera Selatan",
      "Lampung",
      "Bengkulu",
      "Kep. Bangka Belitung",
      "Banten",
      "Jawa Barat",
      "DKI Jakarta",
      "Jawa Tengah",
      "DI Yogyakarta",
      "Jawa Timur",
      "Bali",
      "Nusa Tenggara Barat",
      "Nusa Tenggara Timur",
      "Kalimantan Barat",
      "Kalimantan Tengah",
      "Kalimantan Selatan",
      "Kalimantan Timur",
      "Kalimantan Utara",
      "Sulawesi Utara",
      "Gorontalo",
      "Sulawesi Barat",
      "Sulawesi Selatan",
      "Sulawesi Tengah",
      "Sulawesi Tenggara",
      "Maluku",
      "Maluku Utara",
      "Papua",
      "Papua Barat",
      "Papua Barat Daya",
      "Papua Tengah",
      "Papua Selatan",
      "Papua Pegunungan",
    ]);
  });
});

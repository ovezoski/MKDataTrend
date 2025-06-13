export const fetchWholesaleTrade2023 = async () => {
  const response = await fetch(
    "https://makstat.stat.gov.mk:443/PXWeb/api/v1/mk/MakStat/VnatresnaTrgovija/VTBazna2021/400_VTtrg_GolemoGrupi_ml.px",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: [
          {
            code: "Назив на групата производи",
            selection: {
              filter: "item",
              values: [
                "0003", "0007", "0008", "0009", "0010", "0011",
                "0012", "0013", "0015", "0020", "0021", "0030",
                "0035", "0037", "0040"
              ],
            },
          },
          {
            code: "Година",
            selection: {
              filter: "item",
              values: ["2023"],
            },
          },
          {
            code: "Индикатори",
            selection: {
              filter: "item",
              values: ["001"],
            },
          },
        ],
        response: {
          format: "json-stat2",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch wholesale trade data");
  }

  const data = await response.json();
  return data;
};

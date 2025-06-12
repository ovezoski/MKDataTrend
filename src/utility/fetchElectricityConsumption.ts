export async function fetchElectricityData() {
  const url =
    "https://makstat.stat.gov.mk:443/PXWeb/api/v1/mk/MakStat/Energija/MesecEnergetStatistiki/125_Ene_Mk_EEmes_ml.px";

  const query = {
    query: [
      {
        code: "Индикатор",
        selection: {
          filter: "item",
          values: ["0", "1", "2", "3", "10", "17", "18", "19", "20"],
        },
      },
      {
        code: "Година и месец",
        selection: {
          filter: "item",
          values: ["156"],
        },
      },
    ],
    response: {
      format: "json-stat2",
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch electricity data: ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching electricity data:", error);
    throw error;
  }
}

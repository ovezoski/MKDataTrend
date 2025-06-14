export async function fetchPassengerCrossings() {
  const url = "https://makstat.stat.gov.mk:443/PXWeb/api/v1/mk/MakStat/Transport/PatenTransport/300_Trans_GranicniPremini_ml.px";

  const query = {
    query: [
      {
        code: "Година",
        selection: {
          filter: "item",
          values: [
            "2020",
            "2021",
            "2022",
            "2023"
          ]
        }
      }
    ],
    response: {
      format: "json-stat2"
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(query)
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch passenger crossings: ${res.statusText}`);
  }

  return res.json();
}
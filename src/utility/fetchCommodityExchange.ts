export async function fetchCommodityExchange() {
  const url =
    "https://makstat.stat.gov.mk:443/PXWeb/api/v1/mk/MakStat/NadvoresnaTrgovija/KumulativniPod/125_zemji_kumulativ_ml.px";

  const query = {
    query: [
      {
        code: "земја",
        selection: {
          filter: "item",
          values: ["BG", "CN", "DE", "GB", "GR", "IT", "RS"],
        },
      },
      {
        code: "Година",
        selection: {
          filter: "item",
          values: ["1"],
        },
      },
      {
        code: "Варијабла",
        selection: {
          filter: "item",
          values: ["3"],
        },
      },
    
      {
        code: "Вид на трговија",
        selection: {
          filter: "item",
          values: ["R", "S"],
        },
      },
    ],
    response: {
      format: "json-stat2",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Network response was not ok. Raw text:", errorText);
    throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}. Response: ${errorText.substring(0, 200)}...`);
  }

  return res.json();
}
export async function fetchNetoPlata() {
  const url = "https://makstat.stat.gov.mk:443/PXWeb/api/v1/mk/MakStat/PazarNaTrud/Plati/MesecnaBrutoNeto/180_PazTrud_Mk_oddeli_neto_ml.px";

  const query = {
    query: [
      {
        code: "Сектори и оддели",
        selection: {
          filter: "item",
          values: [
            "002", "006", "011", "036", "038",
            "043", "047", "051", "056", "059",
            "066", "070", "072", "080", "087",
            "089", "091", "095", "100"
          ]
        }
      },
      {
        code: "Месец",
        selection: {
          filter: "item",
          values: ["202412"]
        }
      },
      {
        code: "Мерки",
        selection: {
          filter: "item",
          values: ["0001"]
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

  if (!res.ok) throw new Error("Failed to fetch neto plata");

  return res.json();
}

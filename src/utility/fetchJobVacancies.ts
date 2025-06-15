export async function fetchJobVacancies() {
  const url = "https://makstat.stat.gov.mk:443/PXWeb/api/v1/mk/MakStat/PazarNaTrud/SlobodniRabotniMesta/225_PazTrud_Mk_asrm4_ml.px";

  const query = {
    query: [
      {
        code: "Групи на занимања",
        selection: {
          filter: "item",
          values: [
            "1", "2", "3", "4", "5",
            "6", "7", "8", "9", "10"
          ]
        }
      },
      {
        code: "Тримесечје",
        selection: {
          filter: "item",
          values: [
            "20251"
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
    throw new Error(`Failed to fetch job vacancies: ${res.statusText}`);
  }
  
  return res.json();
}
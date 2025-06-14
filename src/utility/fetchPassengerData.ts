export async function fetchPassengerCrossings() {
  // MakStat API endpoint for passenger crossings data
  const url = "https://makstat.stat.gov.mk:443/PXWeb/api/v1/mk/MakStat/Transport/PatenTransport/300_Trans_GranicniPremini_ml.px";

  // JSON query body for the API request
  const query = {
    query: [
      {
        code: "Година", // "Year" in Macedonian
        selection: {
          filter: "item",
          values: [
            "2020",
            "2021",
            "2022",
            "2023" // Include 2023 as per the user's request. MakStat API returns this if available.
          ]
        }
      }
    ],
    response: {
      format: "json-stat2" // Request data in json-stat2 format for easier parsing
    }
  };

  // Perform the API fetch request
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(query) // Convert the query object to a JSON string
  });

  // Check if the response was successful
  if (!res.ok) {
    throw new Error(`Failed to fetch passenger crossings: ${res.statusText}`);
  }

  // Parse the JSON response and return it
  return res.json();
}
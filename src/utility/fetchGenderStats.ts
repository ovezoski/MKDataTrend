export async function fetchGenderStatistics() {
  const url = "https://makstat.stat.gov.mk:443/PXWeb/api/v1/mk/MakStat/PoloviStat/125_PoloviStatistiki_ml.px";

  const query = {
    query: [
      {
        code: "Показател",
        selection: {
          filter: "item",
          values: [
            "01_01", // Население (Population)
            "01_02", // Живородени (Live births)
            "01_03", // Умрени (Deaths)
            "01_04", // Доселени (Immigrants)
            "01_05", // Отселени (Emigrants)
            "01_10", // Просечна возраст на населението (Average age of population)
            "01_12", // Стапка на морталитет (Mortality rate)
            "02_32", // Запишани ученици во основно образование (Enrolled students in primary education)
            "02_33", // Запишани ученици во средно образование (Enrolled students in secondary education)
            "02_40", // Вкупно запишани студенти,државни на РМ (Total enrolled students, state of RM)
            "02_41", // Дипломирани студенти, државјани на РМ (Graduated students, state of RM)
            "02_42", // Лица запишани на последипломски студии-магистри, државјани на РМ (Persons enrolled in postgraduate studies-masters, state of RM)
            "02_45", // Магистри на науки, државјани на РМ (Masters of science, state of RM)
            "02_47", // Доктори на науки, државјани на РМ (Doctors of science, state of RM)
            "04_54", // Стапка на вработеност (население на возраст од 15 години и повеќе) (Employment rate (population aged 15 and over))
            "04_55"  // Стапка на невработеност (население на возраст од 15 години и повеќе) (Unemployment rate (population aged 15 and over))
          ],
        },
      },
      {
        code: "Година",
        selection: {
          filter: "item",
          values: ["2021", "2022", "2023"],
        },
      },
    ],
    response: {
      format: "json-stat2", // Ensure this is json-stat2 for easier parsing
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
    const errorBody = await res.text();
    throw new Error(`Failed to fetch gender statistics: ${res.status} - ${errorBody}`);
  }

  return res.json();
}
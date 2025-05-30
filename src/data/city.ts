export interface City {
  name: string;
  coordinates: [number, number];
  population: number;
}

export const citiesData: City[] = [
  { name: "Skopje", coordinates: [21.4314, 41.9965], population: 506926 },
  { name: "Bitola", coordinates: [21.3322, 41.0314], population: 74550 },
  { name: "Kumanovo", coordinates: [21.7144, 42.1322], population: 70842 },
  { name: "Prilep", coordinates: [21.5536, 41.3458], population: 66246 },
  { name: "Tetovo", coordinates: [20.97, 42.0075], population: 52915 },
  { name: "Ohrid", coordinates: [20.8019, 41.1231], population: 42033 },
  { name: "Veles", coordinates: [21.775, 41.7153], population: 43716 },
  { name: "Strumica", coordinates: [22.6433, 41.4378], population: 35311 },
];

export interface LivestockDataRow {
  Regions: string;
  Year: string;
  "Livestock/Poultry/Bee-hives": string;
  Value: number;
}

export interface JsonStatDimensionCategory {
  index: { [key: string]: number };
  label: { [key: string]: string };
}

export interface JsonStatDimension {
  label: string;
  category: JsonStatDimensionCategory;
  extension?: { show: string };
  time?: boolean;
  map?: string;
}

export interface JsonStatDimensionRole {
  geo?: string[];
  time?: string[];
}

interface JsonStatDimensionsMap {
  [dimensionCode: string]: JsonStatDimension;
}

export interface JsonStatDataset {
  dimension: JsonStatDimensionsMap & {
    id: string[];
    size: number[];
    role?: JsonStatDimensionRole;
  };

  label: string;
  source: string;
  updated: string;
  value: number[];
  extension?: { px: { decimals: number } };
}

export interface RawJsonStatResponse {
  dataset: JsonStatDataset;
}

export const parseJsonStatData = (
  dataset: JsonStatDataset,
): LivestockDataRow[] => {
  const parsedData: LivestockDataRow[] = [];
  const { dimension, value: rawValues } = dataset;
  const { id: dimensionOrder, size } = dimension;

  const dimInfo = dimensionOrder.map((dimCode) => ({
    code: dimCode,
    label: dimension[dimCode].label,
    values: Object.keys(dimension[dimCode].category.index),
    valueLabels: dimension[dimCode].category.label,
  }));

  const strides: number[] = [];
  let currentStride = 1;
  for (let i = dimensionOrder.length - 1; i >= 0; i--) {
    strides.unshift(currentStride);
    currentStride *= size[i];
  }

  for (let i0 = 0; i0 < size[0]; i0++) {
    for (let i1 = 0; i1 < size[1]; i1++) {
      for (let i2 = 0; i2 < size[2]; i2++) {
        const valueIndex = i0 * strides[0] + i1 * strides[1] + i2 * strides[2];

        const row: LivestockDataRow = {
          Regions: dimInfo[0].valueLabels[dimInfo[0].values[i0]],
          Year: dimInfo[1].valueLabels[dimInfo[1].values[i1]],
          "Livestock/Poultry/Bee-hives":
            dimInfo[2].valueLabels[dimInfo[2].values[i2]],
          Value: rawValues[valueIndex],
        };
        parsedData.push(row);
      }
    }
  }
  return parsedData;
};

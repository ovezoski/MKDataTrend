export interface AppartmentsDataset {
  class: "dataset";
  label: string;
  source: string;
  updated: string;
  id: string[];
  size: number[];
  dimension: {
    [key: string]: Dimension;
  };
  value: (number | null)[];
  status: {
    [key: string]: string;
  };
  role: {
    time: string[];
  };
  version: string;
  extension?: {
    px?: {
      decimals?: number;
    };
  };
}

export interface Dimension {
  extension?: {
    show?: string;
    [key: string]: any;
  };
  label: string;
  category: {
    index: {
      [key: string]: number;
    };
    label: {
      [key: string]: string;
    };
  };
}

export interface TreemapNode
  extends d3.HierarchyRectangularNode<TreemapNodeData> {
  data: {
    name: string;
    value?: number;
    children?: TreemapNodeData[];
  };
}

export interface TreemapNodeData {
  name: string;
  value?: number;
  children?: TreemapNodeData[];
}

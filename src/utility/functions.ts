import { FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";

export const getColor = (category?: string) => {
  switch (category) {
    case "A":
      return "lightgreen";
    case "B":
      return "lightgreen";
    case "C":
      return "#D2B48C";
    case "D":
      return "#A0522D";
    default:
      return "grey";
  }
};

export function invertCoordinates(
  featureCollection: FeatureCollection<Polygon | MultiPolygon>,
): FeatureCollection<Polygon | MultiPolygon> {
  featureCollection.features.forEach((feature) => {
    if (feature.geometry) {
      if (feature.geometry.type === "Polygon") {
        const polygonCoordinates: Position[][] = feature.geometry.coordinates;

        polygonCoordinates.forEach((linearRing: Position[]) => {
          linearRing.reverse();
        });
      } else if (feature.geometry.type === "MultiPolygon") {
        const multiPolygonCoordinates: Position[][][] =
          feature.geometry.coordinates;

        multiPolygonCoordinates.forEach((polygonRings: Position[][]) => {
          polygonRings.forEach((linearRing: Position[]) => {
            linearRing.reverse();
          });
        });
      }
    }
  });
  return featureCollection;
}

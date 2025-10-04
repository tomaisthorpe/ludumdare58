import { TPalette } from "@tedengine/ted";

export function overridePalette(
  palette: TPalette,
  color: [number, number, number, number]
) {
  for (const key in palette) {
    palette[key] = color;
  }
  return palette;
}

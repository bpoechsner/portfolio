const PREVIEWABLE_FORMATS = ["STL", "OBJ", "GLB", "GLTF"];

export function isPreviewable(format: string) {
  return PREVIEWABLE_FORMATS.includes(format.toUpperCase());
}

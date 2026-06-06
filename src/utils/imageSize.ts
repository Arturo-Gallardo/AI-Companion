// reads the intrinsic pixel size of an image url (used to derive a character's
// frame size from its sprites during import).
export function getImageSize(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      reject(new Error(`failed to load image ${url}`));
    };
    image.src = url;
  });
}

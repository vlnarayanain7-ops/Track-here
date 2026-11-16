// src/lib/proofImage.js: shrink on the device; re-encoding also removes EXIF and location data
export async function compressImage(file, { maxSide = 1000, maxBytes = 200_000 } = {}) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = Object.assign(document.createElement('canvas'), {
    width: Math.round(bmp.width * scale),
    height: Math.round(bmp.height * scale),
  });
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.7;
  let blob;
  do {
    blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', q));
    q -= 0.1;
  } while (blob.size > maxBytes && q > 0.2);

  if (blob.size > maxBytes) throw new Error('That photo is too large. Try a smaller one.');
  return blob;
}

export const toBase64 = (blob) =>
  new Promise((r) => {
    const f = new FileReader();
    f.onload = () => r(String(f.result).split(',')[1]);
    f.readAsDataURL(blob);
  });

export default {
  compressImage,
  toBase64,
};

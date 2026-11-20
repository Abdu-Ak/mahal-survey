import 'server-only';

const TWO_MB = 2 * 1024 * 1024;

export async function validatePhoto(file: File | null, required: boolean) {
  if (!file || file.size === 0) {
    if (required) throw new Error('ഫോട്ടോ ചേർക്കുക');
    return null;
  }
  if (file.size > TWO_MB) throw new Error('ചുരുക്കിയ ഫോട്ടോ 2 MB-യിൽ താഴെയായിരിക്കണം');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!jpeg && !png && !webp) throw new Error('സാധുവായ JPEG, PNG അല്ലെങ്കിൽ WebP ഫോട്ടോ ചേർക്കുക');
  return {
    bytes,
    contentType: jpeg ? 'image/jpeg' : png ? 'image/png' : 'image/webp',
    extension: jpeg ? 'jpg' : png ? 'png' : 'webp',
  };
}

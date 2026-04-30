const decoder = new TextDecoder('utf-8');
const encoder = new TextEncoder(); // utf-8 is default

export function readFixedString(dataView: DataView, offset: number, maxLength: number): string {
  const buffer = dataView.buffer.slice(dataView.byteOffset + offset, dataView.byteOffset + offset + maxLength);
  const bytes = new Uint8Array(buffer);
  
  // Find null terminator position
  let length = 0;
  while (length < maxLength && bytes[length] !== 0) {
    length++;
  }
  
  return decoder.decode(bytes.subarray(0, length));
}

export function writeFixedString(dataView: DataView, offset: number, maxLength: number, value: string): void {
  const encoded = encoder.encode(value);
  const target = new Uint8Array(dataView.buffer, dataView.byteOffset + offset, maxLength);
  
  // Fill with 0
  target.fill(0);
  
  // Copy encoded bytes up to maxLength - 1 (to leave room for null or just fill the block)
  // Actually, we usually fill up to maxLength, if it truncates, the next field separation handles it.
  const copyLength = Math.min(encoded.length, maxLength);
  target.set(encoded.subarray(0, copyLength));
}

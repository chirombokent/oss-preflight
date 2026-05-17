import type { ScaffoldFile } from '../../../packages/scaffold/src/index.js';

const CRC_TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()): { date: number; time: number } {
  const year = Math.max(date.getFullYear(), 1980);
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

function localFileHeader(
  fileName: Buffer,
  fileData: Buffer,
  checksum: number,
  timestamp: { date: number; time: number }
): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(timestamp.time, 10);
  header.writeUInt16LE(timestamp.date, 12);
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(fileData.length, 18);
  header.writeUInt32LE(fileData.length, 22);
  header.writeUInt16LE(fileName.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}

function centralDirectoryHeader(
  fileName: Buffer,
  fileData: Buffer,
  checksum: number,
  offset: number,
  timestamp: { date: number; time: number }
): Buffer {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(timestamp.time, 12);
  header.writeUInt16LE(timestamp.date, 14);
  header.writeUInt32LE(checksum, 16);
  header.writeUInt32LE(fileData.length, 20);
  header.writeUInt32LE(fileData.length, 24);
  header.writeUInt16LE(fileName.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  return header;
}

function endOfCentralDirectory(fileCount: number, centralSize: number, centralOffset: number): Buffer {
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(fileCount, 8);
  end.writeUInt16LE(fileCount, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  return end;
}

export function createZip(files: ScaffoldFile[]): Buffer {
  const timestamp = dosDateTime();
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const normalizedPath = file.path.replace(/\\/g, '/');
    const fileName = Buffer.from(normalizedPath, 'utf-8');
    const fileData = Buffer.from(file.content, 'utf-8');
    const checksum = crc32(fileData);
    const localHeader = localFileHeader(fileName, fileData, checksum, timestamp);
    const centralHeader = centralDirectoryHeader(fileName, fileData, checksum, offset, timestamp);

    localParts.push(localHeader, fileName, fileData);
    centralParts.push(centralHeader, fileName);
    offset += localHeader.length + fileName.length + fileData.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  return Buffer.concat([
    ...localParts,
    ...centralParts,
    endOfCentralDirectory(files.length, centralSize, centralOffset),
  ]);
}

import csv from 'csv-parser';
import { Readable } from 'stream';

// Expected CSV columns in exact order
export const EXPECTED_COLUMNS = [
  'file name',
  'Date',
  'Time',
  'Time',  // Second time column
  'AEX',
  'Latitude',
  'Longitude',
  'Speed',
  'Course',
  'Magn',
  'Altit',
  'SPP',
  'SRR',
  'M-Lux',
  'R Ir',
  'G Ir',
  'R Ir',  // Second R Ir column
  'I Ir',
  'IBright',
  'Shutter',
  'Gain'
];

export function validateCsvStructure(headers) {
  if (!Array.isArray(headers) || headers.length !== EXPECTED_COLUMNS.length) {
    return {
      valid: false,
      error: `Expected ${EXPECTED_COLUMNS.length} columns, got ${headers.length}`
    };
  }

  for (let i = 0; i < headers.length; i++) {
    if (headers[i].trim() !== EXPECTED_COLUMNS[i]) {
      return {
        valid: false,
        error: `Column ${i + 1} should be '${EXPECTED_COLUMNS[i]}', got '${headers[i].trim()}'`
      };
    }
  }

  return { valid: true };
}

export function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];
    let isFirstRow = true;

    const stream = Readable.from(buffer);

    stream
      .pipe(csv({
        skipEmptyLines: true,
        trim: true
      }))
      .on('headers', (headerList) => {
        headers = headerList;
        const validation = validateCsvStructure(headers);
        if (!validation.valid) {
          return reject(new Error(`CSV validation failed: ${validation.error}`));
        }
        return true;
      })
      .on('data', (row) => {
        if (isFirstRow) {
          isFirstRow = false;
        }

        // Map CSV columns to our schema
        const point = {
          fileName: row['file name']?.trim(),
          date: row['Date']?.trim(),
          time: row['Time']?.trim(),
          timeStatus: Object.keys(row)[3] ? row[Object.keys(row)[3]]?.trim() : '', // Second Time column
          aex: row['AEX']?.trim(),
          latitude: row['Latitude']?.trim(),
          longitude: row['Longitude']?.trim(),
          speed: row['Speed']?.trim(),
          course: row['Course']?.trim(),
          magn: row['Magn']?.trim(),
          altitude: row['Altit']?.trim(),
          spp: row['SPP']?.trim(),
          srr: row['SRR']?.trim(),
          mLux: row['M-Lux']?.trim(),
          rIr1: Object.keys(row)[14] ? row[Object.keys(row)[14]]?.trim() : '', // First R Ir
          gIr: row['G Ir']?.trim(),
          rIr2: Object.keys(row)[16] ? row[Object.keys(row)[16]]?.trim() : '', // Second R Ir
          iIr: row['I Ir']?.trim(),
          iBright: row['IBright']?.trim(),
          shutter: row['Shutter']?.trim(),
          gain: row['Gain']?.trim(),
          hasPhoto: false
        };

        // Basic validation
        if (!point.fileName || !point.latitude || !point.longitude) {
          console.warn('Skipping invalid row:', point);
          return;
        }

        results.push(point);
      })
      .on('end', () => {
        console.log(`Parsed ${results.length} valid points from CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

export function getUniqueFileNames(points) {
  const fileNames = new Set();
  points.forEach(point => {
    if (point.fileName) {
      fileNames.add(point.fileName);
    }
  });
  return Array.from(fileNames);
}

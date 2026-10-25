import fs from 'node:fs';

// Resolved from the folder of this file, not from the folder where node is launched
const DEFAULT_FILE = new URL('./data.json', import.meta.url);

let data = null;

// Reads data.json on the first call, then keeps the data in memory.
// Throws an ENOENT error when the file does not exist.
export function getData() {
  if (data === null) {
    const file = process.env.DATA_FILE || DEFAULT_FILE;
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return data;
}

// Forgets the data in memory, so the next call to getData() reads the file again
export function reload() {
  data = null;
}

export function findStudent(ine) {
  return getData().students.find((student) => student.ine === ine);
}

export function findProf(number) {
  return getData().profs.find((prof) => prof.number === number);
}

export function findModule(code) {
  return getData().modules.find((mod) => mod.code_module === code);
}

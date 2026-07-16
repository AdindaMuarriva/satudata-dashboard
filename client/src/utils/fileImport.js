import * as XLSX from "xlsx";

function parseDelimited(text, separator = ",") {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  const parseLine = line => line.split(separator).map(value => value.trim().replace(/^\"|\"$/g, ""));
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => Object.fromEntries(headers.map((header, index) => [header, parseLine(line)[index] || ""])));
}

export async function readDataFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }
  const text = await file.text();
  if (name.endsWith(".json")) {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
  }
  return parseDelimited(text, name.endsWith(".tsv") ? "\t" : ",");
}

export const DATA_FILE_ACCEPT = ".csv,.tsv,.txt,.json,.xlsx,.xls,text/csv,text/plain,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

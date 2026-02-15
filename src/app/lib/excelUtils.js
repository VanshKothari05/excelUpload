import * as XLSX from "xlsx";

//  Auto detect header row index (per file)
export const detectHeaderRowIndex = (sheet) => {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

  if (!rows || rows.length === 0) return 0;

  let bestIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i] || [];

    const filledCells = row.filter(
      (cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""
    );

    if (filledCells.length < 2) continue;

    const textCells = filledCells.filter((cell) => isNaN(Number(cell)));

    const score = filledCells.length * 2 + textCells.length * 3;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
};

//  Read Excel file with hyperlinks preserved and empty rows/columns handled
export const readExcelFileData = (binaryString, headerRowIndex) => {
  const workbook = XLSX.read(binaryString, { type: "binary" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rowsAOA = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true,
  });

  const headerRow = rowsAOA[headerRowIndex] || [];
  const headers = headerRow.map((h) => String(h).trim()).filter(Boolean);

  const data = [];
  const hyperlinks = {};

  for (
    let excelRowIndex = headerRowIndex + 1;
    excelRowIndex < rowsAOA.length;
    excelRowIndex++
  ) {
    const rowArr = rowsAOA[excelRowIndex] || [];

    const rowObj = {};
    const linkObj = {};

    headers.forEach((colName, cIdx) => {
      const cellValue = rowArr?.[cIdx] ?? "";
      rowObj[colName] = cellValue;

      const cellAddress = XLSX.utils.encode_cell({ r: excelRowIndex, c: cIdx });
      const cell = sheet[cellAddress];

      if (cell && cell.l && cell.l.Target) {
        linkObj[colName] = cell.l.Target;
      }
    });

    const hasAnyValue = Object.values(rowObj).some(
      (v) => String(v).trim() !== ""
    );

    if (hasAnyValue) {
      hyperlinks[data.length] = linkObj;
      data.push(rowObj);
    }
  }

  return { data, headers, hyperlinks };
};

//  Strong empty column detection
export const isColumnEmptySmart = (mergedData, colName) => {
  if (!mergedData) return true;

  return mergedData.rows.every((row) => {
    const val = row[colName];

    if (val === undefined || val === null) return true;

    if (typeof val === "string") {
      const cleaned = val.trim();

      if (cleaned === "" || cleaned === "-" || cleaned === ",") return true;

      const onlyCommas = cleaned.replace(/,/g, "").trim() === "";
      if (onlyCommas) return true;

      return false;
    }

    if (typeof val === "number") return false;

    return String(val).trim() === "";
  });
};

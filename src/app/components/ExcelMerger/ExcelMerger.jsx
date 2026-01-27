"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";

import Header from "./Header";
import Tabs from "./Tabs";
import UploadSection from "./UploadSection";
import PreviewSection from "./PreviewSection";
import DatabaseSection from "./DatabaseSection";

import styles from "./excelMerger.module.css";

import {
  detectHeaderRowIndex,
  readExcelFileData,
  isColumnEmptySmart,
} from "@/app/lib/excelUtils";

export default function ExcelMerger() {
  const [files, setFiles] = useState([]);
  const [mergedData, setMergedData] = useState(null);
  const [savedRecords, setSavedRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [loading, setLoading] = useState(false);

  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [columnMappings, setColumnMappings] = useState({});

  const [hiddenColumns, setHiddenColumns] = useState(new Set());

  const [numericColumn, setNumericColumn] = useState("");
  const [numericDelta, setNumericDelta] = useState(0);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/excel");
      const data = await res.json();
      if (data.success) setSavedRecords(data.records);
    } catch (error) {
      console.error("Failed to fetch records:", error);
    }
  };

  // ✅ Normalize header names for auto mapping
  const normalizeHeader = (str) => {
    return String(str || "")
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // ✅ Detect Sr No column key (works for sr no, srno, serial no, etc.)
  const isSrNoColumn = (header) => {
    const h = normalizeHeader(header);
    return (
      h === "sr no" ||
      h === "srno" ||
      h === "s no" ||
      h === "serial no" ||
      h === "serial number" ||
      h === "sr number" ||
      h === "sr#"
    );
  };

  const getAllHeaders = () => {
    const allHeaders = [];
    files.forEach((file) => {
      file.headers.forEach((header) => {
        if (!allHeaders.includes(header)) allHeaders.push(header);
      });
    });
    return allHeaders;
  };

  // ✅ Manual mapping init
  const initializeColumnMappings = () => {
    const headers = getAllHeaders();
    const mappings = {};
    headers.forEach((header) => {
      mappings[header] = header;
    });
    setColumnMappings(mappings);
    setShowColumnMapping(true);
  };

  // ✅ Auto map similar headers like "srno" & "sr no"
  const autoMapHeaders = () => {
    const headers = getAllHeaders();

    const groups = {}; // normalized -> original list
    headers.forEach((h) => {
      const key = normalizeHeader(h);
      if (!groups[key]) groups[key] = [];
      groups[key].push(h);
    });

    const mappings = {};

    Object.keys(groups).forEach((normKey) => {
      const originals = groups[normKey];

      let best = originals[0];

      // ✅ force standard naming for SrNo group
      if (
        normKey.includes("sr") &&
        (normKey.includes("no") || normKey === "srno")
      ) {
        best = "Sr No";
      } else {
        // longest = usually more readable
        best = originals.sort((a, b) => b.length - a.length)[0];
      }

      originals.forEach((orig) => {
        mappings[orig] = best;
      });
    });

    setColumnMappings(mappings);
    setShowColumnMapping(true);
  };

  const updateColumnMapping = (originalColumn, newColumn) => {
    setColumnMappings((prev) => ({
      ...prev,
      [originalColumn]: newColumn,
    }));
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);

    uploadedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const binaryString = event.target.result;

        const workbook = XLSX.read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const autoHeaderIndex = detectHeaderRowIndex(sheet);

        const { data, headers, hyperlinks } = readExcelFileData(
          binaryString,
          autoHeaderIndex
        );

        setFiles((prev) => [
          ...prev,
          {
            id: `${file.name}_${Date.now()}_${Math.random()}`,
            name: file.name,
            binaryString,
            data,
            headers,
            hyperlinks,
            autoHeaderIndex,
            mode: "auto",
            manualHeaderIndex: autoHeaderIndex,
          },
        ]);
      };

      reader.readAsBinaryString(file);
    });

    e.target.value = "";
  };

  const updateFileHeaderMode = (fileId, mode) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;

        let headerIndex = f.autoHeaderIndex;

        if (mode === "manual") {
          headerIndex = Number(f.manualHeaderIndex);
          if (isNaN(headerIndex) || headerIndex < 0) headerIndex = 0;
        }

        const { data, headers, hyperlinks } = readExcelFileData(
          f.binaryString,
          headerIndex
        );

        return { ...f, mode, data, headers, hyperlinks };
      })
    );

    setShowColumnMapping(false);
    setColumnMappings({});
  };

  const updateManualHeaderIndex = (fileId, newManualIndex) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;

        const manualHeaderIndex = Number(newManualIndex);

        if (f.mode === "manual") {
          const safeIndex =
            isNaN(manualHeaderIndex) || manualHeaderIndex < 0
              ? 0
              : manualHeaderIndex;

          const { data, headers, hyperlinks } = readExcelFileData(
            f.binaryString,
            safeIndex
          );

          return {
            ...f,
            manualHeaderIndex,
            data,
            headers,
            hyperlinks,
          };
        }

        return { ...f, manualHeaderIndex };
      })
    );

    setShowColumnMapping(false);
    setColumnMappings({});
  };

  const mergeFiles = () => {
    if (files.length === 0) {
      alert("Please upload at least one file");
      return;
    }

    setHiddenColumns(new Set());
    setNumericColumn("");
    setNumericDelta(0);

    let finalMappings = columnMappings;

    // ✅ Mapping optional
    if (!finalMappings || Object.keys(finalMappings).length === 0) {
      finalMappings = {};
      getAllHeaders().forEach((h) => {
        finalMappings[h] = h;
      });
    }

    const mappedHeaders = new Set();
    Object.values(finalMappings).forEach((mappedName) => {
      if (mappedName) mappedHeaders.add(mappedName);
    });

    const merged = [];
    const mergedHyperlinks = {};

    files.forEach((file) => {
      file.data.forEach((row, rIdx) => {
        const mappedRow = {};

        Array.from(mappedHeaders).forEach((h) => {
          mappedRow[h] = "";
        });

        Object.keys(row).forEach((originalColumn) => {
          const mappedColumn = finalMappings[originalColumn] || originalColumn;

          if (row[originalColumn] !== undefined && row[originalColumn] !== "") {
            if (mappedRow[mappedColumn]) {
              mappedRow[mappedColumn] =
                mappedRow[mappedColumn] + ", " + row[originalColumn];
            } else {
              mappedRow[mappedColumn] = row[originalColumn];
            }
          }
        });

        const linkRow = file.hyperlinks?.[rIdx] || {};
        const mappedLinkRow = {};

        Object.keys(linkRow).forEach((originalColumn) => {
          const mappedColumn = finalMappings[originalColumn] || originalColumn;
          if (linkRow[originalColumn]) {
            mappedLinkRow[mappedColumn] = linkRow[originalColumn];
          }
        });

        mergedHyperlinks[merged.length] = mappedLinkRow;
        merged.push(mappedRow);
      });
    });

    // ✅ Sr No continuous numbering after merge
    const srNoHeader = Array.from(mappedHeaders).find((h) => isSrNoColumn(h));
    if (srNoHeader) {
      let counter = 1;
      merged.forEach((row) => {
        row[srNoHeader] = counter;
        counter++;
      });
    }

    setMergedData({
      headers: Array.from(mappedHeaders),
      rows: merged,
      hyperlinks: mergedHyperlinks,
    });

    setActiveTab("preview");
  };

  const toggleColumn = (col) => {
    setHiddenColumns((prev) => {
      const updated = new Set(prev);
      if (updated.has(col)) updated.delete(col);
      else updated.add(col);
      return updated;
    });
  };

  const removeEmptyColumns = () => {
    if (!mergedData) return;

    const emptyCols = mergedData.headers.filter((h) =>
      isColumnEmptySmart(mergedData, h)
    );

    setHiddenColumns((prev) => {
      const updated = new Set(prev);
      emptyCols.forEach((c) => updated.add(c));
      return updated;
    });

    if (emptyCols.includes(numericColumn)) {
      setNumericColumn("");
      setNumericDelta(0);
    }
  };

  const applyNumericDelta = () => {
    if (!mergedData) return;

    if (!numericColumn) {
      alert("Select a numeric column first");
      return;
    }

    const delta = Number(numericDelta);
    if (isNaN(delta)) {
      alert("Enter valid number");
      return;
    }

    const updatedRows = mergedData.rows.map((row) => {
      const value = row[numericColumn];
      const num = Number(value);

      if (value === "" || value === null || value === undefined || isNaN(num)) {
        return row;
      }

      return { ...row, [numericColumn]: num + delta };
    });

    setMergedData({ ...mergedData, rows: updatedRows });
  };

  const getFinalMergedData = (data) => {
    if (!data) return null;

    const finalHeaders = data.headers.filter((h) => !hiddenColumns.has(h));

    const finalRows = data.rows.map((row) => {
      const obj = {};
      finalHeaders.forEach((h) => {
        obj[h] = row[h] ?? "";
      });
      return obj;
    });

    const finalHyperlinks = {};
    if (data.hyperlinks) {
      finalRows.forEach((_, rIdx) => {
        const linkRow = data.hyperlinks?.[rIdx] || {};
        const newLinkRow = {};
        finalHeaders.forEach((h) => {
          if (linkRow[h]) newLinkRow[h] = linkRow[h];
        });
        finalHyperlinks[rIdx] = newLinkRow;
      });
    }

    return {
      headers: finalHeaders,
      rows: finalRows,
      hyperlinks: finalHyperlinks,
    };
  };

  const saveToDatabase = async () => {
    if (!mergedData) return alert("No merged data to save");

    const finalData = getFinalMergedData(mergedData);

    setLoading(true);
    try {
      const res = await fetch("/api/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: finalData, fileCount: files.length }),
      });

      const result = await res.json();

      if (result.success) {
        alert("Data saved successfully!");
        await fetchRecords();
        setActiveTab("database");
      } else {
        alert("Failed to save data");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecordFromDB = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`/api/excel/${id}`, { method: "DELETE" });
      const result = await res.json();

      if (result.success) {
        await fetchRecords();
        alert("Record deleted successfully");
      } else {
        alert("Failed to delete record");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete record");
    }
  };

  // ✅ Export with hyperlinks styled BLUE + UNDERLINE
  const exportToExcel = (data = mergedData) => {
    if (!data) {
      alert("No data to export");
      return;
    }

    const finalData = data === mergedData ? getFinalMergedData(mergedData) : data;

    const headers = finalData.headers;
    const rows = finalData.rows;

    const aoa = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    if (finalData.hyperlinks) {
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const linkRow = finalData.hyperlinks?.[rIdx];
        if (!linkRow) continue;

        for (let cIdx = 0; cIdx < headers.length; cIdx++) {
          const colName = headers[cIdx];
          const link = linkRow[colName];

          if (link) {
            const cellAddress = XLSX.utils.encode_cell({ r: rIdx + 1, c: cIdx });

            if (!ws[cellAddress]) {
              ws[cellAddress] = { t: "s", v: "" };
            }

            if (!ws[cellAddress].v || String(ws[cellAddress].v).trim() === "") {
              ws[cellAddress].v = rows[rIdx]?.[colName] || "Open";
            }

            ws[cellAddress].l = { Target: link };
            ws[cellAddress].t = "s";

            // ✅ Style (blue + underline)
            ws[cellAddress].s = {
              font: {
                color: { rgb: "0000FF" },
                underline: true,
              },
            };
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Merged Data");
    XLSX.writeFile(wb, `merged_${Date.now()}.xlsx`);
  };

  const clearFiles = () => {
    setFiles([]);
    setMergedData(null);
    setColumnMappings({});
    setShowColumnMapping(false);
    setHiddenColumns(new Set());
    setNumericColumn("");
    setNumericDelta(0);
  };

  const visibleHeaders = mergedData
    ? mergedData.headers.filter((h) => !hiddenColumns.has(h))
    : [];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Header />

        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          savedCount={savedRecords.length}
        />

        <div className={styles.content}>
          {activeTab === "upload" && (
            <UploadSection
              files={files}
              onUpload={handleFileUpload}
              clearFiles={clearFiles}
              updateFileHeaderMode={updateFileHeaderMode}
              updateManualHeaderIndex={updateManualHeaderIndex}
              showColumnMapping={showColumnMapping}
              initializeColumnMappings={initializeColumnMappings}
              autoMapHeaders={autoMapHeaders}   // ✅ NEW
              getAllHeaders={getAllHeaders}
              columnMappings={columnMappings}
              updateColumnMapping={updateColumnMapping}
              mergeFiles={mergeFiles}
            />
          )}

          {activeTab === "preview" && mergedData && (
            <PreviewSection
              mergedData={mergedData}
              visibleHeaders={visibleHeaders}
              hiddenColumns={hiddenColumns}
              toggleColumn={toggleColumn}
              removeEmptyColumns={removeEmptyColumns}
              numericColumn={numericColumn}
              setNumericColumn={setNumericColumn}
              numericDelta={numericDelta}
              setNumericDelta={setNumericDelta}
              applyNumericDelta={applyNumericDelta}
              saveToDatabase={saveToDatabase}
              exportToExcel={exportToExcel}
              loading={loading}
            />
          )}

          {activeTab === "database" && (
            <DatabaseSection
              savedRecords={savedRecords}
              exportToExcel={exportToExcel}
              deleteRecordFromDB={deleteRecordFromDB}
            />
          )}
        </div>
      </div>
    </div>
  );
}

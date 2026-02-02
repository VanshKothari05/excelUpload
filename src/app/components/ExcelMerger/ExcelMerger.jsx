"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";

import Header from "./Header";
import Tabs from "./Tabs";
import UploadSection from "./UploadSection";
import PreviewSection from "./PreviewSection";
import DatabaseSection from "./DatabaseSection";
import ColumnMappingModal from "./ColumnMappingModal";

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

  // ✅ Diamond industry column synonyms mapping
  const getStandardColumnName = (header) => {
    const normalized = normalizeHeader(header);
    
    // Define synonym groups with standard name (LHS) and all variations (RHS)
    const synonymGroups = {
      "Weight": ["weight", "carats", "cts", "ct", "carat"],
      "Color": ["color", "col", "colour"],
      "Fancy Color": ["fancy color", "fancy col", "fan colour", "fancy colour"],
      "Clarity": ["clarity", "purity", "cla", "pur"],
      "Polish": ["polish", "pol"],
      "Stone ID": ["stone id", "stock id", "packet no", "stone no", "stone id no","id"],
      "Fluorescence": ["fluor", "fluorescence", "fl", "flo"],
      "Shade": ["shade", "tinge", "cs"],
      "Symmetry": ["symmetry", "sym"],
      "Price": ["price", "pri", "pr/ct", "pr ct"],
      "Discount": ["discount", "dis%", "rep%", "back", "disc", "dis"],
      "Amount": ["amount", "sele amount", "total amount", "amt", "total price", "total value", "value"],
      "Rap Price": ["rap price", "rap", "rap rate", "rap list", "base rate", "base value"],
      "Lab": ["lab"],
      "Measurement": ["measurement", "meas", "measm", "measurment"],
      "Height": ["height"],
      "Ratio": ["ratio", "l/w", "l w"],
      "Girdle": ["girdle", "girdal%", "gir", "girdie desc", "girdal"],
      "Depth": ["depth", "dep%", "td%", "total depth", "dep"],
      "Table": ["table", "tab%", "tab", "table%"],
      "Inclusion": ["inclusion", "inclusion ditel", "inc", "inclusion detail"],
      "Black Inclusion": ["black inclusion", "black"],
      "White Inclusion": ["white inclusion", "white"],
      "Table Inclusion": ["table inclusion", "tab inclusion", "tblincl", "incl", "table open"],
      "Ind Natural": ["ind natural"],
      "Pav Open": ["pav open", "pv opn"],
      "Cr Open": ["cr open", "cr opn"],
      "Cr Ex Open": ["cr ex open"],
      "Pav Ex Facet": ["pav ex facet"],
      "Milky": ["milky", "mil"],
      "Lab Comments": ["lab comments", "lab comment", "comment"],
      "Add Comments": ["add comments", "additional comments", "additonal comments"],
      "Type IIa": ["type iia", "type2a", "type 2a"],
      "Key To Symbols": ["key to symbols", "key to sym"],
      "Side Inclusion": ["side inclusion", "side incl"],
      "Eyeclean": ["eyeclean", "ec"],
      "Pavilion Angle": ["pavilion angle", "pavelion angal", "pv%", "pvangl", "pv>", "pv"],
      "Crown Angle": ["crown angle", "crown angal", "cr%", "crang", "cr>", "cr"],
      "Crown Height": ["crown height", "crown hight", "crh%", "crh", "crhgt", "cr hgt%", "cr hgt"],
      "Pavilion Height": ["pavilion height", "pavelion hight", "pvh%", "pvh", "pvhgt", "pav hgt%", "pav hgt"],
      "H&A": ["h&a", "ha", "heart and arrow", "hearts and arrows"],
      "Culet": ["culet", "cul"],
      "Luster": ["luster", "lus"]
    };

    // Find matching standard name
    for (const [standardName, variations] of Object.entries(synonymGroups)) {
      if (variations.includes(normalized)) {
        return standardName;
      }
    }

    // If no match found, return original header with proper capitalization
    return header;
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

  // ✅ Open advanced mapping modal
  const openAdvancedMapping = () => {
    setShowColumnMapping(true);
  };

  // ✅ Auto map similar headers with domain-specific synonyms
  const autoMapHeaders = () => {
    const mappings = {};
    const headerGroups = {};
    
    // Group headers by their standard name
    files.forEach((file) => {
      file.headers.forEach((header) => {
        const standardName = getStandardColumnName(header);
        
        if (!headerGroups[standardName]) {
          headerGroups[standardName] = [];
        }
        headerGroups[standardName].push({ fileId: file.id, header });
      });
    });

    let mappedCount = 0;
    const mappingSummary = [];
    
    // Create mappings
    Object.keys(headerGroups).forEach((standardName) => {
      const group = headerGroups[standardName];
      
      // If multiple columns map to same standard name, show in summary
      if (group.length > 1) {
        const originalNames = group.map(g => g.header).join(", ");
        mappingSummary.push(`"${originalNames}" → "${standardName}"`);
        mappedCount += group.length;
      }
      
      // Map all variations to the standard name
      group.forEach(({ fileId, header }) => {
        mappings[`${fileId}::${header}`] = standardName;
      });
    });

    setColumnMappings(mappings);
    
    // ✅ Show feedback to user
    if (mappingSummary.length > 0) {
      alert(`✓ Auto-mapping applied!\n\n${mappingSummary.length} column group(s) mapped:\n\n${mappingSummary.join('\n')}\n\nClick "Advanced Mapping" to review or modify.`);
    } else {
      alert("ℹ️ All columns already use standard names.\n\nClick \"Advanced Mapping\" to manually map columns if needed.");
    }
  };

  // ✅ Apply mappings from the advanced modal
  const applyAdvancedMapping = (newMappings) => {
    setColumnMappings(newMappings);
    setShowColumnMapping(false);
    
    // Count how many columns were actually mapped
    let changedCount = 0;
    Object.keys(newMappings).forEach((key) => {
      const originalHeader = key.split('::')[1];
      if (newMappings[key] !== originalHeader) {
        changedCount++;
      }
    });
    
    if (changedCount > 0) {
      alert(`✓ Mapping applied! ${changedCount} column(s) will be renamed during merge.`);
    }
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

  // ✅ Helper to detect if a row is a summary row (Total/Average) or footer/disclaimer
  const isSummaryRow = (row) => {
    if (!row) return false;
    
    // Get all non-empty values from the row
    const allValues = Object.values(row).filter(v => 
      v !== null && v !== undefined && String(v).trim() !== ""
    );
    
    // If row is completely empty, skip it
    if (allValues.length === 0) return true;
    
    // Check first few columns for "Total", "Average", "Sum", "Grand Total" etc.
    const firstValues = Object.values(row).slice(0, 3).map(v => 
      String(v || "").toLowerCase().trim()
    );
    
    const summaryKeywords = ["total", "average", "avg", "sum", "grand total", "subtotal"];
    
    if (firstValues.some(val => summaryKeywords.includes(val))) {
      return true;
    }
    
    // Check for footer/disclaimer rows
    // These often start with "1)", "2)", "3)" or contain long text
    const firstValue = String(allValues[0] || "").trim();
    
    // Pattern: "1) Something...", "2) Something...", etc.
    if (/^\d+\)/.test(firstValue)) {
      return true;
    }
    
    // Check if row contains disclaimer-like text (long sentences with certain keywords)
    const rowText = allValues.join(" ").toLowerCase();
    const disclaimerKeywords = [
      "availability",
      "prices are subject to change",
      "not liable",
      "disclaimer",
      "refer our website",
      "please contact",
      "detailed and in-depth",
      "shown in brackets",
      "for match-pair pieces"
    ];
    
    if (disclaimerKeywords.some(keyword => rowText.includes(keyword))) {
      return true;
    }
    
    // If first column contains very long text (>100 chars), likely a footer note
    if (firstValue.length > 100) {
      return true;
    }
    
    return false;
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

    // ✅ If no mapping specified, create default mapping
    if (!finalMappings || Object.keys(finalMappings).length === 0) {
      finalMappings = {};
      files.forEach((file) => {
        file.headers.forEach((header) => {
          finalMappings[`${file.id}::${header}`] = header;
        });
      });
    }

    // ✅ Extract dimension mappings and regular mappings
    const dimensionMappings = {}; // { "Dimension": [{ columnName, separator, order, fileId, originalColumn }] }
    const regularMappings = {};
    
    Object.keys(finalMappings).forEach((key) => {
      const value = finalMappings[key];
      
      if (typeof value === 'string' && value.includes('::DIMENSION::')) {
        // Format: "Dimension::DIMENSION::Length::×::0"
        const parts = value.split('::');
        const dimensionName = parts[0];
        const originalColumnName = parts[2];
        const separator = parts[3];
        const order = parseInt(parts[4]);
        
        if (!dimensionMappings[dimensionName]) {
          dimensionMappings[dimensionName] = [];
        }
        
        const [fileId, originalColumn] = key.split('::');
        dimensionMappings[dimensionName].push({
          columnName: originalColumnName,
          separator,
          order,
          fileId,
          originalColumn,
        });
      } else {
        regularMappings[key] = value;
      }
    });

    // Sort dimension columns by order
    Object.keys(dimensionMappings).forEach((dimName) => {
      dimensionMappings[dimName].sort((a, b) => a.order - b.order);
    });

    const mappedHeaders = new Set();
    Object.values(regularMappings).forEach((mappedName) => {
      if (mappedName) mappedHeaders.add(mappedName);
    });
    Object.keys(dimensionMappings).forEach((dimName) => {
      mappedHeaders.add(dimName);
    });

    const merged = [];
    const mergedHyperlinks = {};

    files.forEach((file) => {
      file.data.forEach((row, rIdx) => {
        // ✅ Skip Total, Average, and other summary rows
        if (isSummaryRow(row)) {
          return;
        }

        const mappedRow = {};

        Array.from(mappedHeaders).forEach((h) => {
          mappedRow[h] = "";
        });

        // ✅ Handle dimension columns
        Object.keys(dimensionMappings).forEach((dimName) => {
          const dimCols = dimensionMappings[dimName];
          const values = [];
          
          dimCols.forEach((dimCol) => {
            if (dimCol.fileId === file.id) {
              const value = row[dimCol.originalColumn];
              if (value !== undefined && value !== null && value !== "") {
                values.push(value);
              }
            }
          });
          
          if (values.length > 0) {
            const separator = dimCols[0].separator || "×";
            const dimensionValue = values.join(` ${separator} `);
            
            if (mappedRow[dimName]) {
              // If dimension already has a value from another file, keep the more complete one
              const existingParts = mappedRow[dimName].split(separator).map(v => v.trim());
              if (values.length > existingParts.length) {
                mappedRow[dimName] = dimensionValue;
              }
            } else {
              mappedRow[dimName] = dimensionValue;
            }
          }
        });

        // ✅ Handle regular columns
        Object.keys(row).forEach((originalColumn) => {
          const mappingKey = `${file.id}::${originalColumn}`;
          
          // Skip if this is a dimension column
          const isDimension = Object.keys(dimensionMappings).some((dimName) => {
            return dimensionMappings[dimName].some((dimCol) => 
              dimCol.fileId === file.id && dimCol.originalColumn === originalColumn
            );
          });
          
          if (!isDimension) {
            const mappedColumn = regularMappings[mappingKey] || originalColumn;

            if (row[originalColumn] !== undefined && row[originalColumn] !== "") {
              if (mappedRow[mappedColumn]) {
                mappedRow[mappedColumn] =
                  mappedRow[mappedColumn] + ", " + row[originalColumn];
              } else {
                mappedRow[mappedColumn] = row[originalColumn];
              }
            }
          }
        });

        const linkRow = file.hyperlinks?.[rIdx] || {};
        const mappedLinkRow = {};

        Object.keys(linkRow).forEach((originalColumn) => {
          const mappingKey = `${file.id}::${originalColumn}`;
          const mappedColumn = regularMappings[mappingKey] || originalColumn;
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
              openAdvancedMapping={openAdvancedMapping}
              autoMapHeaders={autoMapHeaders}
              getAllHeaders={getAllHeaders}
              columnMappings={columnMappings}
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

      {/* ✅ Advanced Column Mapping Modal */}
      {showColumnMapping && (
        <ColumnMappingModal
          files={files}
          columnMappings={columnMappings}
          onApply={applyAdvancedMapping}
          onCancel={() => setShowColumnMapping(false)}
        />
      )}
    </div>
  );
}
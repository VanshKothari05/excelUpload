"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";

import Header from "./Header";
import Tabs from "./Tabs";
import UploadSection from "./UploadSection";
import PreviewSection from "./PreviewSection";


import styles from "./excelMerger.module.css";

import {
  detectHeaderRowIndex,
  readExcelFileData,
  isColumnEmptySmart,
} from "@/app/lib/excelUtils";

export default function ExcelMerger() {
  // Add autoMapped and manualMapped states
  const [autoMapped, setAutoMapped] = useState({});
  const [manualMapped, setManualMapped] = useState({});
  const [showMergedPairs, setShowMergedPairs] = useState(false);
const [mergedPairsData, setMergedPairsData] = useState({});
const [columnMappings, setColumnMappings] = useState({});

  const [files, setFiles] = useState([]);
  const [mergedData, setMergedData] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [loading, setLoading] = useState(false);



  const [hiddenColumns, setHiddenColumns] = useState(new Set());

  const [numericColumn, setNumericColumn] = useState("");
  const [numericDelta, setNumericDelta] = useState(0);

  // Normalize header names for auto mapping
  const normalizeHeader = (str) => {
    return String(str || "")
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s*%\s*/g, "%")
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s*>\s*/g, ">")
      .replace(/\s*#\s*/g, "#")
      .replace(/\s*&\s*/g, "&")
      .replace(/\s*:\s*/g, ":")
      .replace(/:/g, "/")
      .trim();
  };
  // Load saved manual mappings from localStorage
const loadSavedMappings = () => {
  try {
    const saved = localStorage.getItem('manualColumnMappings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setManualMapped(parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load saved mappings:', error);
  }
  return {};
};

// Save manual mappings to localStorage
const saveMappingsToStorage = (mappings) => {
  try {
    localStorage.setItem('manualColumnMappings', JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to save mappings:', error);
  }
};

  // Detect Sr No column key 
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

  // Diamond industry column synonyms mapping
  const getStandardColumnName = (header) => {
    
    if (isSrNoColumn(header)) {
      return "Sr No";
    }
    
    const normalized = normalizeHeader(header);
    // Synonym Table
    const synonymGroups = {
      "Weight": ["weight", "carats", "cts", "ct", "carat"],
      "Color": ["color", "col", "colour"],
      "Fancy Color": ["fancy color", "fancy col", "fan colour", "fancy colour", "fl col"],
      "Clarity": ["clarity", "purity", "cla", "pur"],
      "Polish": ["polish", "pol", "polished"],
      "Stone ID": ["stone id", "stock id", "packet no", "stone no", "stone id no", "id"],
      "Fluorescence": ["fluorescence", "fluor", "fl", "flo"],
      "Fluorescence Image": ["fluro"],
      "Shade": ["shade", "tinge", "cs", "color shade"],
      "Symmetry": ["symmetry", "sym"],
      "Price": ["price", "pri", "pr/ct", "pr ct", "price/cts inr", "prct"],
      "Discount": ["discount", "dis%", "disc%", "rep%", "back", "disc", "dis"],
      "Amount": ["amount", "sele amount", "total amount", "amt", "total price", "total value", "value", "total amt"],
      "Rap Price": ["rap price", "rap", "rap rate", "rap list", "base rate", "base value", "baserate"],
      "Lab": ["lab"],
      "Measurement": ["measurement", "meas", "measm", "measurment"],
      "Height": ["height"],
      "Ratio": ["ratio", "l/w", "l w", "lw"],
      "Girdle": ["girdle", "girdal%", "gir", "girdie desc", "girdal", "grd%", "grd %"],
      "Depth": ["depth", "dep%", "td%", "total depth", "dep", "depth%", "depth %"],
      "Table": ["table", "tab%", "tab", "table%", "table %"],
      "Inclusion": ["inclusion", "inclusion ditel", "inc", "inclusion detail"],
      "Inclusion Pattern": ["incl ptrn", "inclusion pattern", "incl pattern"],
      "Black Inclusion": ["black inclusion", "black", "blk incl", "blk"],
      "White Inclusion": ["white inclusion", "white", "wht incl", "wht"],
      "Table Inclusion": ["table inclusion", "tab inclusion", "tblincl", "incl", "table open", "tbl incl", "table incl"],
      "Ind Natural": ["ind natural"],
      "Naturals": ["natts", "naturals", "natural"],
      "Pav Open": ["pav open", "pv opn", "pav opn"],
      "Cr Open": ["cr open", "cr opn", "crn opn"],
      "Cr Ex Open": ["cr ex open"],
      "Cr Ex Facet": ["cr ex facet"],
      "Pav Ex Facet": ["pav ex facet", "pav_ex_facet"],
      "Milky": ["milky", "mil"],
      "Lab Comments": ["lab comments", "lab comment", "comment", "lab commnt"],
      "Add Comments": ["add comments", "additional comments", "additonal comments", "addl comments"],
      "Type IIa": ["type iia", "type2a", "type 2a", "type iia"],
      "Key To Symbols": ["key to symbols", "key to sym", "key to symbol"],
      "Side Inclusion": ["side inclusion", "side incl"],
      "Eyeclean": ["eyeclean", "ec", "eye clean", "naked eye"],
      "Pavilion Angle": ["pavilion angle", "pavelion angal", "pv%", "pvangl", "pv>", "pv", "pav>"],
      "Crown Angle": ["crown angle", "crown angal", "cr%", "crang", "cr>", "cr"],
      "Crown Height": ["crown height", "crown hight", "crh%", "crh", "crhgt", "cr hgt%", "cr hgt"],
      "Pavilion Height": ["pavilion height", "pavelion hight", "pvh%", "pvh", "pvhgt", "pav hgt%", "pav hgt"],
      "H&A": ["h&a", "ha", "heart and arrow", "hearts and arrows", "hearts & arrows", "hearts&arrows"],
      "Culet": ["culet", "cul"],
      "Luster": ["luster", "lus"],
      "Status": ["status", "status/location", "status / location"],
      "Certificate": ["cert", "certificate", "certif"],
      "Shape": ["shape"],
      "Cut": ["cut"],
      "Type2 Certificate": ["type2 certi", "type2 cert", "type 2 cert"],
      "Front Hand": ["front hand"],
      "Back Hand": ["back hand"],
      "Tweezer": ["tweezer"],
      "Light Video": ["light video"],
      "Dark Video": ["dark video"],
      "Video with Details": ["video with details"],
      "MP4 Video": ["mp4 video"],
      "Plotting": ["plotting"],
      "Journey": ["journey"],
      "Consumer Video": ["consumer video"],
      "ASET": ["aset"],
      "Disc Price": ["disc price"],
      "Disc Total": ["disc total"],
      "View DNA": ["view dna"],
      "Rating": ["rating"],
      "CM": ["cm"],
      "LOC": ["loc"],
      "FE": ["fe"],
      "Int Grn": ["int grn"],
      "Int Grn Typ": ["int grn typ"],
      "Tbl Opn": ["tbl opn"],
      "Grd Crn Opn": ["grd crn opn"],
      "Table Black": ["table black"],
      "LP": ["lp"]
    };

    // Find matching standard name
    for (const [standardName, variations] of Object.entries(synonymGroups)) {
      if (variations.includes(normalized)) {
        return standardName;
      }
    }

    // If no match found, return original header
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



  // Auto map similar headers 
const autoMapHeaders = () => {
  if (files.length < 2) {
    alert("Upload at least 2 files");
    return;
  }

  const mappings = {};
  const headerGroups = {};
  const pairsData = {}; 

  //  Load saved manual mappings first
  const savedManual = loadSavedMappings();
  console.log('📂 Loaded saved manual mappings:', savedManual);

  // group similar headers
  files.forEach((file) => {
    file.headers.forEach((header) => {
      const standard = getStandardColumnName(header);

      if (!headerGroups[standard]) headerGroups[standard] = [];
      headerGroups[standard].push({ fileId: file.id, fileName: file.name, header });
    });
  });

  Object.keys(headerGroups).forEach((standard) => {
    const group = headerGroups[standard];

    if (group.length > 1) {
      // Track merged pairs
      if (!pairsData[standard]) {
        pairsData[standard] = [];
      }

      group.forEach(({ fileId, fileName, header }) => {
        const key = `${fileId}::${header}`;
        
        //  Check if there's a saved manual mapping for this key
        if (savedManual[key]) {
          mappings[key] = savedManual[key];
          console.log(`✅ Using saved manual mapping: ${key} → ${savedManual[key]}`);
        } else {
          mappings[key] = standard;
        }

        //  Track the pair
        pairsData[standard].push({
          key: key,
          fileName: fileName,
          originalHeader: header,
          isManual: !!savedManual[key]
        });
      });
    }
  });

  //  ALSO apply manual mappings that don't fit into auto-groups
  Object.keys(savedManual).forEach((key) => {
    if (!mappings[key]) {
      mappings[key] = savedManual[key];
      console.log(`✅ Applying orphan manual mapping: ${key} → ${savedManual[key]}`);
      
      // Add to pairsData
      const [fileId, header] = key.split('::');
      const file = files.find(f => f.id === fileId);
      const targetName = savedManual[key];
      
      if (file) {
        if (!pairsData[targetName]) {
          pairsData[targetName] = [];
        }
        
        pairsData[targetName].push({
          key: key,
          fileName: file.name,
          originalHeader: header,
          isManual: true
        });
      }
    }
  });

  setColumnMappings(mappings);
  setMergedPairsData(pairsData);

  // Set autoMapped state (only for non-manual ones)
  const auto = {};
  Object.keys(mappings).forEach(k => {
    if (!savedManual[k]) {
      auto[k] = true;
    }
  });

  // ✅ AUTO-MARK Height, Meas MM, and Measurement as auto-mapped (green)
  // These are internally combined in mergeFiles function: L*W*H → Measurement
  files.forEach((file) => {
    file.headers.forEach((header) => {
      const lower = normalizeHeader(header);
      const key = `${file.id}::${header}`;
      
      // Mark Height columns (used in L*W*H combination)
      if (lower.includes("height") || lower === "height") {
        auto[key] = true;
      }
      
      // Mark Meas MM columns (contains L*W dimensions)
      if ((lower.includes("meas") && lower.includes("mm")) || 
          lower === "meas mm" ||
          lower.includes("measmm")) {
        auto[key] = true;
      }
      
      // Mark Measurement columns (the combined result L*W*H)
      if (lower === "measurement" || 
          lower === "meas" || 
          lower === "measm" ||
          lower === "measurment") {
        auto[key] = true;
      }
    });
  });

  setAutoMapped(auto);
  
  console.log('✅ Auto mapping complete. Total mappings:', Object.keys(mappings).length);
  console.log('Manual mappings preserved:', Object.keys(savedManual).length);
  console.log('✅ Height/Meas MM/Measurement marked as auto-mapped (green)');
};
//  Decombine/remove entire mapping pair
const decombineMapping = (mergedColumnName) => {
  console.log('=== DECOMBINE MAPPING CALLED ===');
  console.log('mergedColumnName:', mergedColumnName);
  console.log('mergedPairsData:', mergedPairsData);
  console.log('columnMappings:', columnMappings);
  
  // Get the pairs for this merged column
  const pairs = mergedPairsData[mergedColumnName];
  
  console.log('pairs found:', pairs);
  
  if (!pairs || pairs.length === 0) {
    console.error('No pairs found for:', mergedColumnName);
    console.error('Available keys in mergedPairsData:', Object.keys(mergedPairsData));
    alert('No mappings found to remove. Check console for debug info.');
    return;
  }

  // Show confirmation dialog
  const pairCount = pairs.length;
  if (!confirm(`Are you sure you want to remove all ${pairCount} column(s) mapped to "${mergedColumnName}"?`)) {
    return;
  }

  // Get all mapping keys from the pairs
  const keysToRemove = pairs.map(pair => pair.key);
  
  console.log('Keys to remove:', keysToRemove);

  // Remove all mappings for this merged column
  const updatedMappings = { ...columnMappings };
  const updatedAuto = { ...autoMapped };
  const updatedManual = { ...manualMapped };

  keysToRemove.forEach(key => {
    console.log(`Deleting key: ${key}`);
    delete updatedMappings[key];
    delete updatedAuto[key];
    delete updatedManual[key];
  });

  setColumnMappings(updatedMappings);
  setAutoMapped(updatedAuto);
  setManualMapped(updatedManual);
  saveMappingsToStorage(updatedManual);

  // Remove from mergedPairsData
  const updatedPairs = { ...mergedPairsData };
  delete updatedPairs[mergedColumnName];
  setMergedPairsData(updatedPairs);

  console.log('✅ Updated mappings:', updatedMappings);
  console.log('✅ Updated pairs:', updatedPairs);

  alert(`✅ Mapping removed successfully! Click "Merge Files" to see updated result.`);
};
//  Apply mappings from advanced modal

  
  //  Track manual mappings and save to localStorage


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

      //  Generate consistent ID based on file name only (no timestamp/random)
      // This way same file will have same ID across sessions
      const consistentId = `${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

      setFiles((prev) => [
        ...prev,
        {
          id: consistentId,
          name: file.name,
          binaryString,
          data,
          headers,
          hyperlinks,
          autoHeaderIndex,
        },
      ]);
    };

    reader.readAsBinaryString(file);
  });

  e.target.value = "";
};

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter(f => f.id !== fileId));
    
    // Clean up mappings related to this file
    const updatedMappings = { ...columnMappings };
    const updatedAuto = { ...autoMapped };
    const updatedManual = { ...manualMapped };
    const updatedPairs = { ...mergedPairsData };
    
    // Remove all mappings that start with this fileId
    Object.keys(updatedMappings).forEach(key => {
      if (key.startsWith(`${fileId}::`)) {
        delete updatedMappings[key];
        delete updatedAuto[key];
        delete updatedManual[key];
      }
    });
    
    // Remove from merged pairs
    Object.keys(updatedPairs).forEach(mergedColumn => {
      updatedPairs[mergedColumn] = updatedPairs[mergedColumn].filter(
        pair => !pair.key.startsWith(`${fileId}::`)
      );
      // If no pairs left for this merged column, remove it
      if (updatedPairs[mergedColumn].length === 0) {
        delete updatedPairs[mergedColumn];
      }
    });
    
    setColumnMappings(updatedMappings);
    setAutoMapped(updatedAuto);
    setManualMapped(updatedManual);
    setMergedPairsData(updatedPairs);
    saveMappingsToStorage(updatedManual);
    
    // If no files left, clear everything
    if (files.length === 1) {
      setMergedData(null);
      setColumnMappings({});
      setShowMergedPairs(false);
      setMergedPairsData({});
      setAutoMapped({});
      setManualMapped({});
      setHiddenColumns(new Set());
      setNumericColumn("");
      setNumericDelta(0);
      localStorage.removeItem('manualColumnMappings');
    }
  };

  //  Helper to detect if a row is a summary row 
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
    const firstValue = String(allValues[0] || "").trim();
    
    // Pattern: "1) Something...", "2) Something...", etc.
    if (/^\d+\)/.test(firstValue)) {
      return true;
    }
    
    // Check if row contains disclaimer-like text
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

    //  create complete mapping for all columns from all files
    const completeMappings = {};
    files.forEach((file) => {
      file.headers.forEach((header) => {
        const mappingKey = `${file.id}::${header}`;
        
        // If user has set a custom mapping, use it
        if (finalMappings && finalMappings[mappingKey]) {
          completeMappings[mappingKey] = finalMappings[mappingKey];
        } else {
          // Otherwise use standard name from synonyms
          completeMappings[mappingKey] = getStandardColumnName(header);
        }
      });
    });

    console.log("=== COMPLETE MAPPINGS ===");
    console.log(completeMappings);

    finalMappings = completeMappings;

    // Extract dimension mappings and regular mappings
    const dimensionMappings = {};
    const regularMappings = {};
   
    Object.keys(finalMappings).forEach((key) => {
      const value = finalMappings[key];
      
      if (typeof value === 'string' && value.includes('::DIMENSION::')) {
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

    // ✅ Collect ONLY the unique mapped column names
    const mappedHeaders = new Set();
    
    // Add regular column mappings
    Object.values(regularMappings).forEach((mappedName) => {
      if (mappedName && typeof mappedName === 'string' && !mappedName.includes('::DIMENSION::')) {
        mappedHeaders.add(mappedName);
      }
    });
    
    // Add dimension column names
    Object.keys(dimensionMappings).forEach((dimName) => {
      mappedHeaders.add(dimName);
    });

    console.log("=== MAPPED HEADERS (should be unique) ===");
    console.log(Array.from(mappedHeaders));

    const merged = [];
    const mergedHyperlinks = {};

    files.forEach((file) => {
      console.log(`\n=== Processing File: ${file.name} ===`);
      
      file.data.forEach((row, rIdx) => {
        // Skip Total, Average, and other summary rows
        if (isSummaryRow(row)) {
          return;
        }

        const mappedRow = {};

        // Initialize all mapped headers with empty strings
        Array.from(mappedHeaders).forEach((h) => {
          mappedRow[h] = "";
        });

        // Handle dimension columns
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
              const existingParts = mappedRow[dimName].split(separator).map(v => v.trim());
              if (values.length > existingParts.length) {
                mappedRow[dimName] = dimensionValue;
              }
            } else {
              mappedRow[dimName] = dimensionValue;
            }
          }
        });

        //  BUILD L*W*H INTO MEASUREMENT COLUMN
        let heightVal = "";
        let lwVal = "";

        Object.keys(row).forEach(col => {
          const v = row[col];
          if (!v) return;

          const lower = col.toLowerCase();

          if (lower.includes("height")) {
            heightVal = v;
          }

          if (String(v).includes("*") && !lower.includes("height")) {
            lwVal = v;
          }
        });

        if (lwVal && heightVal) {
          Object.keys(mappedRow).forEach(h => {
            if (h.toLowerCase().includes("measurement")) {
              mappedRow[h] = `${lwVal}*${heightVal}`;
            }
          });
        }

        // Handle regular columns
        Object.keys(row).forEach((originalColumn) => {
          const mappingKey = `${file.id}::${originalColumn}`;
          
          // Skip if this is a dimension column
          const isDimension = Object.keys(dimensionMappings).some((dimName) => {
            return dimensionMappings[dimName].some((dimCol) => 
              dimCol.fileId === file.id && dimCol.originalColumn === originalColumn
            );
          });
          
          if (!isDimension) {
            const mappedColumn = regularMappings[mappingKey];
            
            if (!mappedColumn) {
              console.warn(`⚠️ No mapping found for: ${mappingKey}`);
            }
            
            if (mappedColumn) {
              const value = row[originalColumn];
              
              if (value !== undefined && value !== null && value !== "") {
                if (mappedRow[mappedColumn] && mappedRow[mappedColumn] !== "") {
                  mappedRow[mappedColumn] = mappedRow[mappedColumn] + ", " + value;
                } else {
                  mappedRow[mappedColumn] = value;
                }
              }
            }
          }
        });

        //  Handle hyperlinks
        const linkRow = file.hyperlinks?.[rIdx] || {};
        const mappedLinkRow = {};

        Object.keys(linkRow).forEach((originalColumn) => {
          const mappingKey = `${file.id}::${originalColumn}`;
          const mappedColumn = regularMappings[mappingKey];
          
          if (mappedColumn && linkRow[originalColumn]) {
            mappedLinkRow[mappedColumn] = linkRow[originalColumn];
          }
        });

        mergedHyperlinks[merged.length] = mappedLinkRow;
        merged.push(mappedRow);
      });
    });

    //  Sr No continuous numbering after merge
    const srNoHeader = Array.from(mappedHeaders).find((h) => isSrNoColumn(h));
    console.log("=== SR NO HEADER FOUND ===", srNoHeader);
    
    if (srNoHeader) {
      let counter = 1;
      merged.forEach((row) => {
        row[srNoHeader] = counter;
        counter++;
      });
    }

    console.log("=== FINAL MERGED DATA HEADERS ===");
    console.log(Array.from(mappedHeaders));

    //  AUTO HIDE only Meas MM and Height columns 
    const autoHide = new Set(hiddenColumns);

    Array.from(mappedHeaders).forEach((h) => {
      const lower = h.toLowerCase();

      // Only hide Meas MM and Height 
      if (
        (lower.includes("meas") && lower.includes("mm")) ||
        lower === "height"
      ) {
        autoHide.add(h);
      }
    });

    setHiddenColumns(autoHide);

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


  //  Export with hyperlinks styling
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

            //  Style (blue + underline)
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
        />

        <div className={styles.content}>
{activeTab === "upload" && (
  <UploadSection
    files={files}
    onUpload={handleFileUpload}
    clearFiles={clearFiles}
    removeFile={removeFile}
    autoMapHeaders={autoMapHeaders}
    mergeFiles={mergeFiles}
    columnMappings={columnMappings}
    setColumnMappings={setColumnMappings}
    autoMapped={autoMapped}
    manualMapped={manualMapped}
    setManualMapped={setManualMapped}
    showMergedPairs={showMergedPairs}
    setShowMergedPairs={setShowMergedPairs}
    mergedPairsData={mergedPairsData}
    decombineMapping={decombineMapping}
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
              exportToExcel={exportToExcel}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}


import { useState } from "react";
import { Database, Download, Eye, EyeOff } from "lucide-react";
import styles from "./excelMerger.module.css";

export default function PreviewSection({
  mergedData,
  visibleHeaders,
  hiddenColumns,
  toggleColumn,
  removeEmptyColumns,
  numericColumn,
  setNumericColumn,
  numericDelta,
  setNumericDelta,
  applyNumericDelta,
  saveToDatabase,
  exportToExcel,
  loading,
}) {
  const [showSpecificColumnsOnly, setShowSpecificColumnsOnly] = useState(false);

  const specificColumns = [
    "Sr No",
    "Shape",
    "Weight",
    "Color",
    "Clarity",
    "Polish",
    "Symmetry",
    "Fluorescence",
    "Discount",
    "Measurement",
    "Depth",
    "Table",
    "Ratio",
    "Key To Symbols",
    "H&A",
    "Add Comments",
    "Luster"
  ];

  const toggleSpecificColumns = () => {
    setShowSpecificColumnsOnly(!showSpecificColumnsOnly);
  };

  const displayHeaders = showSpecificColumnsOnly
    ? specificColumns.filter(col => visibleHeaders.includes(col))
    : visibleHeaders;

  const handleColumnToggle = (header) => {
    if (showSpecificColumnsOnly) {
      return;
    }
    toggleColumn(header);
  };

  const getColumnButtonStyle = (header) => {
    if (showSpecificColumnsOnly) {
      const isKeyColumn = specificColumns.includes(header);
      return {
        background: isKeyColumn ? "#c6f6d5" : "#fed7d7",
        cursor: "not-allowed",
        opacity: 0.8
      };
    } else {
      return {
        background: hiddenColumns.has(header) ? "#fed7d7" : "#c6f6d5",
        cursor: "pointer"
      };
    }
  };

  return (
    <div>
      <div className={styles.previewTop}>
        <h3 className={styles.sectionTitle}>
          Merged Data ({mergedData.rows.length} rows)
        </h3>

        <div className={styles.previewButtons}>
          <button
            className={`${styles.button} ${styles.success}`}
            onClick={saveToDatabase}
            disabled={loading}
          >
            <Database size={18} />
            {loading ? "Saving..." : "Save to MongoDB"}
          </button>

          <button className={styles.button} onClick={() => exportToExcel()}>
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className={styles.controlsBox}>
        <div className={styles.controlsHeader}>
          <h4 style={{ margin: 0, fontWeight: 700 }}>Column Controls</h4>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              className={`${styles.button} ${showSpecificColumnsOnly ? styles.blue : styles.purple}`} 
              onClick={toggleSpecificColumns}
            >
              {showSpecificColumnsOnly ? <EyeOff size={18} /> : <Eye size={18} />}
              {showSpecificColumnsOnly ? "Show All Columns" : "Show Key Columns Only"}
            </button>
            <button 
              className={`${styles.button} ${styles.purple}`} 
              onClick={removeEmptyColumns}
            >
              Remove Empty Columns
            </button>
          </div>
        </div>

        {showSpecificColumnsOnly && (
          <div style={{ 
            marginTop: "10px", 
            padding: "10px", 
            backgroundColor: "#f7fafc", 
            borderRadius: "6px",
            fontSize: "14px"
          }}>
            <p style={{ margin: 0, color: "#4a5568" }}>
              <strong>Key Columns Mode:</strong> Showing only the 17 key columns (green). Column toggles are disabled in this mode.
            </p>
          </div>
        )}

        <div className={styles.columnButtons}>
          {mergedData.headers.map((h) => {
            const isKeyColumn = specificColumns.includes(h);
            const buttonStyle = getColumnButtonStyle(h);
            
            return (
              <button
                key={h}
                onClick={() => handleColumnToggle(h)}
                className={styles.colToggle}
                style={buttonStyle}
                disabled={showSpecificColumnsOnly}
              >
                {showSpecificColumnsOnly 
                  ? (isKeyColumn ? "✅ Key Column" : "❌ Hidden") 
                  : (hiddenColumns.has(h) ? "❌ Hidden" : "✅ Show")
                } : {h}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.controlsBoxLight}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Numeric Column Adjuster</h4>
        <p className={styles.helperTextSmall}>
          Example: Select <b>Rate</b> and set <b>+2</b> to increase every row rate by 2.
        </p>

        <div className={styles.numericRow}>
          <select
            value={numericColumn}
            onChange={(e) => setNumericColumn(e.target.value)}
            className={styles.input}
            style={{ maxWidth: 250 }}
          >
            <option value="">Select Column</option>
            {mergedData.headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={numericDelta}
            onChange={(e) => setNumericDelta(e.target.value)}
            className={styles.input}
            style={{ maxWidth: 180 }}
            placeholder="+2 or -5"
          />

          <button className={`${styles.button} ${styles.blue}`} onClick={applyNumericDelta}>
            Apply
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              {displayHeaders.map((header) => (
                <th key={header} className={styles.th}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {mergedData.rows.slice(0, 100).map((row, idx) => (
              <tr key={idx} className={styles.tr}>
                {displayHeaders.map((header) => {
                  const cellValue = row[header] || "-";
                  const link = mergedData?.hyperlinks?.[idx]?.[header];

                  return (
                    <td key={header} className={styles.td}>
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkCell}
                        >
                          {cellValue}
                        </a>
                      ) : (
                        cellValue
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
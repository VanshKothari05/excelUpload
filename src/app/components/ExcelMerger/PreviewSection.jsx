import { Database, Download } from "lucide-react";
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

      {/* Column Controls */}
      <div className={styles.controlsBox}>
        <div className={styles.controlsHeader}>
          <h4 style={{ margin: 0, fontWeight: 700 }}>Column Controls</h4>
          <button className={`${styles.button} ${styles.purple}`} onClick={removeEmptyColumns}>
            Remove Empty Columns
          </button>
        </div>

        <div className={styles.columnButtons}>
          {mergedData.headers.map((h) => (
            <button
              key={h}
              onClick={() => toggleColumn(h)}
              className={styles.colToggle}
              style={{
                background: hiddenColumns.has(h) ? "#fed7d7" : "#c6f6d5",
              }}
            >
              {hiddenColumns.has(h) ? "❌ Hidden" : "✅ Show"} : {h}
            </button>
          ))}
        </div>
      </div>

      {/* Numeric Column Adjuster */}
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

      {/* Preview Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              {visibleHeaders.map((header) => (
                <th key={header} className={styles.th}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {mergedData.rows.slice(0, 100).map((row, idx) => (
              <tr key={idx} className={styles.tr}>
                {visibleHeaders.map((header) => {
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

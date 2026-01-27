import { Upload, Trash2, Link2 } from "lucide-react";
import styles from "./excelMerger.module.css";

export default function UploadSection({
  files,
  onUpload,
  clearFiles,
  updateFileHeaderMode,
  updateManualHeaderIndex,
  showColumnMapping,
  initializeColumnMappings,
  autoMapHeaders, 
  getAllHeaders,
  columnMappings,
  updateColumnMapping,
  mergeFiles,
}) {
  return (
    <div>
      <div className={styles.uploadBox}>
        <Upload className={styles.uploadIcon} size={48} />
        <label className={styles.uploadLabel}>
          <span className={styles.uploadPrimary}>Click to upload</span>
          <span className={styles.uploadSecondary}> or drag and drop</span>
          <input
            type="file"
            multiple
            accept=".xlsx,.xls"
            onChange={onUpload}
            style={{ display: "none" }}
          />
        </label>
        <p className={styles.helperText}>Excel files only (.xlsx, .xls)</p>
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Uploaded Files ({files.length})</h3>
            <button className={`${styles.button} ${styles.danger}`} onClick={clearFiles}>
              <Trash2 size={18} />
              Clear All
            </button>
          </div>

          {files.map((file) => (
            <div key={file.id} className={styles.fileCard}>
              <p className={styles.fileName}>{file.name}</p>
              <p className={styles.fileMeta}>
                {file.data.length} rows, {file.headers.length} columns
              </p>

              {/* Auto / Manual Header Row Controls */}
              <div className={styles.headerRowControls}>
                <div className={styles.headerRowGroup}>
                  <label className={styles.labelStrong}>Header Mode:</label>
                  <select
                    value={file.mode}
                    onChange={(e) => updateFileHeaderMode(file.id, e.target.value)}
                    className={styles.input}
                    style={{ maxWidth: 160 }}
                  >
                    <option value="auto">Auto</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div className={styles.headerRowGroup}>
                  <label className={styles.labelStrong}>Header Row:</label>
                  <input
                    type="number"
                    min="1"
                    value={
                      (file.mode === "manual" ? file.manualHeaderIndex : file.autoHeaderIndex) + 1
                    }
                    disabled={file.mode !== "manual"}
                    onChange={(e) => updateManualHeaderIndex(file.id, Number(e.target.value) - 1)}
                    className={styles.input}
                    style={{
                      maxWidth: 120,
                      opacity: file.mode === "manual" ? 1 : 0.6,
                    }}
                  />
                </div>

                <div className={styles.autoDetected}>
                  Auto detected: Row {file.autoHeaderIndex + 1}
                </div>
              </div>

              <div className={styles.headerBadges}>
                {file.headers.map((h) => (
                  <span key={h} className={styles.badge}>
                    {h}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* ✅ Mapping Buttons */}
          {!showColumnMapping ? (
            <div style={{ display: "flex", gap: "12px", marginTop: "1rem", flexWrap: "wrap" }}>
              <button
                className={`${styles.button} ${styles.fullWidth}`}
                onClick={initializeColumnMappings}
                style={{ flex: 1 }}
              >
                <Link2 size={18} />
                Map Columns (Manual)
              </button>

              <button
                className={`${styles.button} ${styles.fullWidth}`}
                onClick={autoMapHeaders}
                style={{ flex: 1, background: "#38a169" }}
              >
                ✅ Auto Map Headers
              </button>
            </div>
          ) : (
            <div className={styles.mappingBox}>
              <h4 className={styles.mappingTitle}>
                Map Column Names (Combine columns by giving them the same name):
              </h4>
              <p className={styles.mappingTip}>
                💡 Tip: If "Sr No" and "Item No" should be the same, rename both to "Number"
              </p>

              {getAllHeaders().map((header) => (
                <div key={header} className={styles.mappingRow}>
                  <div style={{ flex: 1 }}>
                    <label className={styles.smallLabel}>Original Column:</label>
                    <div className={styles.originalCol}>{header}</div>
                  </div>

                  <div className={styles.arrow}>→</div>

                  <div style={{ flex: 1 }}>
                    <label className={styles.smallLabel}>Mapped To:</label>
                    <input
                      value={columnMappings[header] || ""}
                      onChange={(e) => updateColumnMapping(header, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className={styles.input}
                      placeholder="Enter column name"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className={`${styles.button} ${styles.fullWidth}`} onClick={mergeFiles}>
            Merge Files
          </button>
        </div>
      )}
    </div>
  );
}

import styles from "./uploadSection.module.css";

export default function UploadSection({
  files,
  onUpload,
  clearFiles,
  updateFileHeaderMode,
  updateManualHeaderIndex,
  openAdvancedMapping,
  autoMapHeaders,
  mergeFiles,
}) {
  return (
    <div className={styles.uploadSection}>
      {/* Upload Area */}
      <div className={styles.uploadArea}>
        <label htmlFor="fileInput" className={styles.uploadLabel}>
          <div className={styles.uploadIcon}>📁</div>
          <div className={styles.uploadText}>
            <strong>Click to upload</strong> or drag and drop
          </div>
          <div className={styles.uploadHint}>Excel files (.xlsx, .xls)</div>
        </label>
        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={onUpload}
          className={styles.fileInput}
        />
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className={styles.filesContainer}>
          <div className={styles.filesHeader}>
            <h3>📂 Uploaded Files ({files.length})</h3>
            <button onClick={clearFiles} className={styles.clearBtn}>
              🗑️ Clear All
            </button>
          </div>

          <div className={styles.filesList}>
            {files.map((file, idx) => (
              <div key={file.id} className={styles.fileCard}>
                <div className={styles.fileCardHeader}>
                  <span className={styles.fileNumber}>File {idx + 1}</span>
                  <span className={styles.fileName}>{file.name}</span>
                </div>

                <div className={styles.fileCardBody}>
                  {/* Header Detection Mode */}
                  <div className={styles.headerModeSection}>
                    <label className={styles.label}>Header Detection:</label>
                    <div className={styles.modeButtons}>
                      <button
                        onClick={() => updateFileHeaderMode(file.id, "auto")}
                        className={`${styles.modeBtn} ${
                          file.mode === "auto" ? styles.active : ""
                        }`}
                      >
                         Auto
                      </button>
                      <button
                        onClick={() => updateFileHeaderMode(file.id, "manual")}
                        className={`${styles.modeBtn} ${
                          file.mode === "manual" ? styles.active : ""
                        }`}
                      >
                         Manual
                      </button>
                    </div>
                  </div>

                  {/* Manual Header Row Selection */}
                  {file.mode === "manual" && (
                    <div className={styles.manualIndexSection}>
                      <label className={styles.label}>Header Row Index:</label>
                      <input
                        type="number"
                        min="0"
                        value={file.manualHeaderIndex}
                        onChange={(e) =>
                          updateManualHeaderIndex(file.id, e.target.value)
                        }
                        className={styles.numberInput}
                      />
                      <span className={styles.hint}>
                        (0 = first row, 1 = second row, etc.)
                      </span>
                    </div>
                  )}

                  {/* Headers Preview */}
                  <div className={styles.headersSection}>
                    <label className={styles.label}>
                      Detected Headers ({file.headers.length}):
                    </label>
                    <div className={styles.headersList}>
                      {file.headers.map((header, idx) => (
                        <span key={idx} className={styles.headerTag}>
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Data Preview */}
                  <div className={styles.dataPreview}>
                    <label className={styles.label}>
                      Data Rows: {file.data.length}
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mapping & Merge Actions */}
          <div className={styles.actionsSection}>
            <div className={styles.mappingButtons}>
              <button
                onClick={openAdvancedMapping}
                className={styles.advancedMapBtn}
              >
                🔗 Advanced Column Mapping
              </button>
              <button onClick={autoMapHeaders} className={styles.autoMapBtn}>
                ⚡ Auto-Map Similar Columns
              </button>
            </div>

            <button onClick={mergeFiles} className={styles.mergeBtn}>
              ✨ Merge Files
            </button>
          </div>

          {/* Info Box */}
          <div className={styles.infoBox}>
            <h4>💡 How Column Mapping Works:</h4>
            <ul>
              <li>
                <strong>Advanced Mapping:</strong> Manually map columns between files or merge them
              </li>
              <li>
                <strong>Auto-Map:</strong> Automatically detect and merge similar column names
              </li>
              <li>
                <strong>Direct Merge:</strong> Skip mapping and merge with original column names
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

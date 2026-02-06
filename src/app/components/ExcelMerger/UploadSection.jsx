// ============================
// UploadSection.jsx (FULL REPLACEMENT)
// ============================
import styles from "./uploadSection.module.css";
import { useState } from "react";

export default function UploadSection({
  files,
  onUpload,
  clearFiles,
  updateFileHeaderMode,
  updateManualHeaderIndex,
  autoMapHeaders,
  mergeFiles,
  columnMappings,
  setColumnMappings,
  autoMapped,
  manualMapped,
  setManualMapped
}) {
  const [dragItem, setDragItem] = useState(null);

  const onDragStart = (fileId, header) => {
    setDragItem({ fileId, header });
  };

  const onDrop = (targetFileId, targetHeader) => {
    if (!dragItem) return;

    const sourceKey = `${dragItem.fileId}::${dragItem.header}`;
    const targetKey = `${targetFileId}::${targetHeader}`;

    const option = prompt(
      `Map "${dragItem.header}" with "${targetHeader}"\n\nType:\n1 → keep first name\n2 → keep second name\n3 → custom name`
    );

    let finalName = targetHeader;

    if (option === "1") finalName = dragItem.header;
    else if (option === "2") finalName = targetHeader;
    else if (option === "3") {
      const custom = prompt("Enter custom merged column name");
      if (custom) finalName = custom;
    }

    setColumnMappings((prev) => ({
      ...prev,
      [sourceKey]: finalName,
      [targetKey]: finalName,
    }));

    // ✅ STEP 5 - Mark as manually mapped
    setManualMapped(prev => ({
      ...prev,
      [sourceKey]: true,
      [targetKey]: true
    }));

    setDragItem(null);
  };

  return (
    <div className={styles.uploadSection}>
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

      {files.length > 0 && (
        <div className={styles.filesContainer}>
          <div className={styles.filesHeader}>
            <h3>Uploaded Files ({files.length})</h3>
            <button onClick={clearFiles} className={styles.clearBtn}>
              Clear All
            </button>
          </div>
          
          <div style={{marginBottom:"8px",fontSize:"13px"}}>
            Drag & drop columns to merge manually
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.auto}`}></span>
              Auto mapped
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.manual}`}></span>
              Manual mapped
            </div>
          </div>

          <div className={styles.filesList}>
            {files.map((file, idx) => (
              <div key={file.id} className={styles.fileCard}>
                <div className={styles.fileCardHeader}>
                  File {idx + 1}: {file.name}
                </div>

                <div className={styles.headersList}>
                  {Array.isArray(file.headers) && file.headers.map((header) => {
                    const key = `${file.id}::${header}`;
                    const mapped = columnMappings?.[key];
                    
                    // ✅ STEP 6 - Color highlight logic
                    let highlight = "";

                    if (autoMapped[key]) highlight = styles.auto;
                    if (manualMapped[key]) highlight = styles.manual;

                    return (
                      <div
                        key={header}
                        draggable
                        onDragStart={() => onDragStart(file.id, header)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(file.id, header)}
                        className={`${styles.headerTag} ${highlight}`}
                        title="Drag to merge with another column"
                      >
                        {header}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actionsSection}>
            <button onClick={autoMapHeaders} className={styles.autoMapBtn}>
              ⚡ Auto Map Similar Columns
            </button>

            <button onClick={mergeFiles} className={styles.mergeBtn}>
              Merge Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

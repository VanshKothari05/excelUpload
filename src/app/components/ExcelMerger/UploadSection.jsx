import styles from "./uploadSection.module.css";
import { useState } from "react";

export default function UploadSection({
  files,
  onUpload,
  clearFiles,
  removeFile,
  autoMapHeaders,
  mergeFiles,
  columnMappings,
  setColumnMappings,
  autoMapped,
  manualMapped,
  setManualMapped,
  showMergedPairs,
  setShowMergedPairs,
  mergedPairsData,
  decombineMapping
}) {
  const [dragItem, setDragItem] = useState(null);
const [dragOverTarget, setDragOverTarget] = useState(null); ///
const onDragStart = (fileId, header) => {
  setDragItem({ fileId, header });
};

const onDragOverHeader = (fileId, header) => {
  setDragOverTarget(`${fileId}::${header}`);
};

const onDragLeaveHeader = () => {
  setDragOverTarget(null);
};

const onDrop = (targetFileId, targetHeader) => {
  setDragOverTarget(null);

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

  const updatedManual = {
    ...manualMapped,
    [sourceKey]: finalName,
    [targetKey]: finalName
  };

  setManualMapped(updatedManual);

  try {
    localStorage.setItem('manualColumnMappings', JSON.stringify(updatedManual));
  } catch (error) {
    console.error('Failed to save manual mapping:', error);
  }

  setDragItem(null);
}; ///

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

          {/* ✅ NEW: Show uploaded file names with individual remove buttons */}
          <div className={styles.uploadedFilesList}>
            {files.map((file, idx) => (
              <div key={file.id} className={styles.uploadedFileItem}>
                <span className={styles.fileIcon}>📄</span>
                <span className={styles.fileNameText}>{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className={styles.removeFileBtn}
                  title="Remove this file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div style={{marginBottom:"8px",fontSize:"13px"}}>
            Drag & drop columns to merge manually
          </div>

          {/*  Legend + Show Merged Pairs button side by side */}
          <div className={styles.legendRow}>
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

            {/* Show Merged Pairs button next to legend */}
            {Object.keys(mergedPairsData).length > 0 && (
              <button 
                onClick={() => setShowMergedPairs(!showMergedPairs)} 
                className={styles.showPairsBtnCompact}
              >
                {showMergedPairs ? '▼' : '▶'} View Pairs ({Object.keys(mergedPairsData).length})
              </button>
            )}
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
                    
                    let highlight = "";

                    if (autoMapped[key]) highlight = styles.auto;
                    if (manualMapped[key]) highlight = styles.manual;

                    return (
<div
  key={header}
  draggable
  onDragStart={() => onDragStart(file.id, header)}
  onDragOver={(e) => {
    e.preventDefault();
    onDragOverHeader(file.id, header);
  }}
  onDragLeave={onDragLeaveHeader}
  onDrop={() => onDrop(file.id, header)}
  className={`
    ${styles.headerTag} 
    ${highlight}
    ${dragOverTarget === `${file.id}::${header}` ? styles.dragTarget : ""}
  `}
>
  {header}

  {/*  Arrow indicator */}
  {dragOverTarget === `${file.id}::${header}` && dragItem && (
    <span className={styles.dropArrow}>⬇ Drop Here</span>
  )}
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

          {/*  Merged Pairs with ONE cross per group */}
          {showMergedPairs && Object.keys(mergedPairsData).length > 0 && (
            <div className={styles.mergedPairsSection}>
              <div className={styles.mergedPairsList}>
                {Object.keys(mergedPairsData).map((mergedColumn) => (
                  <div key={mergedColumn} className={styles.pairGroup}>
                    <div className={styles.pairGroupHeader}>
                      <strong>→ {mergedColumn}</strong>
                      {/* ✅ FIXED: Call decombineMapping directly with only mergedColumn */}
                      <button
                        onClick={() => decombineMapping(mergedColumn)}
                        className={styles.removeGroupBtn}
                        title="Remove entire merged group"
                      >
                        ✕
                      </button>
                    </div>
                    <div className={styles.pairItems}>
                      {mergedPairsData[mergedColumn].map((pair, idx) => (
                        <div key={idx} className={styles.pairItem}>
                          <div className={styles.pairInfo}>
                            <span className={styles.pairFileName}>{pair.fileName}</span>
                            <span className={styles.pairArrow}>→</span>
                            <span className={styles.pairOriginal}>{pair.originalHeader}</span>
                            {pair.isManual && (
                              <span className={styles.manualBadge}>Manual</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
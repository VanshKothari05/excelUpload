import styles from "./uploadSection.module.css";
import { useState, useEffect } from "react";

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
  setMergedPairsData,
  decombineMapping,
  saveMappingsToStorage
}) {
  const [dragItem, setDragItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // ✅ NEW: Success notification state
  const [successNotification, setSuccessNotification] = useState(null);

  // ✅ Auto-hide notification after 3-4 seconds
  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => {
        setSuccessNotification(null);
      }, 3500); // 3.5 seconds

      return () => clearTimeout(timer);
    }
  }, [successNotification]);

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

    // If user cancels the prompt, exit
    if (option === null) {
      setDragItem(null);
      return;
    }

    let finalName = targetHeader;

    if (option === "1") finalName = dragItem.header;
    else if (option === "2") finalName = targetHeader;
    else if (option === "3") {
      const custom = prompt("Enter custom merged column name");
      if (custom && custom.trim()) {
        finalName = custom.trim();
      } else {
        // If cancelled or empty, exit
        setDragItem(null);
        return;
      }
    }

    // Update column mappings
    setColumnMappings((prev) => ({
      ...prev,
      [sourceKey]: finalName,
      [targetKey]: finalName,
    }));

    // Update manual mapped state
    const updatedManual = {
      ...manualMapped,
      [sourceKey]: finalName,
      [targetKey]: finalName
    };

    setManualMapped(updatedManual);

    // ✅ INSTANT UPDATE: Add to mergedPairsData immediately
    setMergedPairsData((prev) => {
      const updated = { ...prev };
      
      // Get file names
      const sourceFile = files.find(f => f.id === dragItem.fileId);
      const targetFile = files.find(f => f.id === targetFileId);
      
      if (!sourceFile || !targetFile) return prev;
      
      // Initialize array for this merged column if it doesn't exist
      if (!updated[finalName]) {
        updated[finalName] = [];
      }
      
      // Check if source key already exists
      const sourceExists = updated[finalName].some(p => p.key === sourceKey);
      if (!sourceExists) {
        updated[finalName].push({
          key: sourceKey,
          fileName: sourceFile.name,
          originalHeader: dragItem.header,
          isManual: true
        });
      } else {
        // Update existing entry to mark as manual
        updated[finalName] = updated[finalName].map(p =>
          p.key === sourceKey ? { ...p, isManual: true } : p
        );
      }
      
      // Check if target key already exists
      const targetExists = updated[finalName].some(p => p.key === targetKey);
      if (!targetExists) {
        updated[finalName].push({
          key: targetKey,
          fileName: targetFile.name,
          originalHeader: targetHeader,
          isManual: true
        });
      } else {
        // Update existing entry to mark as manual
        updated[finalName] = updated[finalName].map(p =>
          p.key === targetKey ? { ...p, isManual: true } : p
        );
      }
      
      return updated;
    });

    // Save to localStorage using provided function
    saveMappingsToStorage(updatedManual);

    setDragItem(null);
  };

  // ✅ NEW: Handle delete with success notification
  const handleDecombine = (mergedColumnName) => {
    const result = decombineMapping(mergedColumnName);
    
    // If decombineMapping returned a value (merged column name), show success notification
    if (result) {
      setSuccessNotification(`Mapping "${result}" removed successfully!`);
    }
  };

  return (
    <div className={styles.uploadSection}>
      {/* ✅ NEW: Success notification banner */}
      {successNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#48bb78',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideIn 0.3s ease-out',
          maxWidth: '400px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ color: '#48bb78', fontSize: '18px', fontWeight: 'bold' }}>✓</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', marginBottom: '2px' }}>Success!</div>
            <div style={{ fontSize: '14px', opacity: 0.95 }}>{successNotification}</div>
          </div>
          {/* Progress bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: 'rgba(255,255,255,0.4)',
            width: '100%',
            borderRadius: '0 0 8px 8px'
          }}>
            <div style={{
              height: '100%',
              background: 'white',
              borderRadius: '0 0 8px 8px',
              animation: 'progressBar 3.5s linear forwards'
            }}></div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes progressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>

      <div className={styles.uploadArea}>
        <label htmlFor="fileInput" className={styles.uploadLabel}>
          <div className={styles.uploadIcon}>📁</div>
          <div className={styles.uploadText}>
            <strong>Click to upload</strong> or drag and drop
          </div>
          <div className={styles.uploadHint}>Excel & CSV files (.xlsx, .xls, .csv)</div>
        </label>
        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
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

          {/*  Legend */}
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

          {/*  Merged Pairs - ALWAYS VISIBLE with dynamic grid layout */}
          {Object.keys(mergedPairsData).length > 0 && (
            <div className={styles.mergedPairsSection}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#2d3748' }}>
                Merged Column Pairs ({Object.keys(mergedPairsData).length})
              </h4>
              <div className={styles.mergedPairsGrid}>
                {Object.keys(mergedPairsData).map((mergedColumn) => (
                  <div key={mergedColumn} className={styles.pairGroup}>
                    <div className={styles.pairGroupHeader}>
                      <strong>→ {mergedColumn}</strong>
                      {/* ✅ Use handleDecombine instead of direct call */}
                      <button
                        onClick={() => handleDecombine(mergedColumn)}
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
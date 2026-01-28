import { useState, useEffect } from "react";
import styles from "./columnMappingModal.module.css";

export default function ColumnMappingModal({ files, columnMappings, onApply, onCancel }) {
  const [mappingRules, setMappingRules] = useState([]);
  const [finalMappings, setFinalMappings] = useState({});

  useEffect(() => {
    // Initialize with existing mappings or create default
    const initial = {};
    files.forEach((file) => {
      file.headers.forEach((header) => {
        const key = `${file.id}::${header}`;
        initial[key] = columnMappings[key] || header;
      });
    });
    setFinalMappings(initial);
  }, [files, columnMappings]);

  // Add a mapping rule
  const addMappingRule = () => {
    if (files.length < 1) {
      alert("Need at least 1 file to create mapping rules");
      return;
    }

    setMappingRules([
      ...mappingRules,
      {
        id: Date.now(),
        sourceFile: files[0].id,
        sourceColumn: files[0].headers[0] || "",
        targetFile: files.length > 1 ? files[1].id : files[0].id,
        targetColumn: files.length > 1 ? (files[1].headers[0] || "") : (files[0].headers[1] || ""),
        action: "merge-to-new",
        customName: "",
        dimensionMode: false, // New: for dimension merging
        separator: "×", // New: separator for dimensions
        additionalColumns: [], // New: for adding more dimension columns
      },
    ]);
  };

  // Update a mapping rule
  const updateRule = (ruleId, field, value) => {
    setMappingRules(
      mappingRules.map((rule) =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    );
  };

  // Add an additional column to dimension merge
  const addDimensionColumn = (ruleId) => {
    setMappingRules(
      mappingRules.map((rule) => {
        if (rule.id !== ruleId) return rule;
        
        return {
          ...rule,
          additionalColumns: [
            ...rule.additionalColumns,
            {
              id: Date.now() + Math.random(),
              fileId: files[0].id,
              column: files[0].headers[0] || "",
            },
          ],
        };
      })
    );
  };

  // Update an additional dimension column
  const updateAdditionalColumn = (ruleId, columnId, field, value) => {
    setMappingRules(
      mappingRules.map((rule) => {
        if (rule.id !== ruleId) return rule;
        
        return {
          ...rule,
          additionalColumns: rule.additionalColumns.map((col) =>
            col.id === columnId ? { ...col, [field]: value } : col
          ),
        };
      })
    );
  };

  // Remove an additional dimension column
  const removeAdditionalColumn = (ruleId, columnId) => {
    setMappingRules(
      mappingRules.map((rule) => {
        if (rule.id !== ruleId) return rule;
        
        return {
          ...rule,
          additionalColumns: rule.additionalColumns.filter((col) => col.id !== columnId),
        };
      })
    );
  };

  // Remove a mapping rule
  const removeRule = (ruleId) => {
    setMappingRules(mappingRules.filter((rule) => rule.id !== ruleId));
  };

  // Apply a specific mapping rule
  const applyRule = (rule) => {
    const sourceKey = `${rule.sourceFile}::${rule.sourceColumn}`;
    const targetKey = `${rule.targetFile}::${rule.targetColumn}`;

    const updated = { ...finalMappings };

    if (rule.dimensionMode && rule.customName) {
      // ✅ DIMENSION MERGE MODE: L × W × H format
      const sep = rule.separator || "×";
      updated[sourceKey] = `${rule.customName}::DIMENSION::${rule.sourceColumn}::${sep}::0`;
      updated[targetKey] = `${rule.customName}::DIMENSION::${rule.targetColumn}::${sep}::1`;
      
      // Add additional columns (like Height)
      rule.additionalColumns.forEach((col, index) => {
        const colKey = `${col.fileId}::${col.column}`;
        updated[colKey] = `${rule.customName}::DIMENSION::${col.column}::${sep}::${index + 2}`;
      });
      
    } else if (rule.action === "merge-to-new" && rule.customName) {
      // Regular merge to new custom name
      updated[sourceKey] = rule.customName;
      updated[targetKey] = rule.customName;
    } else if (rule.action === "map-source-to-target") {
      // Map source column to target column name
      updated[sourceKey] = rule.targetColumn;
    } else if (rule.action === "map-target-to-source") {
      // Map target column to source column name
      updated[targetKey] = rule.sourceColumn;
    }

    setFinalMappings(updated);
  };

  // Apply all rules at once
  const applyAllRules = () => {
    mappingRules.forEach((rule) => applyRule(rule));
  };

  // Handle manual column name change
  const handleColumnNameChange = (fileId, originalHeader, newName) => {
    const key = `${fileId}::${originalHeader}`;
    setFinalMappings({
      ...finalMappings,
      [key]: newName,
    });
  };

  // Get file by ID
  const getFile = (fileId) => files.find((f) => f.id === fileId);

  // Apply and close
  const handleApply = () => {
    onApply(finalMappings);
  };

  // Get available columns for a file
  const getFileColumns = (fileId) => {
    const file = getFile(fileId);
    return file ? file.headers : [];
  };

  // Get display name for mapped column
  const getMappedDisplayName = (mappedName) => {
    if (typeof mappedName === 'string' && mappedName.includes('::DIMENSION::')) {
      const parts = mappedName.split('::');
      return `${parts[0]} (Dimension)`;
    }
    return mappedName;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>🔗 Advanced Column Mapping</h2>
          <button onClick={onCancel} className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Files Overview Section */}
          <div className={styles.filesSection}>
            <h3>📁 Files & Their Columns</h3>
            <div className={styles.filesGrid}>
              {files.map((file, idx) => (
                <div key={file.id} className={styles.fileCard}>
                  <div className={styles.fileCardHeader}>
                    <span className={styles.fileNumber}>File {idx + 1}</span>
                    <span className={styles.fileName}>{file.name}</span>
                  </div>
                  <div className={styles.columnsTable}>
                    {file.headers.map((header) => {
                      const key = `${file.id}::${header}`;
                      const mappedName = finalMappings[key] || header;
                      const displayName = getMappedDisplayName(mappedName);
                      const isChanged = mappedName !== header;

                      return (
                        <div key={header} className={styles.columnRow}>
                          <div className={styles.originalColumn}>
                            {header}
                          </div>
                          <div className={styles.arrow}>→</div>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) =>
                              handleColumnNameChange(file.id, header, e.target.value)
                            }
                            className={`${styles.mappedColumn} ${
                              isChanged ? styles.changed : ""
                            }`}
                            placeholder="Output column name"
                            disabled={typeof mappedName === 'string' && mappedName.includes('::DIMENSION::')}
                            title={typeof mappedName === 'string' && mappedName.includes('::DIMENSION::') ? 'This column is part of a dimension merge rule' : ''}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapping Rules Section */}
          {files.length >= 1 && (
            <div className={styles.rulesSection}>
              <div className={styles.rulesHeader}>
                <h3>⚙️ Quick Mapping Rules</h3>
                <button onClick={addMappingRule} className={styles.addBtn}>
                  ➕ Add Rule
                </button>
              </div>

              {mappingRules.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No mapping rules yet. Click "Add Rule" to create one.</p>
                  <p className={styles.hint}>
                    💡 Use rules to quickly map columns like "ID" → "Packet No" or merge "Length × Width × Height" into "Dimension"
                  </p>
                </div>
              ) : (
                <div className={styles.rulesList}>
                  {mappingRules.map((rule) => (
                    <div key={rule.id} className={styles.ruleCard}>
                      <div className={styles.ruleRow}>
                        {/* Source File */}
                        <div className={styles.ruleField}>
                          <label>Source File</label>
                          <select
                            value={rule.sourceFile}
                            onChange={(e) => updateRule(rule.id, "sourceFile", e.target.value)}
                            className={styles.select}
                          >
                            {files.map((file, idx) => (
                              <option key={file.id} value={file.id}>
                                File {idx + 1}: {file.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Source Column */}
                        <div className={styles.ruleField}>
                          <label>Source Column</label>
                          <select
                            value={rule.sourceColumn}
                            onChange={(e) => updateRule(rule.id, "sourceColumn", e.target.value)}
                            className={styles.select}
                          >
                            {getFileColumns(rule.sourceFile).map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Action */}
                        <div className={styles.ruleField}>
                          <label>Action</label>
                          <select
                            value={rule.action}
                            onChange={(e) => updateRule(rule.id, "action", e.target.value)}
                            className={styles.select}
                          >
                            <option value="merge-to-new">Merge to New Column</option>
                            <option value="map-source-to-target">Map Source → Target</option>
                            <option value="map-target-to-source">Map Target → Source</option>
                          </select>
                        </div>

                        {/* Target File */}
                        <div className={styles.ruleField}>
                          <label>Target File</label>
                          <select
                            value={rule.targetFile}
                            onChange={(e) => updateRule(rule.id, "targetFile", e.target.value)}
                            className={styles.select}
                          >
                            {files.map((file, idx) => (
                              <option key={file.id} value={file.id}>
                                File {idx + 1}: {file.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Target Column */}
                        <div className={styles.ruleField}>
                          <label>Target Column</label>
                          <select
                            value={rule.targetColumn}
                            onChange={(e) => updateRule(rule.id, "targetColumn", e.target.value)}
                            className={styles.select}
                          >
                            {getFileColumns(rule.targetFile).map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Custom Name (for merge action) */}
                        {rule.action === "merge-to-new" && (
                          <div className={styles.ruleField}>
                            <label>New Column Name</label>
                            <input
                              type="text"
                              value={rule.customName}
                              onChange={(e) =>
                                updateRule(rule.id, "customName", e.target.value)
                              }
                              placeholder="e.g., Dimension"
                              className={styles.input}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className={styles.ruleActions}>
                          {/* ✅ Dimension Mode Toggle Button */}
                          {rule.action === "merge-to-new" && (
                            <button
                              onClick={() => updateRule(rule.id, "dimensionMode", !rule.dimensionMode)}
                              className={`${styles.dimensionToggleBtn} ${rule.dimensionMode ? styles.active : ''}`}
                              title="Enable dimension format (L × W × H)"
                            >
                              📐
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              applyRule(rule);
                              alert("Rule applied! Check the file tables above.");
                            }}
                            className={styles.applyRuleBtn}
                            title="Apply this rule"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => removeRule(rule.id)}
                            className={styles.removeBtn}
                            title="Remove this rule"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* ✅ Collapsible Dimension Settings */}
                      {rule.dimensionMode && rule.action === "merge-to-new" && (
                        <div className={styles.dimensionSettings}>
                          <div className={styles.dimensionHeader}>
                            <span>📐 Dimension Format Settings</span>
                          </div>
                          
                          <div className={styles.dimensionControls}>
                            <div className={styles.separatorField}>
                              <label>Separator:</label>
                              <select
                                value={rule.separator || "×"}
                                onChange={(e) => updateRule(rule.id, "separator", e.target.value)}
                                className={styles.separatorSelect}
                              >
                                <option value="×">× (times)</option>
                                <option value="*">* (asterisk)</option>
                                <option value="x">x (lowercase)</option>
                                <option value="X">X (uppercase)</option>
                                <option value=" × "> × (spaced)</option>
                                <option value=" * "> * (spaced)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ✅ NEW: Additional Dimension Columns */}
                      {rule.dimensionMode && rule.action === "merge-to-new" && (
                        <div className={styles.additionalDimensions}>
                          <div className={styles.additionalHeader}>
                            <span>Additional Dimensions (e.g., Height):</span>
                            <button
                              onClick={() => addDimensionColumn(rule.id)}
                              className={styles.addDimBtn}
                            >
                              ➕ Add Column
                            </button>
                          </div>
                          
                          {rule.additionalColumns && rule.additionalColumns.map((col, idx) => (
                            <div key={col.id} className={styles.dimensionRow}>
                              <span className={styles.dimLabel}>Column {idx + 3}:</span>
                              
                              <select
                                value={col.fileId}
                                onChange={(e) =>
                                  updateAdditionalColumn(rule.id, col.id, "fileId", e.target.value)
                                }
                                className={styles.selectSmall}
                              >
                                {files.map((file, fidx) => (
                                  <option key={file.id} value={file.id}>
                                    File {fidx + 1}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={col.column}
                                onChange={(e) =>
                                  updateAdditionalColumn(rule.id, col.id, "column", e.target.value)
                                }
                                className={styles.selectSmall}
                              >
                                {getFileColumns(col.fileId).map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => removeAdditionalColumn(rule.id, col.id)}
                                className={styles.removeDimBtn}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rule Explanation */}
                      <div className={styles.ruleExplanation}>
                        {rule.dimensionMode && rule.customName && (
                          <span>
                            📐 Merging dimensions: "<strong>{rule.sourceColumn}</strong>" {rule.separator} "
                            <strong>{rule.targetColumn}</strong>"
                            {rule.additionalColumns && rule.additionalColumns.map((col) => (
                              <span key={col.id}> {rule.separator} "<strong>{col.column}</strong>"</span>
                            ))}
                            {' '}→ "<strong>{rule.customName}</strong>"
                          </span>
                        )}
                        {!rule.dimensionMode && rule.action === "merge-to-new" && rule.customName && (
                          <span>
                            📌 Merging "<strong>{rule.sourceColumn}</strong>" and "
                            <strong>{rule.targetColumn}</strong>" → "
                            <strong>{rule.customName}</strong>"
                          </span>
                        )}
                        {rule.action === "map-source-to-target" && (
                          <span>
                            📌 Mapping "<strong>{rule.sourceColumn}</strong>" → "
                            <strong>{rule.targetColumn}</strong>"
                          </span>
                        )}
                        {rule.action === "map-target-to-source" && (
                          <span>
                            📌 Mapping "<strong>{rule.targetColumn}</strong>" → "
                            <strong>{rule.sourceColumn}</strong>"
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mappingRules.length > 0 && (
                <button onClick={applyAllRules} className={styles.applyAllBtn}>
                  ✓ Apply All Rules
                </button>
              )}
            </div>
          )}

          {/* Helper Text */}
          <div className={styles.helperText}>
            <h4>💡 How to use:</h4>
            <ul>
              <li>
                <strong>Direct editing:</strong> Change output column names directly in the tables above
              </li>
              <li>
                <strong>Dimension Format:</strong> Enable to merge columns like "Length × Width × Height" into "Dimension" (e.g., 10 × 5 × 3)
              </li>
              <li>
                <strong>Merge to new:</strong> Combine columns from different files into one (e.g., ID + Packet No → Sr No)
              </li>
              <li>
                <strong>Map Source → Target:</strong> Rename File 1's column to match File 2's name
              </li>
              <li>
                <strong>Map Target → Source:</strong> Rename File 2's column to match File 1's name
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleApply} className={styles.applyBtn}>
            Apply Mapping & Merge
          </button>
        </div>
      </div>
    </div>
  );
}
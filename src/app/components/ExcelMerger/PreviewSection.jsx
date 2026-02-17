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
  exportToExcel,
  loading,
  showSpecificColumnsOnly,
  setShowSpecificColumnsOnly,
  originalHiddenColumns,
  setOriginalHiddenColumns,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
}) {
  
  // ✅ Calculate pagination values
  const totalRows = mergedData.rows.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const paginatedRows = mergedData.rows.slice(startIndex, endIndex);
  
  // ✅ Handle page changes
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // ✅ Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const specificColumns = [
    "Sr No",
    "Shape",
    "Weight",
    "Color",
    "Clarity",
    "Polish",
    "Symmetry",
    "Fluro",
    "Discount",
    "Measurement",
    "Depth",
    "Table",
    "Ratio",
    "Key To Symbols",
    "Add Comments",
    "Luster"
  ];

  // ✅ NEW: Helper function to check if a column contains numeric data
  const isNumericColumn = (columnName) => {
    if (!mergedData || !mergedData.rows) return false;
    
    // Check first 10 non-empty values to determine if column is numeric
    let numericCount = 0;
    let totalChecked = 0;
    
    for (let i = 0; i < mergedData.rows.length && totalChecked < 10; i++) {
      const value = mergedData.rows[i][columnName];
      
      // Skip empty values
      if (value === null || value === undefined || String(value).trim() === "") {
        continue;
      }
      
      totalChecked++;
      const num = Number(value);
      
      // Check if it's a valid number
      if (!isNaN(num) && isFinite(num)) {
        numericCount++;
      }
    }
    
    // If at least 80% of checked values are numeric, consider it a numeric column
    return totalChecked > 0 && (numericCount / totalChecked) >= 0.8;
  };

  // ✅ NEW: Get only numeric columns for the dropdown
  const getNumericColumns = () => {
    if (!mergedData) return [];
    
    return mergedData.headers.filter(header => isNumericColumn(header));
  };

  const toggleSpecificColumns = () => {
    const newMode = !showSpecificColumnsOnly;
    setShowSpecificColumnsOnly(newMode);
    
    if (newMode) {
      // Entering "Key Columns Only" mode
      // Save the current hidden columns state
      setOriginalHiddenColumns(new Set(hiddenColumns));
      
      // Hide all non-key columns
      mergedData.headers.forEach((header) => {
        const isKeyColumn = specificColumns.includes(header);
        const isCurrentlyHidden = hiddenColumns.has(header);
        
        if (!isKeyColumn && !isCurrentlyHidden) {
          // Hide non-key columns
          toggleColumn(header);
        }
      });
    } else {
      // Exiting "Key Columns Only" mode - restore original state
      mergedData.headers.forEach((header) => {
        const isCurrentlyHidden = hiddenColumns.has(header);
        const shouldBeHidden = originalHiddenColumns.has(header);
        
        // If current state doesn't match original state, toggle it
        if (isCurrentlyHidden !== shouldBeHidden) {
          toggleColumn(header);
        }
      });
    }
  };

  const displayHeaders = visibleHeaders;

  const handleColumnToggle = (header) => {
    toggleColumn(header);
  };

  const getColumnButtonStyle = (header) => {
    const isHidden = hiddenColumns.has(header);
    const isKeyColumn = specificColumns.includes(header);
    
    if (showSpecificColumnsOnly) {
      // In key columns mode, add visual distinction
      if (isKeyColumn) {
        return {
          background: isHidden ? "#fed7d7" : "#c6f6d5",
          cursor: "pointer",
          border: "2px solid #38a169",
          fontWeight: "600"
        };
      } else {
        return {
          background: isHidden ? "#fed7d7" : "#bee3f8",
          cursor: "pointer",
          opacity: isHidden ? 0.7 : 1
        };
      }
    } else {
      return {
        background: isHidden ? "#fed7d7" : "#c6f6d5",
        cursor: "pointer"
      };
    }
  };

  return (
    <div>
      <div className={styles.previewTop}>
        <h3 className={styles.sectionTitle}>
          Merged Data ({totalRows} rows total)
          <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '10px', color: '#666' }}>
            Showing {startIndex + 1}-{endIndex} of {totalRows}
          </span>
        </h3>

        <div className={styles.previewButtons}>
          <button className={styles.button} onClick={() => exportToExcel()}>
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>
      
      {/* ✅ NEW: Rows per page selector */}
      <div style={{ 
        marginBottom: '15px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        fontSize: '14px'
      }}>
        <label style={{ fontWeight: 600 }}>Rows per page:</label>
        <select
          value={rowsPerPage}
          onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
          className={styles.input}
          style={{ maxWidth: 120, padding: '6px' }}
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={250}>250</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
          <option value={totalRows}>All ({totalRows})</option>
        </select>
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
              <strong>Key Columns Mode:</strong> The 16  key columns are shown with green borders and are visible by default. 
              Other columns are hidden (red) but you can click any to make them visible (green) in the table. 
              Clicking "Show All Columns" will restore your original column settings.
            </p>
          </div>
        )}

        <div className={styles.columnButtons}>
          {mergedData.headers.map((h) => {
            const isKeyColumn = specificColumns.includes(h);
            const isHidden = hiddenColumns.has(h);
            const buttonStyle = getColumnButtonStyle(h);
            
            return (
              <button
                key={h}
                onClick={() => handleColumnToggle(h)}
                className={styles.colToggle}
                style={buttonStyle}
              >
                {isHidden ? "❌ Hidden" : "✅ Show"} : {h}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.controlsBoxLight}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Numeric Column Adjuster</h4>
        <p className={styles.helperTextSmall}>
          Example: Select <b>Rate</b> and set <b>+2</b> to increase every row rate by 2. Only numeric columns are shown.
        </p>

        <div className={styles.numericRow}>
          <select
            value={numericColumn}
            onChange={(e) => setNumericColumn(e.target.value)}
            className={styles.input}
            style={{ maxWidth: 250 }}
          >
            <option value="">Select Numeric Column</option>
            {/* ✅ CHANGED: Only show numeric columns */}
            {getNumericColumns().map((h) => (
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
            {paginatedRows.map((row, idx) => {
              const actualRowIndex = startIndex + idx; // Get actual row index for hyperlinks
              return (
                <tr key={actualRowIndex} className={styles.tr}>
                  {displayHeaders.map((header) => {
                    const cellValue = row[header] || "-";
                    const link = mergedData?.hyperlinks?.[actualRowIndex]?.[header];

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
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* ✅ NEW: Pagination controls */}
      {totalPages > 1 && (
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className={styles.button}
            style={{
              padding: '8px 12px',
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            First
          </button>
          
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.button}
            style={{
              padding: '8px 12px',
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          {/* Page numbers */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {(() => {
              const pages = [];
              const maxPagesToShow = 7;
              let startPage = Math.max(1, currentPage - 3);
              let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
              
              // Adjust start if we're near the end
              if (endPage - startPage < maxPagesToShow - 1) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
              }
              
              // Show first page if not in range
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => goToPage(1)}
                    className={styles.button}
                    style={{
                      padding: '8px 12px',
                      minWidth: '40px',
                      background: '#e2e8f0'
                    }}
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(<span key="ellipsis1" style={{ padding: '0 5px' }}>...</span>);
                }
              }
              
              // Show page numbers in range
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={styles.button}
                    style={{
                      padding: '8px 12px',
                      minWidth: '40px',
                      background: currentPage === i ? '#4299e1' : '#e2e8f0',
                      color: currentPage === i ? 'white' : 'black',
                      fontWeight: currentPage === i ? 'bold' : 'normal'
                    }}
                  >
                    {i}
                  </button>
                );
              }
              
              // Show last page if not in range
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(<span key="ellipsis2" style={{ padding: '0 5px' }}>...</span>);
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => goToPage(totalPages)}
                    className={styles.button}
                    style={{
                      padding: '8px 12px',
                      minWidth: '40px',
                      background: '#e2e8f0'
                    }}
                  >
                    {totalPages}
                  </button>
                );
              }
              
              return pages;
            })()}
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.button}
            style={{
              padding: '8px 12px',
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
          
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className={styles.button}
            style={{
              padding: '8px 12px',
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Last
          </button>
          
          {/* Page jump input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
            <span style={{ fontSize: '14px' }}>Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  goToPage(page);
                }
              }}
              className={styles.input}
              style={{ width: '70px', padding: '6px', textAlign: 'center' }}
            />
            <span style={{ fontSize: '14px', color: '#666' }}>of {totalPages}</span>
          </div>
        </div>
      )}
    </div>
  );
}
import { Database, Download, Trash2 } from "lucide-react";
import styles from "./excelMerger.module.css";

export default function DatabaseSection({ savedRecords, exportToExcel, deleteRecordFromDB }) {
  return (
    <div>
      <h3 className={styles.sectionTitle} style={{ marginBottom: "1rem" }}>
        Saved Records
      </h3>

      {savedRecords.length > 0 ? (
        savedRecords.map((record) => (
          <div key={record._id} className={styles.fileCard} style={{ marginBottom: "1rem" }}>
            <div className={styles.dbRow}>
              <div>
                <p className={styles.fileName}>Record #{record._id}</p>

                <p className={styles.fileMeta}>
                  {new Date(record.timestamp).toLocaleString()}
                </p>

                <p className={styles.fileMeta}>
                  {record.data.rows.length} rows from {record.fileCount} files
                </p>
              </div>

              <div className={styles.dbButtons}>
                <button className={styles.button} onClick={() => exportToExcel(record.data)}>
                  <Download size={16} />
                  Export
                </button>

                <button
                  className={`${styles.button} ${styles.danger}`}
                  onClick={() => deleteRecordFromDB(record._id)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className={styles.emptyDB}>
          <Database size={48} />
          <p>No saved records yet.</p>
        </div>
      )}
    </div>
  );
}

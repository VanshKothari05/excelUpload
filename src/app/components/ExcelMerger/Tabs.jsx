import styles from "./excelMerger.module.css";

export default function Tabs({ activeTab, setActiveTab, savedCount }) {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === "upload" ? styles.activeTab : ""}`}
        onClick={() => setActiveTab("upload")}
      >
        Upload & Merge
      </button>

      <button
        className={`${styles.tab} ${activeTab === "preview" ? styles.activeTab : ""}`}
        onClick={() => setActiveTab("preview")}
      >
        Preview
      </button>

      <button
        className={`${styles.tab} ${activeTab === "database" ? styles.activeTab : ""}`}
        onClick={() => setActiveTab("database")}
      >
        Database ({savedCount})
      </button>
    </div>
  );
}

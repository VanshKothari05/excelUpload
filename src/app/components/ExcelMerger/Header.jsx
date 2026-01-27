import { FileSpreadsheet } from "lucide-react";
import styles from "./excelMerger.module.css";

export default function Header() {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>
        <FileSpreadsheet size={32} />
        Excel File Merger
      </h1>
      <p className={styles.subtitle}>
        Upload, merge, and manage Excel files with MongoDB storage
      </p>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { db } from '../../core/database/db';
import { formatDateVietnamese } from '../utilities/date';

export function useLastBackupStatus() {
  const [lastBackupText, setLastBackupText] = useState<string>('Chưa sao lưu');

  const checkBackup = async () => {
    try {
      const logs = await db.auditLogs
        .filter((l) => l.action === 'BACKUP')
        .reverse()
        .sortBy('timestamp');

      if (logs.length > 0 && logs[0]) {
        const dateStr = logs[0].timestamp.split('T')[0];
        setLastBackupText(`Sao lưu: ${formatDateVietnamese(dateStr)}`);
      } else {
        setLastBackupText('Chưa sao lưu');
      }
    } catch {
      setLastBackupText('Chưa sao lưu');
    }
  };

  useEffect(() => {
    checkBackup();
  }, []);

  return { lastBackupText, refreshBackupStatus: checkBackup };
}

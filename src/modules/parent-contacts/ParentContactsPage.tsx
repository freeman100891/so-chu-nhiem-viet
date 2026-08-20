import React from 'react';
import { Card } from '../../shared/components/Card';
import { PhoneCall } from 'lucide-react';

export const ParentContactsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-app-main">Liên hệ Phụ huynh</h2>
        <p className="text-sm text-app-muted">Nhật ký lịch sử cuộc gọi, trao đổi trực tiếp và Zalo với cha mẹ học sinh.</p>
      </div>

      <Card title="Sổ Nhật ký Liên lạc">
        <div className="p-4 text-center text-app-muted">
          <PhoneCall className="w-10 h-10 mx-auto text-app-primary opacity-60 mb-2" />
          <p className="font-semibold text-app-main">Nhật ký Liên hệ Phụ huynh</p>
        </div>
      </Card>
    </div>
  );
};

import React from 'react';
import { AlertsPanelDrawer } from '@/components/alerts/AlertsPanelDrawer';

export const AlertsModule: React.FC = () => {
  return (
    <div className="h-[calc(100vh-100px)] min-h-[600px] flex flex-col">
      <AlertsPanelDrawer isEmbedded />
    </div>
  );
};

export default AlertsModule;

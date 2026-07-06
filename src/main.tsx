// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LoggableDataService, initLogger } from './lib/consoleLogger';
import { LocalDataService } from './services/LocalDataService';
import { setInventoryDataService } from './store/useInventoryStore';
import { setPurchaseDataService } from './store/usePurchaseStore';
import { setEventDataService } from './store/useEventStore';
import { setOrderDataService } from './store/useOrderStore';
import { setClientDataService } from './store/useClientStore';
import { setSupplierDataService } from './store/useSupplierStore';
import { setCategoryDataService } from './store/useCategoryStore';
import { setDriverDataService } from './store/useDriverStore';
import { setEmployeeDataService } from './store/useEmployeeStore';
import { setExpenseDataService } from './store/useExpenseStore';
import { setDynamicFieldDataService } from './store/useDynamicFieldStore';
import { setARDataService } from './store/useARStore';
import { setReturnDataService } from './store/useReturnStore';
import { setWarehouseDataService } from './store/useWarehouseStore';
import { setIntegrationDataService } from './store/useIntegrationStore';
import { setCashDataService } from './store/useCashStore';
import { setMovementDataService } from './store/useMovementStore';

initLogger();

if (import.meta.env.DEV || localStorage.getItem('debug')) {
  const wrapped = new LoggableDataService(new LocalDataService());
  setInventoryDataService(wrapped);
  setPurchaseDataService(wrapped);
  setEventDataService(wrapped);
  setOrderDataService(wrapped);
  setClientDataService(wrapped);
  setSupplierDataService(wrapped);
  setCategoryDataService(wrapped);
  setDriverDataService(wrapped);
  setEmployeeDataService(wrapped);
  setExpenseDataService(wrapped);
  setDynamicFieldDataService(wrapped);
  setARDataService(wrapped);
  setReturnDataService(wrapped);
  setWarehouseDataService(wrapped);
  setIntegrationDataService(wrapped);
  setCashDataService(wrapped);
  setMovementDataService(wrapped);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

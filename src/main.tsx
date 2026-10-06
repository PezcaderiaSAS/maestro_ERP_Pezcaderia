// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';
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

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

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

Sentry.init({
  dsn: "https://b9bccb14c98d597a78ab0da5af1d66be@o4512204356780032.ingest.us.sentry.io/4512204361564160",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

LogRocket.init('dlunqp/maestro_erp');
setupLogRocketReact(LogRocket);

function ErrorButton() {
  return (
    <button
      onClick={() => {
        // Send a log before throwing the error
        console.info('User triggered test error', {
          action: 'test_error_button_click',
        });
        throw new Error('This is your first error!');
      }}
      className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg z-50 font-bold shadow-lg hover:bg-red-700"
    >
      Break the world
    </button>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ErrorButton />
    </QueryClientProvider>
  </React.StrictMode>,
);

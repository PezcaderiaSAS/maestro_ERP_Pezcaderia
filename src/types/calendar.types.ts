export type EventCategory = 'PAYROLL' | 'ACCOUNTS_PAYABLE' | 'ACCOUNTS_RECEIVABLE' | 'UTILITY_BILL' | 'OTHER';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  amount: number;
  category: EventCategory;
  isPaid: boolean;
  referenceId: string;
  entityName: string;
}

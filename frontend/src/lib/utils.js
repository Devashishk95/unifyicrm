import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

export const LEAD_STAGES = {
  new_lead: { label: 'New Lead', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  contacted: { label: 'Contacted', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  interested: { label: 'Interested', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  not_interested: { label: 'Not Interested', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  follow_up_scheduled: { label: 'Follow-up Scheduled', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  application_started: { label: 'Application Started', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  documents_pending: { label: 'Documents Pending', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  documents_submitted: { label: 'Documents Submitted', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  fee_pending: { label: 'Fee Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  fee_paid: { label: 'Fee Paid', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  admission_confirmed: { label: 'Admission Confirmed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed_lost: { label: 'Closed/Lost', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
};

export const APPLICATION_STATUS = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  documents_pending: { label: 'Documents Pending', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  documents_submitted: { label: 'Documents Submitted', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  test_pending: { label: 'Test Pending', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  test_completed: { label: 'Test Completed', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  payment_pending: { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  payment_completed: { label: 'Payment Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  submitted: { label: 'Submitted', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  under_review: { label: 'Under Review', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  admitted: { label: 'Admitted', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

import {
  FileCheck2,
  FileSearch,
  IndianRupee,
  LayoutDashboard,
  ReceiptText,
  RotateCcw,
  Search,
  WalletCards,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ProductShell } from './ProductShell';
import { useAuth } from '../auth/AuthContext';

const groups = [
  {
    label: 'Finance Office',
    items: [
      { to: '/accountant', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/accountant/students', label: 'Student Accounts', icon: Search, activePrefix: '/accountant/students' },
      { to: '/accountant/payments', label: 'Payments', icon: IndianRupee, activePrefix: '/accountant/payments' },
      { to: '/accountant/receipts', label: 'Receipts', icon: ReceiptText, activePrefix: '/accountant/receipts' },
      { to: '/accountant/fee-structures', label: 'Demands & Fee Setup', icon: WalletCards, activePrefix: '/accountant/fee-structures' },
      { to: '/accountant/scholarships', label: 'Scholarships', icon: FileCheck2, activePrefix: '/accountant/scholarships' },
      { to: '/accountant/refunds', label: 'Refunds', icon: RotateCcw, activePrefix: '/accountant/refunds' },
      { to: '/accountant/reconciliation', label: 'Reconciliation', icon: FileSearch, activePrefix: '/accountant/reconciliation' },
      { to: '/accountant/reports', label: 'Reports', icon: FileSearch, activePrefix: '/accountant/reports' },
    ],
  },
];

export function AccountantLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const wide = location.pathname.startsWith('/accountant/students/') || location.pathname.startsWith('/accountant/reconciliation');

  return (
    <ProductShell
      groups={groups}
      collapsible
      brandProduct="Finance Office"
      profileBasePath="/profile"
      settingsPath="/settings"
      searchPath="/accountant/students"
      headerRight={<span className="hidden text-xs sm:inline">{user?.collegeName || 'College finance'}</span>}
      contentClassName={wide ? 'max-w-[1400px]' : 'max-w-[1200px]'}
    />
  );
}

export const formatCurrency = (amount, currency = 'RWF') => {
  if (currency === 'RWF') {
    return `Frw ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPercentage = (value, decimals = 1) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value || 0);
};

export const formatAccountCode = (code) => {
  if (!code) return '';
  return code.toString().padStart(4, '0');
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'posted':
      return 'success';
    case 'draft':
      return 'warning';
    case 'voided':
      return 'error';
    case 'pending':
      return 'info';
    default:
      return 'default';
  }
};

export const getAccountTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'asset':
      return 'primary';
    case 'liability':
      return 'warning';
    case 'equity':
      return 'success';
    case 'revenue':
      return 'info';
    case 'expense':
      return 'error';
    default:
      return 'default';
  }
};

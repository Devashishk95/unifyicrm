import { Download } from 'lucide-react';
import { Button } from './button';

/**
 * Converts an array of objects to CSV format and triggers download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without .csv extension)
 * @param {Array} columns - Optional array of column definitions [{key: 'field', label: 'Header'}]
 */
export const exportToCSV = (data, filename, columns = null) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // If columns not specified, use all keys from first object
  const headers = columns 
    ? columns.map(col => col.label || col.key)
    : Object.keys(data[0]);
  
  const keys = columns 
    ? columns.map(col => col.key)
    : Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      keys.map(key => {
        let value = row[key];
        
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Convert to string
        value = String(value);
        
        // Escape quotes and wrap in quotes if contains comma or newline
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export Button Component
 */
export const ExportButton = ({ 
  data, 
  filename, 
  columns = null, 
  variant = 'outline',
  size = 'sm',
  className = '',
  disabled = false,
  children 
}) => {
  const handleExport = () => {
    exportToCSV(data, filename, columns);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={className}
      data-testid="export-csv-btn"
    >
      <Download className="h-4 w-4 mr-2" />
      {children || 'Export CSV'}
    </Button>
  );
};

export default ExportButton;

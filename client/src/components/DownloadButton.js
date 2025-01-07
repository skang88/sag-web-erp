import React from 'react';
import * as XLSX from 'xlsx';

const DownloadButton = ({ instance }) => {
  const downloadExcel = () => {
    if (!instance || !instance.rows.length) return;

    const filteredSortedData = instance.rows.map(row => row.original);
    const worksheet = XLSX.utils.json_to_sheet(filteredSortedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'data.xlsx');
  };

  return (
    <button onClick={downloadExcel} className="download-button">
      Download as Excel
    </button>
  );
};

export default DownloadButton;

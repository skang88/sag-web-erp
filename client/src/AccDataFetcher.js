import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useTable, useFilters, useSortBy } from 'react-table';

// 필터 컴포넌트 정의
const DefaultColumnFilter = ({ column: { filterValue, preFilteredRows, setFilter } }) => {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ''}
      onChange={e => setFilter(e.target.value || undefined)}
      placeholder={`Search ${count} records...`}
      style={{ width: '100%' }}
    />
  );
};

// Table Component
const DataTable = ({ instance }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = instance;

  return (
    <table {...getTableProps()} style={{ width: '80%', margin: '20px auto', borderCollapse: 'collapse' }}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th
                {...column.getHeaderProps(column.getSortByToggleProps())}
                style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #ddd' }}
              >
                {column.render('Header')}
                <span>
                  {column.isSorted
                    ? column.isSortedDesc
                      ? ' 🔽'
                      : ' 🔼'
                    : ''}
                </span>
                <div>{column.render('Filter')}</div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  {cell.render('Cell')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// DownloadButton Component
const DownloadButton = ({ instance }) => {
  // const { state: { filters, sortBy } } = instance;

  const downloadExcel = () => {
    if (!instance || !instance.rows.length) return;

    // Get the filtered and sorted data
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

// Main Component
const AccDataFetcher = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = useMemo(
    () => [
      { Header: '사번', accessor: 'SABUN', Filter: DefaultColumnFilter },
      { Header: '이름', accessor: 'FNAME', Filter: DefaultColumnFilter },
      { Header: '출근일자', accessor: 'KDATE', Filter: DefaultColumnFilter },
      { Header: '시작시각', accessor: 'MINTIME', Filter: DefaultColumnFilter },
      { Header: '종료시각', accessor: 'MAXTIME', Filter: DefaultColumnFilter },
      { Header: '근무시간(분)', accessor: 'DTIME', Filter: DefaultColumnFilter }
    ],
    []
  );

  // Use useTable hook to create table instance
  const tableInstance = useTable(
    { columns, data },
    useFilters,
    useSortBy
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Expected JSON, got: ${text}`);
        }

        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>근태 기록 기초데이터</h2>
      <DownloadButton instance={tableInstance} />
      <DataTable columns={columns} data={data} instance={tableInstance} />
    </div>
  );
};

export default AccDataFetcher;

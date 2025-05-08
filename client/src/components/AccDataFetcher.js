import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useFilters, useSortBy } from 'react-table';
import DataTable from './DataTable';
import DownloadButton from './DownloadButton';

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

const AccDataFetcher = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = useMemo(
    () => [
      { Header: 'ID', accessor: 'SABUN', Filter: DefaultColumnFilter },
      { Header: 'Name', accessor: 'FNAME', Filter: DefaultColumnFilter },
      { Header: 'Date', accessor: 'KDATE', Filter: DefaultColumnFilter },
      { Header: 'In', accessor: 'MINTIME', Filter: DefaultColumnFilter },
      { Header: 'Out', accessor: 'MAXTIME', Filter: DefaultColumnFilter },
      { Header: 'Diff (Min)', accessor: 'DTIME', Filter: DefaultColumnFilter },
      { Header: 'Count', accessor: 'N_Time', Filter: DefaultColumnFilter }
    ],
    []
  );

  const tableInstance = useTable(
    { columns, data },
    useFilters,
    useSortBy
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/accs`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

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
      <h2>Staffing Check In and Out</h2>
      <DownloadButton instance={tableInstance} />
      <DataTable instance={tableInstance} />
    </div>
  );
};

export default AccDataFetcher;

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
      { Header: '사번', accessor: 'SABUN', Filter: DefaultColumnFilter },
      { Header: '이름', accessor: 'FNAME', Filter: DefaultColumnFilter },
      { Header: '근무일자', accessor: 'KDATE', Filter: DefaultColumnFilter },
      { Header: '출입시작', accessor: 'MINTIME', Filter: DefaultColumnFilter },
      { Header: '출입종료', accessor: 'MAXTIME', Filter: DefaultColumnFilter },
      { Header: '차이(분)', accessor: 'DTIME', Filter: DefaultColumnFilter },
      { Header: '출입횟수', accessor: 'N_Time', Filter: DefaultColumnFilter }
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
      <h2>근태 기록 기초데이터</h2>
      <DownloadButton instance={tableInstance} />
      <DataTable instance={tableInstance} />
    </div>
  );
};

export default AccDataFetcher;

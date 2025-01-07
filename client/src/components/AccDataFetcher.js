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
      { Header: '이름', accessor: 'FNAME', Filter: DefaultColumnFilter },
      { Header: '근무일자', accessor: 'workdate', Filter: DefaultColumnFilter },
      { Header: '지문시작', accessor: 'finger_start', Filter: DefaultColumnFilter },
      { Header: '지문시각', accessor: 'finger_end', Filter: DefaultColumnFilter },
      { Header: '스태핑시작', accessor: 'staffing_start', Filter: DefaultColumnFilter },
      { Header: '스태핑종료', accessor: 'staffing_end', Filter: DefaultColumnFilter }
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
      <p>2024년 11월 14일 이후 업데이트 중지</p>
      <p>중지사유: HR팀에서 지문 활용 근태기록 이용 종료 통보</p>
      <DownloadButton instance={tableInstance} />
      <DataTable instance={tableInstance} />
    </div>
  );
};

export default AccDataFetcher;

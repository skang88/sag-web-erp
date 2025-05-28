import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import DataTable from './DataTable';

const AccDataFetcher = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  // 페이지네이션 상태를 직접 관리
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: 'SABUN',
        header: 'ID',
        cell: info => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'FNAME',
        header: 'Name',
        cell: info => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'KDATE',
        header: 'Date',
        cell: info => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'MINTIME',
        header: 'In',
        cell: info => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'MAXTIME',
        header: 'Out',
        cell: info => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'DTIME',
        header: 'Diff (Min)',
        cell: info => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'N_Time',
        header: 'Count',
        cell: info => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
    ],
    []
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

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination, // 여기
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination, // 여기 꼭 추가
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={{ paddingBottom: '50px' }}>
      <h2>Staffing Check In and Out</h2>

      {/* Filter UI */}
      {table.getHeaderGroups().map(headerGroup => (
        <div
          key={headerGroup.id}
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }} // 간격 줄임
        >
          {headerGroup.headers.map(header => (
            <div
              key={header.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',   // 중앙 정렬
                justifyContent: 'flex-start',
                padding: '0 4px',
                minWidth: 0,            // 너비 유동적
              }}
            >
              <label
                htmlFor={`filter-${header.id}`}
                style={{
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  color: '#444',
                  userSelect: 'none',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                {header.column.columnDef.header}
              </label>
              {header.column.getCanFilter() ? (
                <input
                  id={`filter-${header.id}`}
                  value={
                    columnFilters.find(f => f.id === header.column.id)?.value || ''
                  }
                  onChange={e => {
                    const value = e.target.value;
                    setColumnFilters(old => {
                      const others = old.filter(f => f.id !== header.column.id);
                      return value ? [...others, { id: header.column.id, value }] : others;
                    });
                  }}
                  placeholder={`Search`}
                  style={{
                    width: '100%',
                    maxWidth: '120px',   // 최대 넓이 제한
                    padding: '4px 8px',
                    fontSize: '0.85rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#4a90e2')}
                  onBlur={e => (e.target.style.borderColor = '#ccc')}
                />
              ) : (
                <div style={{ height: '26px' }} /> // 필터 없는 칸 높이 맞추기용
              )}
            </div>
          ))}
        </div>
      ))}




      <DataTable table={table} />

      {/* 페이지네이션 컨트롤 */}
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
          {'<<'}
        </button>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {'<'}
        </button>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {'>'}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {table.getPageCount() || 1}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            min={1}
            max={table.getPageCount()}
            value={pageIndex + 1}
            onChange={e => {
              let page = e.target.value ? Number(e.target.value) - 1 : 0;
              if (page < 0) page = 0;
              else if (page >= table.getPageCount()) page = table.getPageCount() - 1;
              table.setPageIndex(page);
            }}
            style={{ width: '50px' }}
          />
        </span>
        <select
          value={pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value));
          }}
          style={{ marginLeft: '1rem' }}
        >
          {[10, 20, 30, 40, 50].map(size => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AccDataFetcher;

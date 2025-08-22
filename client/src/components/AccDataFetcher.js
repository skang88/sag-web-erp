import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import DataTable from './DataTable'; // DataTable은 이미 Tailwind로 전환되어 있다고 가정합니다.

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
        //const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/accs`);
        const response = await fetch('https://seohanga.com/api/accs');
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
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;

  if (loading) return <p className="text-center text-lg mt-8">Loading...</p>;
  if (error) return <p className="text-center text-red-600 text-lg mt-8">Error: {error.message}</p>;

  return (
    <div className="p-6 pb-12 max-h-screen overflow-y-auto mb-4"> {/* This is the main container */}
  <h2 className="text-2xl font-bold mb-4">Staffing Check In and Out</h2>

      {/* Filter UI */}
      {table.getHeaderGroups().map(headerGroup => (
        <div
          key={headerGroup.id}
          className="flex gap-2 mb-1.5" // display: 'flex', gap: '0.5rem' (8px) -> gap-2, marginBottom: '0.3rem' (4.8px) -> mb-1.5 (6px)
        >
          {headerGroup.headers.map(header => (
            <div
              key={header.id}
              className="flex-1 flex flex-col items-center justify-start px-1 min-w-0" // flex: 1, display: flex, flexDirection: column, alignItems: center, justifyContent: flex-start, padding: 0 4px, minWidth: 0
            >
              <label
                htmlFor={`filter-${header.id}`}
                className="font-semibold text-xs text-gray-700 select-none mb-0.5 whitespace-nowrap" // fontWeight: '600', fontSize: '0.75rem' (12px) -> text-xs, color: '#444' -> text-gray-700, userSelect: 'none', marginBottom: '2px' -> mb-0.5, whiteSpace: 'nowrap'
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
                  className="w-full max-w-[120px] px-2 py-1 text-sm rounded border border-gray-300 box-border transition-colors duration-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" // width: '100%', maxWidth: '120px', padding: '4px 8px' -> px-2 py-1, fontSize: '0.85rem' (13.6px) -> text-sm, borderRadius: '4px' -> rounded, border: '1px solid #ccc' -> border border-gray-300, boxSizing: 'border-box', transition: 'border-color 0.2s ease', onFocus/onBlur 대체
                />
              ) : (
                <div className="h-[26px]" /> // height: '26px' -> h-[26px] (임의 값 지정)
              )}
            </div>
          ))}
        </div>
      ))}

      <DataTable table={table} />

      {/* 페이지네이션 컨트롤 */}
      <div className="mt-4 flex items-center gap-2 mb-10"> {/* marginTop: '1rem' -> mt-4, display: 'flex', alignItems: 'center', gap: '0.5rem' -> flex items-center gap-2 */}
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          {'<<'}
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          {'<'}
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          {'>'}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          {'>>'}
        </button>
        <span className="ml-2"> {/* marginLeft 추가 */}
          Page{' '}
          <strong className="font-bold">
            {pageIndex + 1} of {table.getPageCount() || 1}
          </strong>{' '}
        </span>
        <span className="ml-2"> {/* marginLeft 추가 */}
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
            className="w-12 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500" // width: '50px' -> w-12, style 추가
          />
        </span>
        <select
          value={pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value));
          }}
          className="ml-4 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" // marginLeft: '1rem' -> ml-4, style 추가
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
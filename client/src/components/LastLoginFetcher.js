import { useState, useEffect, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table';
import DataTable from './DataTable'; // 이 컴포넌트의 스타일도 나중에 Tailwind로 전환해야 합니다.

// FilterInput 컴포넌트: 인라인 스타일을 Tailwind 클래스로 변환
const FilterInput = ({ filterValue, onFilterChange, id }) => {
    return (
        <input
            id={id}
            value={filterValue || ''}
            onChange={e => onFilterChange(e.target.value)}
            placeholder="Search..."
            // 기존 style={{ height: '28px', fontSize: '0.9rem', padding: '0 8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', width: '100%' }}
            className="h-7 text-sm px-2 rounded border border-gray-300 box-border w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
    );
};

const LastLoginFetcher = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [sorting, setSorting] = useState([]);
    const [columnFilters, setColumnFilters] = useState([]);

    const columns = useMemo(
        () => [
            {
                accessorKey: 'L_ID',
                header: 'ID',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
            {
                accessorKey: 'C_Unique',
                header: 'Employee ID',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
            {
                accessorKey: 'C_Name',
                header: 'Name',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
            {
                accessorKey: 'LastLoginDateTime',
                header: 'Last Login',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
            {
                accessorKey: 'DaysSinceLastLogin',
                header: 'Days Since Login',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
        ],
        []
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/accs/lastlogin`);
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
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    if (loading) return <p className="text-center text-lg mt-8">Loading...</p>;
    if (error) return <p className="text-center text-red-600 text-lg mt-8">Error: {error.message}</p>;

    return (
        <div className="p-6 max-h-screen overflow-y-auto mb-10"> {/* 전체 컨테이너 패딩 */}
            <h2 className="text-2xl font-bold mb-2">Most recent fingerprint access log</h2>
            <p className="text-gray-600 mb-1">Latest login activity (previous day)</p>
            <p className="text-gray-700 mb-6">Total number of registered individuals: <span className="font-semibold">{data.length}</span></p>

            {/* Filter UI */}
            {table.getHeaderGroups().map(headerGroup => (
                <div
                    key={headerGroup.id}
                    // 기존 style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}
                    className="flex gap-2 mb-3 items-center"
                >
                    {headerGroup.headers.map(header => (
                        <div
                            key={header.id}
                            // 기존 style={{ flex: 1, minWidth: '100px', display: 'flex', flexDirection: 'column' }}
                            className="flex-1 min-w-[100px] flex flex-col"
                        >
                            <label
                                htmlFor={`filter-${header.id}`}
                                // 기존 style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.2rem' }}
                                className="font-semibold text-sm mb-0.5"
                            >
                                {header.column.columnDef.header}
                            </label>
                            {header.column.getCanFilter() ? (
                                <FilterInput
                                    filterValue={
                                        columnFilters.find(f => f.id === header.column.id)?.value || ''
                                    }
                                    onFilterChange={value => {
                                        setColumnFilters(old => {
                                            const others = old.filter(f => f.id !== header.column.id);
                                            return value ? [...others, { id: header.column.id, value }] : others;
                                        });
                                    }}
                                    id={`filter-${header.id}`}
                                />
                            ) : null}
                        </div>
                    ))}
                </div> 
            ))}

            <DataTable table={table} /> {/* DataTable 컴포넌트의 스타일도 Tailwind로 전환 필요 */}
            <p className='mb-20'> </p>
        </div>
    );
};

export default LastLoginFetcher;
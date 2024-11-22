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
                {/* 헤더를 한 번만 렌더링 */}
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                        {headerGroup.headers.map(column => (
                            <th
                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                style={{
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    padding: '10px',
                                    borderBottom: '1px solid #ddd',
                                    backgroundColor: '#f4f4f4', // 헤더 배경 색상
                                }}
                                key={column.id}
                            >
                                {column.render('Header')}
                                <span>
                                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                                </span>
                                <div>{column.canFilter ? column.render('Filter') : null}</div>
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                    prepareRow(row);
                    return (
                        <tr {...row.getRowProps()} key={row.id}>
                            {row.cells.map(cell => (
                                <td {...cell.getCellProps()} style={{ padding: '10px', borderBottom: '1px solid #ddd' }} key={cell.column.id}>
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
    const downloadExcel = () => {
        if (!instance || !instance.rows.length) return;

        const filteredSortedData = instance.rows.map(row => row.original);
        const worksheet = XLSX.utils.json_to_sheet(filteredSortedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, 'last_login_data.xlsx');
    };

    return (
        <button onClick={downloadExcel} className="download-button">
            Download as Excel
        </button>
    );
};

// Main Component
const LastLoginFetcher = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const columns = useMemo(
        () => [
            { Header: '고유ID', accessor: 'L_ID', Filter: DefaultColumnFilter },
            { Header: '사번', accessor: 'C_Unique', Filter: DefaultColumnFilter },
            { Header: '이름', accessor: 'C_Name', Filter: DefaultColumnFilter },
            { Header: '마지막 로그인', accessor: 'LastLoginDateTime', Filter: DefaultColumnFilter },
            { Header: '로그인 후 일수', accessor: 'DaysSinceLastLogin', Filter: DefaultColumnFilter }
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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div>
            <h2>마지막 지문 출입 기록</h2>
            <p>전일 기준 최신 로그인 기록</p>
            <p>전체 등록 인원: {data.length}명</p> {/* 추가된 코드 */}
            <DownloadButton instance={tableInstance} />
            <DataTable instance={tableInstance} />
        </div>
    );
};

export default LastLoginFetcher;

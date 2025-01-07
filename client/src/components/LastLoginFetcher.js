import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useFilters, useSortBy } from 'react-table';
import DefaultColumnFilter from './DefaultColumnFilter';
import DataTable from './DataTable';
import DownloadButton from './DownloadButton';

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
            <p>전체 등록 인원: {data.length}명</p>
            <DownloadButton instance={tableInstance} />
            <DataTable instance={tableInstance} />
        </div>
    );
};

export default LastLoginFetcher;

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const PlateLogPage = () => {
    const [plates, setPlates] = useState([]);
    const [startDate, setStartDate] = useState(getTodayDate()); // Initialize with today's date
    const [endDate, setEndDate] = useState(getTodayDate());     // Initialize with today's date
    const [plateNumber, setPlateNumber] = useState('');
    const [registrationStatus, setRegistrationStatus] = useState('');

    const [message, setMessage] = useState(''); // 'message' state is used in JSX now
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Removed setItemsPerPage as it's not used to change the value
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0); // 'totalItems' state is used in JSX now

    // 'navigate' is assigned a value but never used: This warning indicates that 'navigate' is imported
    // but not actually called within the component's JSX or logic.
    // For this component, 'navigate' is currently not used, so we can ignore this particular warning
    // or remove the import if it's strictly not needed, but it's often kept for future extensibility.
    const navigate = useNavigate(); 

    // Helper function to format ISO date strings into a readable local date/time string.
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleString();
        } catch {
            return 'Invalid Date'; // Handle potential invalid date strings
        }
    };

    // Memoized fetch function to prevent unnecessary re-renders of useEffect
    const fetchPlateLogs = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setMessage('');

        const token = localStorage.getItem('token');

        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (plateNumber) queryParams.append('plateNumber', plateNumber);
        if (registrationStatus) queryParams.append('registrationStatus', registrationStatus);
        
        // Add pagination parameters
        queryParams.append('page', currentPage);
        queryParams.append('limit', itemsPerPage);

        const url = `${API_BASE_URL}/api/plate-recognitions?${queryParams.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            const data = await response.json();
            setIsLoading(false);

            if (!response.ok) {
                setError(data.message || '번호판 기록을 불러오는데 실패했습니다.');
                setPlates([]);
                setTotalPages(1);
                setTotalItems(0);
                return;
            }

            setPlates(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.totalItems || 0);
            setMessage(data.message || '번호판 기록을 성공적으로 불러왔습니다.');

        } catch (err) {
            setIsLoading(false);
            setError('번호판 기록을 불러오는 중 예상치 못한 오류가 발생했습니다.');
            console.error('Fetch Plate Logs Error:', err);
            setPlates([]);
            setTotalPages(1);
            setTotalItems(0);
        }
    }, [startDate, endDate, plateNumber, registrationStatus, currentPage, itemsPerPage]); // Dependencies for useCallback

    // Initial load and whenever pagination or filter states change
    useEffect(() => {
        fetchPlateLogs();
    }, [fetchPlateLogs]); // Dependency on memoized fetchPlateLogs

    // Handler for page change
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Table headers definition (Vehicle Color, Make, Model, Body Type removed)
    const tableHeaders = [
        '시간', '번호판', '신뢰도', '상태', '쉘리 작동', '사용자 이메일', '번호판 이미지', '차량 이미지'
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
            <div className="w-full max-w-7xl mx-auto mt-20 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center border-b-2 pb-4 border-gray-300">
                    차량 번호판 인식 로그
                </h2>

                {/* 필터 섹션 */}
                <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); fetchPlateLogs(); }} 
                      className="bg-blue-50 p-6 rounded-lg shadow-inner mb-8 border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label htmlFor="startDate" className="block text-blue-800 text-sm font-bold mb-2">시작 날짜:</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-blue-800 text-sm font-bold mb-2">종료 날짜:</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            />
                        </div>
                        <div>
                            <label htmlFor="plateNumber" className="block text-blue-800 text-sm font-bold mb-2">번호판 번호:</label>
                            <input
                                type="text"
                                id="plateNumber"
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value)}
                                placeholder="예: SIA5101"
                                className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            />
                        </div>
                        <div>
                            <label htmlFor="registrationStatus" className="block text-blue-800 text-sm font-bold mb-2">등록 상태:</label>
                            <select
                                id="registrationStatus"
                                value={registrationStatus}
                                onChange={(e) => setRegistrationStatus(e.target.value)}
                                className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition duration-150 ease-in-out"
                            >
                                <option value="">전체</option>
                                <option value="REGISTERED">등록됨</option>
                                <option value="UNREGISTERED">미등록</option>
                                <option value="NO_PLATE">번호판 미인식</option>
                            </select>
                        </div>
                    </div>
                    {/* 검색 버튼 */}
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 ease-in-out w-full transform hover:scale-105"
                        disabled={isLoading}
                    >
                        {isLoading ? '검색 중...' : '로그 검색'}
                    </button>
                </form>

                {/* 로딩, 메시지, 에러 표시 영역 */}
                {isLoading && <p className="text-center text-blue-600 font-semibold text-lg mt-6">데이터를 불러오는 중...</p>}
                {error && <p className="text-center text-red-600 font-semibold text-lg mt-6">{error}</p>}
                {!isLoading && !error && plates.length === 0 && (
                    // Fixed the syntax error by removing the redundant curly braces
                    <p className="text-center text-gray-600 font-medium text-lg mt-6">{message}</p>
                )}

                {/* 데이터 테이블 섹션 */}
                {!isLoading && !error && plates.length > 0 && (
                    <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
                        {/* Total items count display */}
                        <p className="text-right text-gray-600 text-sm mb-2 px-4 pt-4">총 {totalItems}개 기록</p>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    {tableHeaders.map((header, index) => (
                                        <th
                                            key={index}
                                            scope="col"
                                            className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-200"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {plates.map((plate) => (
                                    <tr key={plate.bestUuid || plate.id} className="hover:bg-gray-50 transition duration-100 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDateTime(plate.startTime)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                            {plate.bestPlateNumber || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plate.bestConfidence ? plate.bestConfidence.toFixed(2) + '%' : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                plate.registrationStatus === 'REGISTERED' ? 'bg-green-100 text-green-800' :
                                                plate.registrationStatus === 'UNREGISTERED' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {plate.registrationStatus || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                plate.shellyOperated ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {plate.shellyOperated ? '예' : '아니오'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plate.userEmail || 'N/A'}
                                        </td>
                                        {/* Plate Image Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plate.plateCropJpeg && plate.plateCropJpeg.length > 100 ? ( // Check for meaningful Base64 string length
                                                <img 
                                                    src={`data:image/jpeg;base64,${plate.plateCropJpeg}`} 
                                                    alt="번호판 이미지" 
                                                    className="w-24 h-auto rounded-md shadow-md object-contain border border-gray-200" 
                                                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/96x64/cccccc/333333?text=이미지 오류"; }}
                                                />
                                            ) : (
                                                <span className="text-gray-500 text-xs">이미지 없음</span>
                                            )}
                                        </td>
                                        {/* Vehicle Image Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plate.vehicleCropJpeg && plate.vehicleCropJpeg.length > 100 ? ( // Check for meaningful Base64 string length
                                                <img 
                                                    src={`data:image/jpeg;base64,${plate.vehicleCropJpeg}`} 
                                                    alt="차량 이미지" 
                                                    className="w-32 h-auto rounded-md shadow-md object-contain border border-gray-200" 
                                                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/128x96/cccccc/333333?text=이미지 오류"; }}
                                                />
                                            ) : (
                                                <span className="text-gray-500 text-xs">이미지 없음</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!isLoading && !error && plates.length > 0 && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition duration-150 ease-in-out"
                        >
                            이전
                        </button>
                        {/* Page numbers (simplified) */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-2 rounded-md ${
                                    currentPage === page ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                } transition duration-150 ease-in-out`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition duration-150 ease-in-out"
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlateLogPage;

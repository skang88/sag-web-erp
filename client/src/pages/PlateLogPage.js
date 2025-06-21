// src/pages/PlateLogPage.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PlateLogPage = () => {
    const [plates, setPlates] = useState([]); // 조회된 번호판 기록들
    const [startDate, setStartDate] = useState(''); // 시작 날짜
    const [endDate, setEndDate] = useState('');   // 종료 날짜
    const [plateNumber, setPlateNumber] = useState(''); // 특정 번호판
    const [registrationStatus, setRegistrationStatus] = useState(''); // 등록 상태 필터

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // 초기 로드 시 또는 필터 변경 시 데이터 불러오기
    useEffect(() => {
        // 컴포넌트 마운트 시 (초기 로드) 현재 날짜 기준으로 필터 설정 (선택 사항)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작
        const day = String(today.getDate()).padStart(2, '0');
        const formattedToday = `${year}-${month}-${day}`;

        setStartDate(formattedToday);
        setEndDate(formattedToday);

        fetchPlateLogs(); // 초기 데이터 로드
    }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

    const fetchPlateLogs = async (e) => {
        if (e) e.preventDefault(); // 폼 제출 시 새로고침 방지

        setIsLoading(true);
        setError('');
        setMessage('');
        const token = localStorage.getItem('token');

        if (!token) {
            setError('로그인이 필요합니다.');
            setIsLoading(false);
            navigate('/login');
            return;
        }

        // 쿼리 파라미터 생성
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (plateNumber) queryParams.append('plateNumber', plateNumber);
        if (registrationStatus) queryParams.append('registrationStatus', registrationStatus);

        const url = `${API_BASE_URL}/api/plate?${queryParams.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            setIsLoading(false);

            if (!response.ok) {
                setError(data.message || '번호판 기록을 불러오는데 실패했습니다.');
                setPlates([]); // 에러 발생 시 데이터 초기화
                return;
            }

            setPlates(data.data || []); // 데이터 업데이트
            setMessage(data.message || '번호판 기록을 성공적으로 불러왔습니다.');

        } catch (err) {
            setIsLoading(false);
            setError('번호판 기록을 불러오는 중 예상치 못한 오류가 발생했습니다.');
            console.error('Fetch Plate Logs Error:', err);
            setPlates([]); // 에러 발생 시 데이터 초기화
        }
    };

    // 테이블 헤더 정의
    const tableHeaders = [
        'Start Time', 'Plate Number', 'Status', 'Shelly Operated', 'Vehicle Color', 'Vehicle Make', 'Vehicle Model', 'Body Type'
    ];

    return (
        <div className="container mx-auto p-4 mt-20"> {/* Navbar 높이 고려 mt-20 */}
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">License Plate Log</h2>

            {/* 필터 섹션 */}
            <form onSubmit={fetchPlateLogs} className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">Start Date:</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2">End Date:</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="plateNumber" className="block text-gray-700 text-sm font-bold mb-2">Plate Number:</label>
                        <input
                            type="text"
                            id="plateNumber"
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value)}
                            placeholder="e.g., 12가3456"
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="registrationStatus" className="block text-gray-700 text-sm font-bold mb-2">Registration Status:</label>
                        <select
                            id="registrationStatus"
                            value={registrationStatus}
                            onChange={(e) => setRegistrationStatus(e.target.value)}
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">All</option>
                            <option value="REGISTERED">Registered</option>
                            <option value="UNREGISTERED">Unregistered</option>
                            <option value="NO_PLATE">No Plate Detected</option>
                        </select>
                    </div>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out w-full"
                    disabled={isLoading}
                >
                    {isLoading ? 'Searching...' : 'Search Logs'}
                </button>
            </form>

            {/* 로딩, 메시지, 에러 표시 */}
            {isLoading && <p className="text-center text-blue-600 mt-4">Loading data...</p>}
            {error && <p className="text-center text-red-600 mt-4">{error}</p>}
            {message && !error && !isLoading && plates.length === 0 && (
                <p className="text-center text-gray-600 mt-4">No records found for the selected criteria.</p>
            )}

            {/* 데이터 테이블 */}
            {!isLoading && !error && plates.length > 0 && (
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {tableHeaders.map((header, index) => (
                                    <th
                                        key={index}
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {plates.map((plate, index) => (
                                <tr key={plate._id || index}> {/* _id가 없을 경우 index 사용 (실제로는 _id가 있어야 함) */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(plate.startTime).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {plate.bestPlateNumber || 'N/A'}
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
                                            {plate.shellyOperated ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {plate.vehicle.color || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {plate.vehicle.make || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {plate.vehicle.makeModel || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {plate.vehicle.bodyType || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PlateLogPage;
// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 백엔드 API 기본 URL (환경 변수에서 가져옴)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ProfilePage = () => {
    // 상태 변수 정의
    const [email, setEmail] = useState(''); // 이메일은 읽기 전용
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [licensePlates, setLicensePlates] = useState([]); // 현재 등록된 번호판 배열
    const [newPlate, setNewPlate] = useState(''); // 새로 추가할 번호판 입력 필드

    const [message, setMessage] = useState(''); // 성공 메시지
    const [error, setError] = useState('');    // 오류 메시지
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태

    const navigate = useNavigate(); // 라우팅을 위한 useNavigate 훅

    // 컴포넌트가 마운트될 때 사용자 프로필 정보 불러오기
    useEffect(() => {
        const fetchUserProfile = async () => {
            setIsLoading(true); // 로딩 시작
            setError('');       // 이전 오류 초기화
            setMessage('');     // 이전 메시지 초기화
            const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기

            // 토큰이 없으면 로그인 페이지로 리다이렉트
            if (!token) {
                setError('로그인이 필요합니다.');
                setIsLoading(false);
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // JWT 토큰을 Authorization 헤더에 포함
                    },
                });

                const data = await response.json();
                setIsLoading(false); // 로딩 종료

                // 응답이 성공적이지 않으면 오류 처리
                if (!response.ok) {
                    setError(data.message || '사용자 정보를 불러오는데 실패했습니다.');
                    return;
                }

                // 성공적으로 정보를 불러왔을 때 상태 업데이트
                setEmail(data.email || ''); // 이메일은 보통 변경 불가하므로 읽기 전용으로 표시
                setName(data.name || '');
                setPhone(data.phone || '');
                setLicensePlates(data.licensePlates || []); // 번호판이 없을 경우 빈 배열로 초기화

            } catch (err) {
                setIsLoading(false); // 로딩 종료
                setError('사용자 정보를 불러오는 중 예상치 못한 오류가 발생했습니다.');
                console.error('Fetch Profile Error:', err);
            }
        };

        fetchUserProfile(); // 함수 호출
    }, [navigate]); // navigate가 변경될 때마다 실행 (React Hook linting rule)

    // 프로필 업데이트 요청 처리 함수
    const handleUpdateSubmit = async (e) => {
        e.preventDefault(); // 폼 기본 제출 동작 방지
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

        // 비밀번호 확인 로직
        if (newPassword && newPassword !== confirmNewPassword) {
            setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            setIsLoading(false);
            return;
        }

        // 비밀번호 길이 검증 (백엔드와 동일하게)
        if (newPassword && newPassword.length < 6) {
            setError('새 비밀번호는 최소 6자 이상이어야 합니다.');
            setIsLoading(false);
            return;
        }

        try {
            // 백엔드로 보낼 데이터 객체 구성
            const updateData = {
                name,
                phone,
                licensePlates, // 현재 state에 있는 번호판 배열을 통째로 보냄
            };
            if (newPassword) { // 새 비밀번호가 입력된 경우에만 추가
                updateData.password = newPassword;
            }

            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT', // PUT 또는 PATCH 메서드 사용
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // JWT 토큰 포함
                },
                body: JSON.stringify(updateData), // JSON 문자열로 변환하여 전송
            });

            const data = await response.json();
            setIsLoading(false);

            if (!response.ok) {
                // 백엔드에서 보낸 오류 메시지 표시
                setError(data.message || '프로필 업데이트에 실패했습니다.');
                return;
            }

            // 성공 메시지 표시 및 비밀번호 입력 필드 초기화
            setMessage(data.message || '프로필이 성공적으로 업데이트되었습니다!');
            setNewPassword('');
            setConfirmNewPassword('');

        } catch (err) {
            setIsLoading(false);
            setError('프로필 업데이트 중 예상치 못한 오류가 발생했습니다.');
            console.error('Update Profile Error:', err);
        }
    };

    // 자동차 번호판 추가 핸들러
    const handleAddPlate = () => {
        if (newPlate.trim() === '') { // 입력 필드가 비어있으면
            setError('자동차 번호를 입력해주세요.');
            return;
        }
        const formattedPlate = newPlate.trim().toUpperCase(); // 공백 제거 및 대문자 변환

        // 중복 번호판 검사
        if (licensePlates.includes(formattedPlate)) {
            setError('이미 등록된 번호판입니다.');
            return;
        }

        setLicensePlates([...licensePlates, formattedPlate]); // 배열에 추가
        setNewPlate(''); // 입력 필드 초기화
        setError(''); // 에러 메시지 초기화
    };

    // 자동차 번호판 제거 핸들러
    const handleRemovePlate = (plateToRemove) => {
        // 제거할 번호판을 제외한 새 배열 생성
        setLicensePlates(licensePlates.filter(plate => plate !== plateToRemove));
    };

    // 취소 버튼 핸들러
    const handleCancel = () => {
        navigate(-1); // 이전 페이지로 돌아가기
        // 또는 navigate('/'); // 메인 페이지로 이동하고 싶다면 이 주석을 해제
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-5 bg-white rounded-lg shadow-lg mt-10 mb-10">
            <h2 className="text-3xl text-gray-800 mb-5 font-semibold">User Profile</h2>

            {/* 로딩, 메시지, 에러 표시 */}
            {isLoading && <p className="text-center mt-3 text-blue-600">Loading profile...</p>}
            {message && <p className="text-center mt-3 text-green-600">{message}</p>}
            {error && <p className="text-center mt-3 text-red-600">{error}</p>}

            {/* 로딩 중이거나 에러가 아니면 폼 표시 */}
            {!isLoading && !error && (
                <form onSubmit={handleUpdateSubmit} className="w-full">
                    {/* 이메일 (읽기 전용) */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            readOnly // 읽기 전용으로 설정
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 cursor-not-allowed leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* 이름 필드 */}
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* 전화번호 필드 */}
                    <div className="mb-4">
                        <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Phone:</label>
                        <input
                            type="text"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* 새 비밀번호 필드 */}
                    <div className="mb-4">
                        <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">New Password (Leave blank to keep current):</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmNewPassword" className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password:</label>
                        <input
                            type="password"
                            id="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* 자동차 번호판 관리 섹션 */}
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">License Plates:</label>
                        <div className="flex mb-2">
                            <input
                                type="text"
                                value={newPlate}
                                onChange={(e) => setNewPlate(e.target.value)}
                                placeholder="Enter new license plate"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                            />
                            <button
                                type="button" // 폼 제출을 방지하기 위해 type="button" 명시
                                onClick={handleAddPlate}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Add
                            </button>
                        </div>
                        {/* 등록된 번호판 목록 */}
                        <ul className="list-disc list-inside">
                            {licensePlates.length > 0 ? (
                                licensePlates.map((plate, index) => (
                                    <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded mb-1">
                                        {plate}
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePlate(plate)}
                                            className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm mt-2">No license plates registered yet.</p>
                            )}
                        </ul>
                    </div>

                    {/* 업데이트 및 취소 버튼 */}
                    <div className="flex items-center justify-center space-x-4"> {/* Added space-x-4 for spacing */}
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline text-lg transition duration-300 ease-in-out"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Updating...' : 'Update Profile'}
                        </button>
                        <button
                            type="button" // Important: set to type="button" to prevent form submission
                            onClick={handleCancel}
                            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline text-lg transition duration-300 ease-in-out"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProfilePage;
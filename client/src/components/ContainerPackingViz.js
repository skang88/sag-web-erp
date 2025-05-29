import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import axios from 'axios';

// 컨테이너 치수 정의 (인치)
const CONTAINER_LENGTH = 635.8;
const CONTAINER_WIDTH = 102.4;
const CONTAINER_HEIGHT = 110.2;

// API 엔드포인트 주소 (Node.js Express 서버 주소)
const API_BASE_URL = 'http://66.118.96.42:28001/api';

const ContainerPackingViz = () => {
    const mountRef = useRef(null); // Three.js 캔버스가 마운트될 DOM 요소 참조
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const animationIdRef = useRef(null);
    const sceneRef = useRef(null); // 씬 참조를 위한 ref 추가

    // packingData의 초기값을 빈 배열이 아닌 객체 형태로 설정하고, API 응답에 따라 채워짐
    const [packingData, setPackingData] = useState({ packedPallets: [], packedCount: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 날짜와 Shipping Group 입력값을 위한 state
    const [dateInput, setDateInput] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [groupInput, setGroupInput] = useState('01');

    // API 호출 및 적재 데이터 가져오기
    const fetchPackingPlan = useCallback(async () => {
        if (!dateInput || !groupInput) {
            setError("날짜와 Shipping Group을 모두 입력해주세요.");
            setPackingData({ packedPallets: [], packedCount: 0 }); // Clear previous data
            return;
        }

        setLoading(true);
        setError(null);
        setPackingData({ packedPallets: [], packedCount: 0 }); // Clear previous data when fetching new one

        try {
            // 날짜 형식 변환: 'YYYY-MM-DD' -> 'YYYYMMDD'
            const formattedDate = dateInput.replace(/-/g, '');
            const group = groupInput;

            console.log(`[API Call] API 호출 시작: ${API_BASE_URL}/packing/pallets?date=${formattedDate}&group=${group}`);
            const response = await axios.get(`${API_BASE_URL}/packing/pallets?date=${formattedDate}&group=${group}`);

            const fetchedPallets = Array.isArray(response.data) ? response.data : response.data.packedPallets || [];
            const fetchedCount = response.data.packedCount || fetchedPallets.length;

            setPackingData({ packedPallets: fetchedPallets, packedCount: fetchedCount });
            console.log("[API Call] 적재 데이터 수신 성공:", { packedPallets: fetchedPallets, packedCount: fetchedCount });
        } catch (err) {
            console.error("[API Call] 적재 데이터 가져오는 중 오류 발생:", err.response?.data || err.message);
            setError(err.response?.data?.msg || err.message || "데이터를 가져오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [dateInput, groupInput]);

    // 창 크기 변경 핸들러
    const handleResize = useCallback(() => {
        if (cameraRef.current && rendererRef.current && mountRef.current) {
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;

            if (width === 0 || height === 0) {
                console.warn("[handleResize] mountRef dimensions are zero. Skipping resize.");
                return;
            }

            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
            console.log(`[handleResize] 캔버스 크기 조정: ${width}x${height}`);
        }
    }, []);

    // 리사이즈 이벤트 리스너 등록 및 해제
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize(); // 초기 렌더링 후 캔버스 크기 한번 더 조정 (DOM이 완전히 로드된 후)
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    // Three.js 씬 설정 및 렌더링 로직
    useEffect(() => {
        console.log("[useEffect-Three.js] useEffect 실행됨");
        console.log("[useEffect-Three.js] packingData:", packingData);
        console.log("[useEffect-Three.js] mountRef.current:", mountRef.current);

        if (!mountRef.current || loading || error || !packingData.packedPallets || packingData.packedPallets.length === 0) {
            console.log("[useEffect-Three.js] 조건 미충족 (mountRef, loading, error, or packedPallets 없음), useEffect 종료됨.");
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
            if (controlsRef.current) {
                controlsRef.current.dispose();
                controlsRef.current = null;
            }
            if (rendererRef.current) {
                if (rendererRef.current.domElement && mountRef.current.contains(rendererRef.current.domElement)) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (object.isMesh) {
                        object.geometry?.dispose();
                        if (object.material.isMaterial) {
                            object.material.dispose();
                        } else if (Array.isArray(object.material)) {
                            object.material.forEach(m => m.dispose());
                        }
                    }
                });
                sceneRef.current.clear();
                sceneRef.current = null;
            }
            return;
        }

        // 기존 씬 제거 (컴포넌트 업데이트 시 중복 렌더링 방지 및 자원 해제)
        if (sceneRef.current) {
            sceneRef.current.traverse((object) => {
                if (object.isMesh) {
                    object.geometry?.dispose();
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    } else if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    }
                }
            });
            sceneRef.current = null;
        }

        if (rendererRef.current) {
            if (rendererRef.current.domElement && mountRef.current.contains(rendererRef.current.domElement)) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current.dispose();
            rendererRef.current = null;
        }
        if (controlsRef.current) {
            controlsRef.current.dispose();
            controlsRef.current = null;
        }
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }

        console.log("[useEffect-Three.js] Three.js 씬 초기화 시작.");
        const currentMount = mountRef.current;
        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;

        console.log("[useEffect-Three.js] mountRef.current.clientWidth:", width);
        console.log("[useEffect-Three.js] mountRef.current.clientHeight:", height);

        if (width === 0 || height === 0) {
            console.error("[useEffect-Three.js] mountRef dimensions are zero. Cannot initialize Three.js scene.");
            return;
        }

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0xe2e8f0);

        const fov = 45;
        const aspect = width / height;
        const near = 0.1;
        const far = 2000;
        cameraRef.current = new THREE.PerspectiveCamera(fov, aspect, near, far);

        const containerCenterX = CONTAINER_LENGTH / 2;
        const containerCenterY = CONTAINER_HEIGHT / 2;
        const containerCenterZ = CONTAINER_WIDTH / 2;

        cameraRef.current.position.set(
            containerCenterX + CONTAINER_LENGTH * 0.8,
            containerCenterY + CONTAINER_HEIGHT * 1.5,
            containerCenterZ + CONTAINER_WIDTH * 1.0
        );

        rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
        rendererRef.current.setSize(width, height);
        rendererRef.current.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(rendererRef.current.domElement);

        rendererRef.current.domElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';

        controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.05;
        controlsRef.current.screenSpacePanning = false;
        controlsRef.current.maxPolarAngle = Math.PI / 2;
        controlsRef.current.target.set(containerCenterX, containerCenterY, containerCenterZ);
        controlsRef.current.update();

        const containerGeometry = new THREE.BoxGeometry(CONTAINER_LENGTH, CONTAINER_HEIGHT, CONTAINER_WIDTH);
        const containerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, wireframe: true, transparent: true, opacity: 0.2
        });
        const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
        containerMesh.position.set(CONTAINER_LENGTH / 2, CONTAINER_HEIGHT / 2, CONTAINER_WIDTH / 2);
        scene.add(containerMesh);

        const palletTypeA39WColor = new THREE.Color(0xFF6347);
        const palletTypeA59WColor = new THREE.Color(0xFFA07A);
        const palletTypeBColor = new THREE.Color(0x4682B4);
        const lineColor = 0x333333;

        packingData.packedPallets.forEach(p => {
            const palletGeometry = new THREE.BoxGeometry(p.length, p.height, p.width);
            let palletMaterial;

            if (p.type === "A_39W") {
                palletMaterial = new THREE.MeshLambertMaterial({ color: palletTypeA39WColor });
            } else if (p.type === "A_59W") {
                palletMaterial = new THREE.MeshLambertMaterial({ color: palletTypeA59WColor });
            } else if (p.type === "B") {
                palletMaterial = new THREE.MeshLambertMaterial({ color: palletTypeBColor });
            } else {
                palletMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            }

            const palletMesh = new THREE.Mesh(palletGeometry, palletMaterial);
            palletMesh.position.set(
                p.x + p.length / 2,
                p.z + p.height / 2,
                p.y + p.width / 2
            );
            scene.add(palletMesh);

            const edges = new THREE.EdgesGeometry(palletGeometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 }));
            line.position.copy(palletMesh.position);
            scene.add(line);
        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(CONTAINER_LENGTH * 1.5, CONTAINER_HEIGHT * 2, CONTAINER_WIDTH * 1.5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        console.log("[useEffect-Three.js] Scene children count (컨테이너, 팔레트, 조명 포함):", scene.children.length);

        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);
            controlsRef.current.update();
            rendererRef.current.render(scene, cameraRef.current);
        };
        animate();

        return () => {
            console.log("[useEffect-Three.js] 클린업 함수 실행됨.");
            cancelAnimationFrame(animationIdRef.current);
            if (controlsRef.current) controlsRef.current.dispose();
            if (rendererRef.current) {
                if (currentMount && rendererRef.current.domElement && currentMount.contains(rendererRef.current.domElement)) {
                    currentMount.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current.dispose();
            }
            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (!object.isMesh) return;
                    object.geometry?.dispose();
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    } else if (Array.isArray(object.material)) {
                        for (const material of object.material) material.dispose();
                    }
                });
                sceneRef.current.clear();
            }
            sceneRef.current = null;
            cameraRef.current = null;
            rendererRef.current = null;
            controlsRef.current = null;
        };
    }, [packingData, loading, error]);

    return (
        <div className="p-4">
            {/* 이 div가 모든 입력 요소와 버튼을 포함하고, flex-row와 justify-center를 통해 가운데 정렬합니다. */}
            <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center">
                    <label htmlFor="date" className="mr-3 font-semibold text-gray-700 whitespace-nowrap">날짜:</label>
                    <input
                        type="date"
                        id="date"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center">
                    <label htmlFor="group" className="mr-3 font-semibold text-gray-700 whitespace-nowrap">Shipping Group:</label>
                    <input
                        type="text"
                        id="group"
                        value={groupInput}
                        onChange={(e) => setGroupInput(e.target.value)}
                        placeholder="예: 01, 02"
                        className="p-2 border border-gray-300 rounded-md w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={fetchPackingPlan}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition duration-200 shadow-lg"
                    disabled={loading}
                >
                    {loading ? '조회 중...' : '적재 계획 조회'}
                </button>
            </div>

            <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-100 top-4">
                <div id="info-panel" className="absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-xl z-10 text-gray-800">
                    <h2 className="font-bold text-lg mb-2 text-blue-700">컨테이너 적재 시각화</h2>
                    <p className="text-sm mb-1">컨테이너 치수: {CONTAINER_LENGTH}" L x {CONTAINER_WIDTH}" W x {CONTAINER_HEIGHT}" H</p>
                    <p className="text-sm mb-1">총 적재된 팔레트: <span className="font-semibold">{packingData.packedCount}</span>개</p>
                    <p className="text-sm mb-1">시점 변경: 마우스 왼쪽 버튼 드래그</p>
                    <p className="text-sm">확대/축소: 마우스 휠 스크롤</p>
                    <div className="mt-3">
                        <h3 className="font-semibold text-md mb-1">팔레트 유형:</h3>
                        <div className="flex items-center text-sm mb-1">
                            <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: '#FF6347' }}></div>
                            <span>유형 A (59"x39"x50", 39"W)</span>
                        </div>
                        <div className="flex items-center text-sm mb-1">
                            <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: '#FFA07A' }}></div>
                            <span>유형 A (59"x39"x50", 59"W)</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: '#4682B4' }}></div>
                            <span>유형 B (73"x47"x49")</span>
                        </div>
                    </div>
                </div>
                <div
                    ref={mountRef}
                    style={{ width: '200vh', height: '80vh', background: '#111', minHeight: '300px', marginBottom: '100px' }}
                    className="flex justify-center items-center rounded-lg shadow-inner"
                >
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75 text-gray-700 text-lg rounded-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mr-4"></div>
                            <p>3D 모델 생성 중...</p>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-75 text-red-600 text-lg rounded-lg">
                            <p>오류 발생: {error}</p>
                        </div>
                    )}
                    {!loading && !error && (!packingData.packedPallets || packingData.packedPallets.length === 0) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 text-gray-600 text-lg rounded-lg">
                            <p>적재할 팔레트 데이터가 없거나, 적재된 팔레트가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContainerPackingViz;
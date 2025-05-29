import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import axios from 'axios';

// Define container dimensions (inches)
const CONTAINER_LENGTH = 635.8;
const CONTAINER_WIDTH = 102.4;
const CONTAINER_HEIGHT = 110.2;

// API endpoint address (Node.js Express server address)
const API_BASE_URL = 'http://66.118.96.42:28001/api';

const ContainerPackingViz = () => {
    // Three.js scene refs
    const mountRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const animationIdRef = useRef(null);
    const sceneRef = useRef(null);

    // State for packing data and UI interactions
    const [packingData, setPackingData] = useState({ packedPallets: [], packedCount: 0, totalWeight: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for date and shipping group inputs
    const [dateInput, setDateInput] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [groupInput, setGroupInput] = useState('01');

    /**
     * Fetches packing plan data from the API.
     */
    const fetchPackingPlan = useCallback(async () => {
        if (!dateInput || !groupInput) {
            setError("날짜와 Shipping Group을 모두 입력해주세요.");
            setPackingData({ packedPallets: [], packedCount: 0, totalWeight: 0 }); // Clear previous data
            return;
        }

        setLoading(true);
        setError(null);
        setPackingData({ packedPallets: [], packedCount: 0, totalWeight: 0 }); // Clear previous data when fetching new one

        try {
            const formattedDate = dateInput.replace(/-/g, '');
            const group = groupInput;

            console.log(`[API Call] API 호출 시작: ${API_BASE_URL}/packing/pallets?date=${formattedDate}&group=${group}`);
            const response = await axios.get(`${API_BASE_URL}/packing/pallets?date=${formattedDate}&group=${group}`);

            const fetchedPallets = Array.isArray(response.data) ? response.data : response.data.packedPallets || [];
            const fetchedCount = response.data.packedCount || fetchedPallets.length;
            // Correctly extract and set totalWeight
            const fetchedTotalWeight = response.data.totalWeight || 0; 

            setPackingData({ packedPallets: fetchedPallets, packedCount: fetchedCount, totalWeight: fetchedTotalWeight });
            console.log("[API Call] 적재 데이터 수신 성공:", { packedPallets: fetchedPallets, packedCount: fetchedCount, totalWeight: fetchedTotalWeight });
        } catch (err) {
            console.error("[API Call] 적재 데이터 가져오는 중 오류 발생:", err.response?.data || err.message);
            setError(err.response?.data?.msg || err.message || "데이터를 가져오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [dateInput, groupInput]);

    /**
     * Handles window resize events to update Three.js renderer and camera.
     */
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

    // Effect for handling window resize listener
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial resize after component mounts
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    /**
     * Cleans up Three.js resources (geometry, materials, scene, renderer, controls).
     */
    const cleanupThreeJS = useCallback(() => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }
        if (controlsRef.current) {
            controlsRef.current.dispose();
            controlsRef.current = null;
        }
        if (rendererRef.current) {
            if (rendererRef.current.domElement && mountRef.current?.contains(rendererRef.current.domElement)) {
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
        cameraRef.current = null;
    }, []);

    // Effect for setting up and tearing down the Three.js scene
    useEffect(() => {
        console.log("[useEffect-Three.js] useEffect 실행됨");
        console.log("[useEffect-Three.js] packingData:", packingData);
        console.log("[useEffect-Three.js] mountRef.current:", mountRef.current);

        if (!mountRef.current || loading || error || !packingData.packedPallets || packingData.packedPallets.length === 0) {
            console.log("[useEffect-Three.js] 조건 미충족 (mountRef, loading, error, or packedPallets 없음), Three.js 씬 초기화 건너뜀.");
            cleanupThreeJS();
            return;
        }

        // Cleanup existing Three.js scene before creating a new one
        cleanupThreeJS(); 

        console.log("[useEffect-Three.js] Three.js 씬 초기화 시작.");
        const currentMount = mountRef.current;
        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;

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

        // Container wireframe
        const containerGeometry = new THREE.BoxGeometry(CONTAINER_LENGTH, CONTAINER_HEIGHT, CONTAINER_WIDTH);
        const containerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, wireframe: true, transparent: true, opacity: 0.2
        });
        const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
        containerMesh.position.set(CONTAINER_LENGTH / 2, CONTAINER_HEIGHT / 2, CONTAINER_WIDTH / 2);
        scene.add(containerMesh);

        // Pallet colors
        const palletColors = {
            "A_39W": new THREE.Color(0xFF6347), // Tomato
            "A_59W": new THREE.Color(0xFFA07A), // LightSalmon
            "B": new THREE.Color(0x4682B4),     // SteelBlue
            "default": new THREE.Color(0x808080) // Grey
        };
        const lineColor = 0x333333; // Dark grey for pallet edges

        // Add packed pallets to the scene
        packingData.packedPallets.forEach(p => {
            const palletGeometry = new THREE.BoxGeometry(p.length, p.height, p.width);
            const palletMaterial = new THREE.MeshLambertMaterial({ color: palletColors[p.type] || palletColors.default });

            const palletMesh = new THREE.Mesh(palletGeometry, palletMaterial);
            palletMesh.position.set(
                p.x + p.length / 2,
                p.z + p.height / 2,
                p.y + p.width / 2
            );
            scene.add(palletMesh);

            // Add edges to pallets for better visibility
            const edges = new THREE.EdgesGeometry(palletGeometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 }));
            line.position.copy(palletMesh.position);
            scene.add(line);
        });

        // Add lighting to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(CONTAINER_LENGTH * 1.5, CONTAINER_HEIGHT * 2, CONTAINER_WIDTH * 1.5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        console.log("[useEffect-Three.js] Scene children count (컨테이너, 팔레트, 조명 포함):", scene.children.length);

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);
            controlsRef.current.update();
            rendererRef.current.render(scene, cameraRef.current);
        };
        animate();

        // Cleanup function for useEffect
        return cleanupThreeJS; // Use the memoized cleanup function
    }, [packingData, loading, error, cleanupThreeJS]); // Add cleanupThreeJS to dependency array

    return (
        <div className="p-4">
            {/* Input and button controls */}
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

            {/* Three.js Visualization Area and Info Panel */}
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-100 top-4">
                {/* Info Panel */}
                <div id="info-panel" className="absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-xl z-10 text-gray-800">
                    <h2 className="font-bold text-lg mb-2 text-blue-700">컨테이너 적재 시각화</h2>
                    <p className="text-sm mb-1">컨테이너 치수: {CONTAINER_LENGTH}" L x {CONTAINER_WIDTH}" W x {CONTAINER_HEIGHT}" H</p>
                    <p className="text-sm mb-1">총 적재된 팔레트: <span className="font-semibold">{packingData.packedCount}</span>개</p>
                    {/* Display totalWeight here */}
                    <p className="text-sm mb-1">총 적재된 무게: <span className="font-semibold">{packingData.totalWeight.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span> lb</p>
                    <p className="text-sm mb-1">시점 변경: 마우스 왼쪽 버튼 드래그</p>
                    <p className="text-sm">확대/축소: 마우스 휠 스크롤</p>
                    <div className="mt-3">
                        <h3 className="font-semibold text-md mb-1">팔레트 유형:</h3>
                        <div className="flex items-center text-sm mb-1">
                            <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: '#FF6347' }}></div>
                            <span>유형 A1 (39"x59"x50", 39"W)</span>
                        </div>
                        <div className="flex items-center text-sm mb-1">
                            <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: '#FFA07A' }}></div>
                            <span>유형 A2 (59"x39"x50", 59"W)</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: '#4682B4' }}></div>
                            <span>유형 B (73"x47"x49")</span>
                        </div>
                    </div>
                </div>
                {/* Three.js Canvas */}
                <div
                    ref={mountRef}
                    style={{ width: '200vh', height: '80vh', background: '#111', minHeight: '300px', marginBottom: '100px' }}
                    className="flex justify-center items-center rounded-lg shadow-inner"
                >
                    {/* Loading, Error, and No Data Messages */}
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
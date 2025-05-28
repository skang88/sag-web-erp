import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // .js 확장자 유지
import axios from 'axios'; // API 호출을 위한 axios

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // API 호출 및 적재 데이터 가져오기
    const fetchPackingPlan = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const date = '20250528'; 
            const group = '01'; 
            
            console.log(`[API Call] API 호출 시작: ${API_BASE_URL}/packing/pallets?date=${date}&group=${group}`);
            const response = await axios.get(`${API_BASE_URL}/packing/pallets?date=${date}&group=${group}`);
            
            // API 응답 구조에 따라 packedPallets와 packedCount를 추출
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
    }, []);

    // 컴포넌트 마운트 시 API 호출
    useEffect(() => {
        fetchPackingPlan();
    }, [fetchPackingPlan]);

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

        // mountRef가 준비되지 않았거나, packedPallets 배열이 비어있으면 씬 초기화 중단
        // 로딩 중이거나 에러 상태일 때도 씬을 초기화하지 않음
        if (!mountRef.current || loading || error || !packingData.packedPallets || packingData.packedPallets.length === 0) {
            console.log("[useEffect-Three.js] 조건 미충족 (mountRef, loading, error, or packedPallets 없음), useEffect 종료됨.");
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
        
        // 기존 렌더러가 있다면 제거
        if (rendererRef.current) {
            if (rendererRef.current.domElement && mountRef.current.contains(rendererRef.current.domElement)) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current.dispose();
            rendererRef.current = null;
        }
        // 기존 컨트롤이 있다면 제거
        if (controlsRef.current) {
            controlsRef.current.dispose();
            controlsRef.current = null;
        }
        // 기존 애니메이션 프레임 취소
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

        // 캔버스 크기가 유효한지 다시 확인
        if (width === 0 || height === 0) {
            console.error("[useEffect-Three.js] mountRef dimensions are zero. Cannot initialize Three.js scene.");
            return;
        }

        // 씬 생성
        const scene = new THREE.Scene();
        sceneRef.current = scene; // 씬 참조 저장
        scene.background = new THREE.Color(0xe2e8f0); // 연한 회색 배경

        // 카메라 설정
        const fov = 45;
        const aspect = width / height;
        const near = 0.1;
        const far = 2000;
        cameraRef.current = new THREE.PerspectiveCamera(fov, aspect, near, far);
        
        // 컨테이너의 중심 계산 (카메라가 바라볼 타겟)
        const containerCenterX = CONTAINER_LENGTH / 2;
        const containerCenterY = CONTAINER_HEIGHT / 2;
        const containerCenterZ = CONTAINER_WIDTH / 2;

        // 카메라 초기 위치 설정: 컨테이너를 잘 볼 수 있는 위치
        cameraRef.current.position.set(
            containerCenterX + CONTAINER_LENGTH * 0.8, // X축 방향으로 약간 이동
            containerCenterY + CONTAINER_HEIGHT * 1.5, // Y축 (높이) 방향으로 위로 이동
            containerCenterZ + CONTAINER_WIDTH * 1.0  // Z축 (깊이) 방향으로 약간 이동
        );

        // 렌더러 설정
        rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
        rendererRef.current.setSize(width, height);
        rendererRef.current.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(rendererRef.current.domElement); 
        
        // 렌더러 캔버스에 임시 배경색 추가 (캔버스가 그려지는지 확인)
        rendererRef.current.domElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)'; // 투명한 빨간색

        // OrbitControls 설정
        controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
        controlsRef.current.enableDamping = true; 
        controlsRef.current.dampingFactor = 0.05;
        controlsRef.current.screenSpacePanning = false; 
        controlsRef.current.maxPolarAngle = Math.PI / 2; // 지면 아래로 카메라가 내려가지 않도록 제한
        // 컨트롤의 타겟을 컨테이너의 중심으로 설정
        controlsRef.current.target.set(containerCenterX, containerCenterY, containerCenterZ);
        controlsRef.current.update(); // 타겟 설정 후 컨트롤 업데이트 필수

        // --- 컨테이너 모델 생성 ---
        const containerGeometry = new THREE.BoxGeometry(CONTAINER_LENGTH, CONTAINER_HEIGHT, CONTAINER_WIDTH);
        const containerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, wireframe: true, transparent: true, opacity: 0.2
        });
        const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
        // 컨테이너의 바닥-왼쪽-앞 모서리가 (0,0,0)에 오도록 메시의 위치를 조정
        containerMesh.position.set(CONTAINER_LENGTH / 2, CONTAINER_HEIGHT / 2, CONTAINER_WIDTH / 2);
        scene.add(containerMesh);

        // --- 팔레트 모델 생성 ---
        const palletTypeA39WColor = new THREE.Color(0xFF6347); // 토마토
        const palletTypeA59WColor = new THREE.Color(0xFFA07A); // 라이트 살몬
        const palletTypeBColor = new THREE.Color(0x4682B4); // 스틸 블루
        const lineColor = 0x333333; // 진한 회색

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
                palletMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 }); // 기본 회색
            }

            const palletMesh = new THREE.Mesh(palletGeometry, palletMaterial);
            // 팔레트의 위치 설정: API 데이터의 x, y, z는 팔레트의 바닥-왼쪽-앞 모서리 좌표로 가정
            // Three.js의 BoxGeometry는 중심이 (0,0,0)이므로, 각 축의 절반 길이를 더해줘야 합니다.
            // p.x -> Three.js X (length)
            // p.z -> Three.js Y (height) - packing data의 z가 높이로 사용됨
            // p.y -> Three.js Z (width) - packing data의 y가 너비로 사용됨
            palletMesh.position.set(
                p.x + p.length / 2, 
                p.z + p.height / 2, 
                p.y + p.width / 2 
            );
            scene.add(palletMesh);

            // --- 박스별 구분선 추가 ---
            const edges = new THREE.EdgesGeometry(palletGeometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 }));
            line.position.copy(palletMesh.position); // 팔레트 메시와 동일한 위치에 선 추가
            scene.add(line);
        });

        // --- 조명 추가 ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // 부드러운 전역 조명
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // 특정 방향에서 오는 조명
        // 컨테이너 크기에 비례하여 조명 위치 설정
        directionalLight.position.set(CONTAINER_LENGTH * 1.5, CONTAINER_HEIGHT * 2, CONTAINER_WIDTH * 1.5);
        directionalLight.castShadow = true; // 그림자 활성화
        scene.add(directionalLight);

        console.log("[useEffect-Three.js] Scene children count (컨테이너, 팔레트, 조명 포함):", scene.children.length);

        // 애니메이션 루프
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate); 
            controlsRef.current.update(); // OrbitControls 업데이트
            rendererRef.current.render(scene, cameraRef.current); // 씬 렌더링
        };
        animate(); // 애니메이션 시작

        // 컴포넌트 언마운트 시 클린업 함수
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
            // 씬의 모든 객체 및 재료, 지오메트리 해제
            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (!object.isMesh) return;
                    object.geometry.dispose();
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    } else {
                        // 배열인 경우 (예: MeshLambertMaterial)
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
    }, [packingData, loading, error]); // packingData, loading, error가 변경될 때마다 useEffect 재실행

    // --- 렌더링될 React UI ---
    return (
        // 최상위 div는 부모의 높이를 따르도록 h-full 유지 (만약 부모가 h-screen이면 이 컴포넌트도 h-screen이 됨)
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-100">
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
            {/* mountRef가 참조하는 div에 인라인 스타일로 높이와 너비를 직접 지정 */}
            {/* 사용자께서 확인해주신 스타일을 유지합니다. */}
            <div 
                ref={mountRef} 
                style={{ width: '200vh', height: '80vh', background: '#111', minHeight: '300px', marginBottom: '100px'  }} 
                className="flex justify-center items-center rounded-lg shadow-inner" // flex 클래스 유지 및 추가 스타일
            >
                {/* Three.js 캔버스가 여기에 렌더링됩니다 */}
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
                {/* 데이터는 로드되었으나 팔레트가 없는 경우 메시지 */}
                {!loading && !error && (!packingData.packedPallets || packingData.packedPallets.length === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 text-gray-600 text-lg rounded-lg">
                        <p>적재할 팔레트 데이터가 없거나, 적재된 팔레트가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContainerPackingViz;

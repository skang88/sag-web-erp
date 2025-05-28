import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Plane, Grid } from '@react-three/drei';

// 트레일러 내부 치수 (cm 단위 가정)
const TRAILER_INNER_DIM = {
  width: 240,
  depth: 1600,
  height: 270,
};

const BOX_GAP = 2; // 박스 사이 간격(cm)

// 팔레트 3D 모델 컴포넌트
function Pallet({ position, args, color, id }) {
  const meshRef = useRef();
  return (
    <Box ref={meshRef} position={position} args={args}>
      <meshStandardMaterial color={color} />
      {/* 나중에 팔레트 정보 텍스트 등을 추가할 수 있습니다. */}
    </Box>
  );
}

// 트레일러 바닥면 컴포넌트
function TrailerFloor({ width, depth }) {
  return (
    <Plane
      args={[width, depth]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]} // 바닥의 중심이 아닌 상단이 Y=0에 오도록 Y 위치 조정
    >
      <meshStandardMaterial color="#888888" />
      <Grid
        args={[width, depth]}
        divisions={20}
        cellColor="#444444"
        sectionColor="#cccccc"
        position={[0, 0.01, 0]} // 바닥 평면 위로 살짝 띄워서 Z-fighting 방지
        rotation={[0, 0, 0]}
      />
    </Plane>
  );
}

// 트레일러 벽 컴포넌트 (투명)
function TrailerWalls({ width, height, depth }) {
  const wallMaterial = (
    <meshStandardMaterial color="#666666" transparent opacity={0.2} />
  );
  return (
    <>
      {/* 후면 벽 (적재 시작 지점) */}
      <Box args={[width, height, 0.1]} position={[0, height / 2, -depth / 2]}>
        {wallMaterial}
      </Box>
      {/* 전면 벽 */}
      <Box args={[width, height, 0.1]} position={[0, height / 2, depth / 2]}>
        {wallMaterial}
      </Box>
      {/* 좌측 벽 */}
      <Box args={[0.1, height, depth]} position={[-width / 2, height / 2, 0]}>
        {wallMaterial}
      </Box>
      {/* 우측 벽 */}
      <Box args={[0.1, height, depth]} position={[width / 2, height / 2, 0]}>
        {wallMaterial}
      </Box>
      {/* 상단 (천장) */}
      <Box args={[width, 0.1, depth]} position={[0, height, 0]}>
        {wallMaterial}
      </Box>
    </>
  );
}

function PalletPacking({ itemsToLoad = [] }) {
  const [packedBoxes, setPackedBoxes] = useState([]);
  const [packingStatus, setPackingStatus] = useState('idle'); // idle, packing, packed, packed_with_overflow, error

  useEffect(() => {
    // itemsToLoad가 없으면 패킹을 시작하지 않음
    if (itemsToLoad.length === 0) {
      setPackedBoxes([]);
      setPackingStatus('idle');
      return;
    }

    setPackingStatus('packing');
    const newPackedBoxes = [];

    // 부피 기준 내림차순 정렬 (선택)
    const sortedItems = [...itemsToLoad].sort((a, b) => {
      const volA = a.dimensions.width * a.dimensions.height * a.dimensions.depth;
      const volB = b.dimensions.width * b.dimensions.height * b.dimensions.depth;
      return volB - volA;
    });

    // 트레일러의 중앙을 (0,0,0)으로 가정하고 계산
    // Three.js에서 Box의 position은 중심이므로, 실제 시작점은 -dim/2
    let currentX = -TRAILER_INNER_DIM.width / 2;
    let currentY = 0; // Y=0이 바닥면이 되도록 TrailerFloor에서 조정했음
    let currentZ = -TRAILER_INNER_DIM.depth / 2;

    let currentRowMaxHeight = 0; // 현재 Z축 행에서 가장 높은 박스의 높이
    let currentLayerMaxDepth = 0; // 현재 Y축 층에서 가장 깊은 박스의 깊이

    try {
      for (const item of sortedItems) {
        const itemOriginalWidth = item.dimensions.width;
        const itemOriginalHeight = item.dimensions.height;
        const itemOriginalDepth = item.dimensions.depth;

        for (let i = 0; i < item.palletCount; i++) {
          let currentPalletWidth = itemOriginalWidth;
          let currentPalletHeight = itemOriginalHeight;
          let currentPalletDepth = itemOriginalDepth;
          let rotated = false; // 현재 팔레트가 회전되었는지 여부

          // --- 간단한 회전 로직 시작 ---
          // 현재 X축에 원래 너비가 들어갈 수 있는지 확인
          const originalFitsInCurrentXRow = (currentX + currentPalletWidth + BOX_GAP <= TRAILER_INNER_DIM.width / 2);
          // 회전된 너비 (원래 깊이)가 현재 X축에 들어갈 수 있는지 확인
          const rotatedWidth = itemOriginalDepth;
          const rotatedDepth = itemOriginalWidth;
          const rotatedFitsInCurrentXRow = (currentX + rotatedWidth + BOX_GAP <= TRAILER_INNER_DIM.width / 2);

          // 원래 너비는 안 들어가지만, 회전된 너비는 들어간다면 회전 적용
          if (!originalFitsInCurrentXRow && rotatedFitsInCurrentXRow) {
            currentPalletWidth = rotatedWidth;
            currentPalletDepth = rotatedDepth;
            rotated = true;
          }
          // --- 간단한 회전 로직 끝 ---

          // 1. 현재 X축에 박스가 들어갈 수 있는지 확인
          // (현재 X 위치 + 박스 너비 + 간격)이 트레일러의 절반 너비(오른쪽 끝)를 초과하는지
          if (currentX + currentPalletWidth + BOX_GAP > TRAILER_INNER_DIM.width / 2) {
            // X축 공간 부족: 다음 Z축 행으로 이동
            currentX = -TRAILER_INNER_DIM.width / 2; // X축 초기화 (왼쪽 끝)
            currentZ += currentLayerMaxDepth + BOX_GAP; // Z축 이동 (현재 층의 가장 깊은 박스만큼)
            currentLayerMaxDepth = 0; // 새 Z축 행 시작 시 깊이 초기화
          }

          // 2. 현재 Z축에 박스가 들어갈 수 있는지 확인 (새로운 Z축 행으로 이동 후)
          // (현재 Z 위치 + 박스 깊이 + 간격)이 트레일러의 절반 깊이(뒤쪽 끝)를 초과하는지
          if (currentZ + currentPalletDepth + BOX_GAP > TRAILER_INNER_DIM.depth / 2) {
            // Z축 공간 부족: 다음 Y축 층으로 이동
            currentX = -TRAILER_INNER_DIM.width / 2; // X축 초기화
            currentZ = -TRAILER_INNER_DIM.depth / 2; // Z축 초기화 (앞쪽 끝)
            currentY += currentRowMaxHeight + BOX_GAP; // Y축 이동 (이전 층의 가장 높은 박스만큼)
            currentRowMaxHeight = 0; // 새 Y축 층 시작 시 높이 초기화
          }

          // 3. 현재 Y축에 박스가 들어갈 수 있는지 확인 (새로운 Y축 층으로 이동 후)
          // (현재 Y 위치 + 박스 높이 + 간격)이 트레일러의 전체 높이를 초과하는지
          if (currentY + currentPalletHeight + BOX_GAP > TRAILER_INNER_DIM.height) {
            console.warn(`트레일러 공간 부족: ${item.itemName} (${item.partNumber}) 팔레트 ${i + 1} 적재 불가`);
            setPackingStatus('packed_with_overflow');
            break; // 이 아이템의 나머지 팔레트도 적재 불가
          }

          // 박스 위치 계산 (중앙 기준)
          const position = [
            currentX + currentPalletWidth / 2,
            currentY + currentPalletHeight / 2, // Y=0이 바닥이므로, 박스 높이의 절반이 중심 Y 좌표
            currentZ + currentPalletDepth / 2,
          ];

          newPackedBoxes.push({
            id: `${item.partNumber}-${i}-${rotated ? 'R' : 'O'}`, // ID에 회전 정보 추가 (디버깅용)
            width: currentPalletWidth,
            height: currentPalletHeight,
            depth: currentPalletDepth,
            position,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
          });

          // 다음 박스를 위한 X 위치 업데이트
          currentX += currentPalletWidth + BOX_GAP;

          // 현재 행/층의 최대 높이 및 깊이 업데이트
          if (currentPalletHeight > currentRowMaxHeight) currentRowMaxHeight = currentPalletHeight;
          if (currentPalletDepth > currentLayerMaxDepth) currentLayerMaxDepth = currentPalletDepth;
        }
      }
      // packingStatus는 마지막에 최종적으로 설정
      setPackingStatus(prev => (prev === 'packed_with_overflow' ? prev : 'packed'));
    } catch (error) {
      console.error('Packing algorithm error:', error);
      setPackingStatus('error');
    }

    setPackedBoxes(newPackedBoxes);
  }, [itemsToLoad]); // itemsToLoad prop이 변경될 때마다 재실행

  // 로딩, 오류, 유휴 상태 UI
  if (packingStatus === 'idle' && itemsToLoad.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#555' }}>
        적재할 아이템이 없습니다. 상위 컴포넌트에서 아이템을 조회해주세요.
      </div>
    );
  }

  if (packingStatus === 'packing') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>3D 트레일러 적재 시뮬레이션 중...</h2>
        <p>최적의 배치를 계산하고 있습니다.</p>
      </div>
    );
  }

  if (packingStatus === 'error') {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <h2>3D 적재 시뮬레이션 중 오류가 발생했습니다.</h2>
        <p>콘솔을 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
      <Canvas
        camera={{
          // 카메라 위치 조정: 트레일러를 전체적으로 볼 수 있도록
          // 트레일러의 중앙을 기준으로 약간 위, 뒤에서 바라보도록 조정
          position: [0, TRAILER_INNER_DIM.height * 1.5, TRAILER_INNER_DIM.depth * 0.8],
          fov: 45
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[TRAILER_INNER_DIM.width, TRAILER_INNER_DIM.height * 2, TRAILER_INNER_DIM.depth]} intensity={1.2} />
        <directionalLight position={[-TRAILER_INNER_DIM.width, TRAILER_INNER_DIM.height * 2, -TRAILER_INNER_DIM.depth]} intensity={0.7} />

        <OrbitControls />

        {/* 트레일러 바닥 */}
        <TrailerFloor width={TRAILER_INNER_DIM.width} depth={TRAILER_INNER_DIM.depth} />

        {/* 트레일러 벽 (투명하게) */}
        <TrailerWalls
          width={TRAILER_INNER_DIM.width}
          height={TRAILER_INNER_DIM.height}
          depth={TRAILER_INNER_DIM.depth}
        />

        {/* 적재된 박스들 */}
        {packedBoxes.map(box => (
          <Pallet
            key={box.id}
            position={box.position}
            args={[box.width, box.height, box.depth]}
            color={box.color}
            id={box.id}
          />
        ))}
      </Canvas>
      {packingStatus === 'packed_with_overflow' && (
        <div style={{ textAlign: 'center', color: 'orange', marginTop: '10px' }}>
          일부 아이템은 트레일러 공간 부족으로 적재되지 못했습니다.
        </div>
      )}
    </div>
  );
}

// App 컴포넌트는 PalletPacking을 테스트하기 위한 임시 래퍼입니다.
// 실제 애플리케이션에서는 TrailerItemsFetcher에서 items를 받아 PalletPacking에 전달해야 합니다.
export default function App() {
  // 실제 API에서 가져올 데이터 대신 임시 데이터 사용
  const sampleItems = [
    {
      partNumber: '49500-TD100',
      itemName: 'MEa 4WD FRT, 70KW MOTOR, LH/RH',
      palletCount: 2,
      dimensions: { width: 59, height: 50, depth: 39 },
    },
    {
      partNumber: '49500-TD200',
      itemName: 'MVa 4WD FRT, 160KW MOTOR, LH/RH',
      palletCount: 1,
      dimensions: { width: 59, height: 50, depth: 39 },
    },
    {
      partNumber: '49560-DO000',
      itemName: 'Bearing BRKT & Shaft Assy, Inner',
      palletCount: 1,
      dimensions: { width: 59, height: 50, depth: 39 },
    },
    {
      partNumber: '51700-PI100',
      itemName: 'NEa PE Axle & Brake Complete FR, LH (AWD)',
      palletCount: 10, // 팔레트 개수가 많아서 공간 부족을 테스트하기 좋음
      dimensions: { width: 59, height: 50, depth: 39 },
    },
    {
      partNumber: 'P001',
      itemName: 'Small Box',
      palletCount: 20,
      dimensions: { width: 30, height: 20, depth: 25 },
    },
    {
      partNumber: 'P002',
      itemName: 'Tall Box',
      palletCount: 5,
      dimensions: { width: 40, height: 80, depth: 35 },
    },
    {
      partNumber: 'P003',
      itemName: 'Wide Box',
      palletCount: 4,
      dimensions: { width: 70, height: 30, depth: 40 },
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}> {/* 높이를 100vh로 조정 */}
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <PalletPacking itemsToLoad={sampleItems} />
      </div>
      <div style={{ height: 50, background: '#222', color: 'white', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
        {/* PalletPacking 내부의 packingStatus를 여기에 표시하려면 상태 끌어올리기가 필요합니다. */}
        {/* 지금은 PalletPacking 컴포넌트 자체에서 상태 메시지를 표시하고 있으므로 여기는 임시 텍스트로 둡니다. */}
        패킹 시뮬레이션 상태 표시 영역 (상세 상태는 3D 뷰어 내부에서 확인)
      </div>
    </div>
  );
}
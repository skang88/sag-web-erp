// packingLogic.js

// 컨테이너 치수 정의 (인치)
const CONTAINER_LENGTH = 635.8;
const CONTAINER_WIDTH = 102.4;
const CONTAINER_HEIGHT = 110.2;

// 팔레트를 나타내는 클래스
class Pallet {
    constructor(serial, length, width, height, partNumber, itemName, originalWidth) {
        this.serial = serial;
        this.length = length; // 현재 배치될 때의 길이
        this.width = width;   // 현재 배치될 때의 너비
        this.height = height;
        this.partNumber = partNumber;
        this.itemName = itemName;
        this.x = 0; // 컨테이너 내 X 위치
        this.y = 0; // 컨테이너 내 Y 위치
        this.z = 0; // 컨테이너 내 Z 위치
        this.originalWidth = originalWidth; // 팔레트의 원본 너비 (59x39일 경우 39)
        this.type = ''; // 시각화용 타입 라벨 (A_39W, A_59W, B 등)
    }

    toString() {
        return `Pallet(Serial=${this.serial}, Dims=(${this.length}x${this.width}x${this.height}), Pos=(${this.x},${this.y},${this.z}), Type=${this.type})`;
    }
}

// 컨테이너를 나타내는 클래스
class Container {
    constructor(length, width, height) {
        this.length = length;
        this.width = width;
        this.height = height;
        this.packedPallets = []; // 적재된 팔레트 목록
        // currentX, currentY, currentZ는 각 적재 로직 내에서 관리하는 것이 더 유연하므로 여기서는 제거합니다.
    }

    // 특정 위치에 팔레트가 배치 가능한지 확인
    canPlace(palletLength, palletWidth, palletHeight, currentXPos, currentYPos, currentZPos) {
        return (currentXPos + palletLength <= this.length &&
                currentYPos + palletWidth <= this.width &&
                currentZPos + palletHeight <= this.height);
    }
}

/**
 * 팔레트 적재 계획을 계산하는 함수.
 * @param {Array<Object>} palletDataList - 적재할 팔레트 데이터 배열.
 * @returns {Object} 적재 결과 (적재된/안된 팔레트, 남은 공간 등).
 */
function performPacking(palletDataList) {
    const container = new Container(CONTAINER_LENGTH, CONTAINER_WIDTH, CONTAINER_HEIGHT);

    const allPalletsToPack = [];
    for (const palletInfo of palletDataList) {
        const dims = palletInfo.dimensions;
        // API에서 받은 dimensions.width는 실제 팔레트의 '긴 면'으로 가정하고,
        // dimensions.depth는 '짧은 면'으로 가정합니다.
        // 예를 들어 59x39 팔레트의 경우 dims.width=59, dims.depth=39 입니다.
        // 그리고 높이는 dims.height 입니다.

        // 여기서는 Pallet 클래스의 length, width, height를 Three.js 렌더링에 필요한
        // 팔레트의 실제 치수(x, y, z 축에 대응)로 초기화합니다.
        // 즉, API 데이터의 width -> Pallet.length, depth -> Pallet.width, height -> Pallet.height
        // A_39W는 (59L x 39W x 50H), A_59W는 (39L x 59W x 50H)로 "회전"된 상태를 나타냅니다.
        // B는 (73L x 47W x 49H) 입니다.
        // originalWidth는 39 또는 47 (가장 짧은 면)으로 고정하여 A/B 타입 구분에 사용합니다.
        allPalletsToPack.push(new Pallet(
            palletInfo.palletSerial,
            dims.width,  // 초기 length (API dims.width)
            dims.depth,  // 초기 width (API dims.depth)
            dims.height, // 초기 height (API dims.height)
            palletInfo.partNumber,
            palletInfo.itemName,
            dims.depth   // originalWidth를 dims.depth로 설정 (39 또는 47)
        ));
    }

    // ----------------------------------------------------
    // 핵심 수정 부분: 팔레트 정렬 (유형 B를 위해)
    // ----------------------------------------------------
    // 유형 A 팔레트 (originalWidth가 39인 팔레트)
    const palletsTypeA = allPalletsToPack.filter(p => p.originalWidth === 39);
    // 유형 B 팔레트 (originalWidth가 47인 팔레트)
    let palletsTypeB = allPalletsToPack.filter(p => p.originalWidth === 47);

    // 유형 B 팔레트를 partNumber (또는 itemName) 기준으로 정렬
    // 이렇게 하면 같은 품번의 팔레트가 연속으로 오게 되어, 적재 시 같은 품번끼리 모이게 됩니다.
    palletsTypeB.sort((a, b) => {
        if (a.partNumber < b.partNumber) return -1;
        if (a.partNumber > b.partNumber) return 1;
        return 0; // partNumber가 같으면 순서 유지
    });
    // itemName으로 정렬하고 싶다면:
    // palletsTypeB.sort((a, b) => {
    //     if (a.itemName < b.itemName) return -1;
    //     if (a.itemName > b.itemName) return 1;
    //     return 0;
    // });
    // ----------------------------------------------------

    let packedCount = 0;
    const unpackedPallets = [];

    // --- 적재 로직 시작 ---

    // 1. 유형 A 팔레트 적재 (혼합 방향: 39W + 59W = 98W)
    let aTypeHeightUsed = 0; // 현재 높이 레벨 (Z)
    let aTypeYCursor = 0;    // 현재 Y 커서 (너비 방향)
    let aTypeXCursor = 0;    // 현재 X 커서 (길이 방향)
    let aTypePairCounter = 0; // 팔레트 A가 짝수/홀수 번째인지 추적 (한 쌍의 첫/둘째)

    for (const p of palletsTypeA) {
        let currentPallet = p;
        let finalLength, finalWidth, finalHeight, typeLabel;

        if (aTypePairCounter % 2 === 0) { // 첫 번째 팔레트 (39W로 배치)
            finalLength = 59;
            finalWidth = 39;
            finalHeight = 50; // A타입 팔레트의 고정 높이
            typeLabel = 'A_39W';
        } else { // 두 번째 팔레트 (59W로 회전 배치)
            finalLength = 39; // 회전 후 길이
            finalWidth = 59;  // 회전 후 너비
            finalHeight = 50; // A타입 팔레트의 고정 높이
            typeLabel = 'A_59W';
        }

        // 현재 위치에 배치 가능한지 확인
        if (!container.canPlace(finalLength, finalWidth, finalHeight, aTypeXCursor, aTypeYCursor, aTypeHeightUsed)) {
            // 현재 Y열에 공간이 없으면 (새 행으로 이동)
            // 즉, 현재 팔레트의 너비(finalWidth)를 더했을 때 컨테이너 너비를 초과하면 Y를 리셋하고 X 이동
            if (aTypeYCursor + finalWidth > CONTAINER_WIDTH) {
                aTypeXCursor += 59; // 이전 A 유형 팔레트의 최대 길이(59)만큼 X 이동
                aTypeYCursor = 0;   // Y 커서 리셋
                aTypePairCounter = 0; // 새 행이므로 쌍 카운터 리셋
            }

            // X 커서가 컨테이너 길이를 초과하면 Z 커서를 다음 층으로 이동 시도
            if (aTypeXCursor + finalLength > CONTAINER_LENGTH) {
                aTypeHeightUsed += 50; // A 유형 팔레트 높이(50)만큼 Z 이동
                aTypeXCursor = 0;      // X 커서 리셋
                aTypeYCursor = 0;      // Y 커서 리셋
                aTypePairCounter = 0;  // 새 층이므로 쌍 카운터 리셋
            }

            // 모든 이동 후에도 배치 불가능하면
            if (!container.canPlace(finalLength, finalWidth, finalHeight, aTypeXCursor, aTypeYCursor, aTypeHeightUsed)) {
                unpackedPallets.push(p); // 적재 불가
                console.warn(`[A Type] Could not place pallet ${p.serial} at final attempt. Skipping.`);
                continue; // 다음 팔레트로 넘어감
            }
        }
        
        // 팔레트 배치 (좌표 업데이트)
        currentPallet.x = aTypeXCursor;
        currentPallet.y = aTypeYCursor;
        currentPallet.z = aTypeHeightUsed;

        // 팔레트의 실제 치수를 배치된 방향에 맞게 업데이트
        currentPallet.length = finalLength;
        currentPallet.width = finalWidth;
        currentPallet.height = finalHeight;
        currentPallet.type = typeLabel; // 시각화용 타입 라벨

        container.packedPallets.push(currentPallet);
        packedCount++;
        aTypePairCounter++;

        // 다음 팔레트의 Y 위치 업데이트 (현재 팔레트의 너비만큼)
        aTypeYCursor += finalWidth;
        
        // A_39W + A_59W 한 쌍(총 너비 39+59=98)을 채웠을 경우 Y 커서 리셋하고 X 커서 이동
        if (aTypePairCounter % 2 === 0 && aTypePairCounter > 0) {
            aTypeXCursor += 59; // 한 쌍의 최대 길이(59)만큼 X 이동
            aTypeYCursor = 0;   // Y 커서 리셋
        }
    }

    // 2. 유형 B 팔레트 적재 (고정 방향: 73L x 47W x 49H)
    // B 타입은 A 타입이 적재된 영역의 빈 공간을 활용하거나, A 타입이 사용하지 않은 새로운 층에 적재를 시작합니다.
    // 기존 로직에서는 A타입이 Z=0층을 완전히 채우지 않은 경우 B타입이 그 옆에 이어붙는 로직이 있었습니다.
    // 여기서는 A타입이 Z=0을 모두 사용한 후, B타입은 Z=0의 다음 X 위치부터 시작하거나,
    // A타입이 층을 넘어갔다면 B타입도 그 층부터 시작하도록 유연하게 처리합니다.

    let bTypeHeightUsed = aTypeHeightUsed; // B 타입은 A 타입이 사용한 층부터 시작할 수 있음
    let bTypeYCursor = aTypeYCursor;       // A 타입이 마지막으로 사용한 Y 위치부터 시작
    let bTypeXCursor = aTypeXCursor;       // A 타입이 마지막으로 사용한 X 위치부터 시작

    // 만약 A 타입이 Z축 0층을 완전히 채웠거나, A 타입이 하나도 적재되지 않았다면
    // B 타입은 Z=0, X=0, Y=0 부터 시작해야 할 수 있습니다.
    // 여기서는 A 타입이 끝난 지점부터 이어서 적재하는 방식을 유지합니다.
    // A타입이 Z=0을 사용했고, B타입이 Z=0부터 시작해야 할 경우
    // if (aTypeHeightUsed === 0 && aTypeXCursor > 0 && bTypeXCursor === 0) {
    //     // A타입이 0층에서 X를 사용했지만 다음 층으로 넘어가지 않았고,
    //     // B타입이 X=0부터 시작하도록 초기화되어 있다면
    //     // A타입이 사용한 최대 X 위치부터 B타입을 시작하도록 조정
    //     const maxA_X_plus_Length = container.packedPallets.reduce((max, p) => {
    //         if (p.type && p.type.startsWith('A_')) {
    //             return Math.max(max, p.x + p.length);
    //         }
    //         return max;
    //     }, 0);
    //     bTypeXCursor = maxA_X_plus_Length;
    //     bTypeYCursor = 0; // B타입은 항상 Y=0부터 새로운 행 시작
    // }

    // 가장 간단한 접근: A타입이 적재된 가장 높은 Z 층과 가장 긴 X 길이를 파악하여 B타입의 시작점 설정
    // B타입은 항상 X=0 또는 현재 X에서 시작하고, Y=0부터 시작합니다.
    // Z는 현재 층 또는 다음 층으로 넘어갑니다.

    if (container.packedPallets.length > 0) {
        // A타입 팔레트 중 가장 마지막에 배치된 팔레트의 정보를 기반으로 B타입 시작 위치를 결정합니다.
        // A타입이 컨테이너의 특정 층을 채우고 다음 X로 넘어갔다면, B타입은 해당 X부터 시작해야 합니다.
        // A타타입이 다음 층으로 넘어갔다면, B타입은 새 층의 X=0부터 시작합니다.
        // 이 로직은 A타입의 마지막 X 커서와 Z 커서를 이어받는 것이 가장 합리적입니다.
    } else {
        // A타입 팔레트가 전혀 적재되지 않은 경우, B타입은 컨테이너의 (0,0,0)부터 시작합니다.
        bTypeXCursor = 0;
        bTypeYCursor = 0;
        bTypeHeightUsed = 0;
    }


    for (const p of palletsTypeB) {
        let currentPallet = p;
        let finalLength = 73;
        let finalWidth = 47;
        let finalHeight = 49; // B타입 팔레트의 고정 높이
        let typeLabel = 'B';

        // 현재 위치에 배치 가능한지 확인
        if (!container.canPlace(finalLength, finalWidth, finalHeight, bTypeXCursor, bTypeYCursor, bTypeHeightUsed)) {
            // Y 위치에 공간 없으면 X 이동 시도
            if (bTypeYCursor + finalWidth > CONTAINER_WIDTH) {
                bTypeXCursor += finalLength; // 팔레트 길이(73)만큼 X 이동
                bTypeYCursor = 0;            // Y 커서 리셋
            }

            // X 위치에 공간 없으면 Z 이동 시도
            if (bTypeXCursor + finalLength > CONTAINER_LENGTH) {
                bTypeHeightUsed += finalHeight; // 팔레트 높이(49)만큼 Z 이동
                bTypeXCursor = 0;               // X 커서 리셋
                bTypeYCursor = 0;               // Y 커서 리셋
            }

            // 모든 이동 후에도 배치 불가능하면
            if (!container.canPlace(finalLength, finalWidth, finalHeight, bTypeXCursor, bTypeYCursor, bTypeHeightUsed)) {
                unpackedPallets.push(p); // 적재 불가
                console.warn(`[B Type] Could not place pallet ${p.serial} at final attempt. Skipping.`);
                continue;
            }
        }
        
        // 팔레트 배치 (좌표 업데이트)
        currentPallet.x = bTypeXCursor;
        currentPallet.y = bTypeYCursor;
        currentPallet.z = bTypeHeightUsed;

        // 팔레트의 실제 치수를 배치된 방향에 맞게 업데이트
        currentPallet.length = finalLength;
        currentPallet.width = finalWidth;
        currentPallet.height = finalHeight;
        currentPallet.type = typeLabel; // 시각화용 타입 라벨

        container.packedPallets.push(currentPallet);
        packedCount++;

        // 다음 팔레트의 Y 위치 업데이트 (현재 팔레트의 너비만큼)
        bTypeYCursor += finalWidth;
    }

    // --- 적재된 팔레트 결과 포맷팅 ---
    const finalPackedResults = container.packedPallets.map(p => ({
        serial: p.serial,
        partNumber: p.partNumber,
        itemName: p.itemName,
        length: p.length,
        width: p.width,
        height: p.height,
        x: p.x,
        y: p.y,
        z: p.z,
        type: p.type
    }));

    const unpackedResultsFormatted = unpackedPallets.map(p => ({
        serial: p.serial,
        partNumber: p.partNumber,
        itemName: p.itemName,
        length: p.length,
        width: p.width,
        height: p.height
    }));

    // 남은 공간 계산 (근사치) - 마지막 팔레트 위치 기준이 아닌, 사용된 최대 X,Y,Z 기준
    let maxUsedX = 0;
    let maxUsedY = 0;
    let maxUsedZ = 0;

    for (const p of finalPackedResults) {
        maxUsedX = Math.max(maxUsedX, p.x + p.length);
        maxUsedY = Math.max(maxUsedY, p.y + p.width);
        maxUsedZ = Math.max(maxUsedZ, p.z + p.height);
    }
    
    const remainingLength = CONTAINER_LENGTH - maxUsedX;
    const remainingWidth = CONTAINER_WIDTH - maxUsedY;
    const remainingHeight = CONTAINER_HEIGHT - maxUsedZ;

    return {
        totalPalletsToPack: allPalletsToPack.length,
        packedCount: packedCount,
        unpackedCount: unpackedResultsFormatted.length,
        packedPallets: finalPackedResults, // 최종 적재된 팔레트 배열
        unpackedPallets: unpackedResultsFormatted,
        remainingSpace: {
            length: parseFloat(remainingLength.toFixed(2)),
            width: parseFloat(remainingWidth.toFixed(2)),
            height: parseFloat(remainingHeight.toFixed(2))
        }
    };
}

// Node.js 모듈로 내보내기
module.exports = performPacking;
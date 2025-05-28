// packingLogic.js (이전 코드를 이 내용으로 교체)

// 컨테이너 치수 정의 (인치)
const CONTAINER_LENGTH = 635.8;
const CONTAINER_WIDTH = 102.4;
const CONTAINER_HEIGHT = 110.2;

// 팔레트를 나타내는 클래스
class Pallet {
    constructor(serial, length, width, height, partNumber, itemName, originalWidth) {
        this.serial = serial;
        this.length = length;
        this.width = width; // 현재 배치될 때의 너비
        this.height = height;
        this.partNumber = partNumber;
        this.itemName = itemName;
        this.x = 0; // 컨테이너 내 X 위치
        this.y = 0; // 컨테이너 내 Y 위치
        this.z = 0; // 컨테이너 내 Z 위치
        this.originalWidth = originalWidth; // 팔레트의 원본 너비 (59x39일 경우 39)
    }

    toString() {
        return `Pallet(Serial=${this.serial}, Dims=(${this.length}x${this.width}x${this.height}), Pos=(${this.x},${this.y},${this.z}))`;
    }
}

// 컨테이너를 나타내는 클래스
class Container {
    constructor(length, width, height) {
        this.length = length;
        this.width = width;
        this.height = height;
        this.packedPallets = []; // 적재된 팔레트 목록
        this.currentX = 0; // 다음 팔레트 적재를 위한 현재 X 위치
        this.currentY = 0; // 다음 팔레트 적재를 위한 현재 Y 위치
        this.currentZ = 0; // 다음 팔레트 적재를 위한 현재 Z 위치
    }

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
    const palletTypes = {};
    for (const palletInfo of palletDataList) {
        const dims = palletInfo.dimensions;
        const palletKey = `${dims.width}x${dims.depth}x${dims.height}`; 
        if (!palletTypes[palletKey]) {
            palletTypes[palletKey] = {
                count: 0,
                // 여기서 length와 width는 팔레트의 '가장 긴 면'과 '두 번째로 긴 면'으로 정의합니다.
                // 즉, 원본 데이터의 width를 length로, depth를 width로 사용합니다.
                dimensions: { length: dims.width, width: dims.depth, height: dims.height },
                items: []
            };
        }
        palletTypes[palletKey].count += 1;
        palletTypes[palletKey].items.push(palletInfo.palletSerial);
    }

    const container = new Container(CONTAINER_LENGTH, CONTAINER_WIDTH, CONTAINER_HEIGHT);

    const allPalletsToPack = [];
    for (const palletKey in palletTypes) {
        const pInfo = palletTypes[palletKey];
        const palletLength = pInfo.dimensions.length;
        const palletWidth = pInfo.dimensions.width;
        const palletHeight = pInfo.dimensions.height;
        for (const serial of pInfo.items) {
            const originalInfo = palletDataList.find(item => item.palletSerial === serial);
            if (originalInfo) {
                // Pallet 객체를 생성할 때 원래의 너비(39 or 47)를 originalWidth로 저장합니다.
                allPalletsToPack.push(new Pallet(serial, palletLength, palletWidth, palletHeight,
                                                  originalInfo.partNumber, originalInfo.itemName, palletWidth));
            }
        }
    }

    const palletsTypeA = allPalletsToPack.filter(p => p.originalWidth === 39); // 59x39 팔레트
    const palletsTypeB = allPalletsToPack.filter(p => p.originalWidth === 47); // 73x47 팔레트

    let packedCount = 0;
    const unpackedPallets = [];

    // 적재된 팔레트 정보를 저장할 배열
    const packedResults = [];

    // --- 적재 로직 시작 ---

    // 1. 유형 A 팔레트 적재 (혼합 방향: 39W + 59W = 98W)
    let aTypeHeightUsed = 0; // 현재 높이 레벨
    let aTypeYCursor = 0;    // 현재 Y 커서 (39W 또는 59W)
    let aTypeXCursor = 0;    // 현재 X 커서
    let aTypePairCounter = 0; // 팔레트 A가 짝수/홀수 번째인지 추적 (한 쌍의 첫/둘째)

    for (const p of palletsTypeA) {
        let currentPallet = p; // 현재 처리할 팔레트 객체
        let finalLength, finalWidth, finalHeight, typeLabel;

        // A_39W (59L x 39W x 50H) 또는 A_59W (39L x 59W x 50H) 결정
        if (aTypePairCounter % 2 === 0) { // 첫 번째 팔레트 (39W로 배치)
            finalLength = 59;
            finalWidth = 39;
            finalHeight = 50;
            typeLabel = 'A_39W';
        } else { // 두 번째 팔레트 (59W로 회전 배치)
            finalLength = 39; // 회전 후 길이
            finalWidth = 59;  // 회전 후 너비
            finalHeight = 50;
            typeLabel = 'A_59W';
        }
        
        // 현재 위치에 배치 가능한지 확인 (현재 X,Y,Z 커서 기준)
        if (!container.canPlace(finalLength, finalWidth, finalHeight, aTypeXCursor, aTypeYCursor, aTypeHeightUsed)) {
            // 현재 Y 위치에 공간이 없거나 (39+59=98 넘김), 현재 X 위치에 공간이 없으면
            // Y 커서를 리셋하고 X 커서를 다음 열로 이동 시도
            if (aTypeYCursor + finalWidth > CONTAINER_WIDTH) { // 현재 Y열에 더 이상 공간 없음 (새 행으로 이동)
                aTypeXCursor += 59; // 이전 A 유형 팔레트의 최대 길이(59)만큼 X 이동
                aTypeYCursor = 0;   // Y 커서 리셋
                aTypePairCounter = 0; // 새 행이므로 쌍 카운터 리셋
            }

            // X 커서가 컨테이너 길이를 초과하면 Z 커서를 다음 층으로 이동 시도
            if (aTypeXCursor + finalLength > CONTAINER_LENGTH) {
                aTypeHeightUsed += 50; // A 유형 팔레트 높이만큼 Z 이동
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
        currentPallet.y = aTypeYCursor; // 이 팔레트가 배치될 Y 시작 지점
        currentPallet.z = aTypeHeightUsed;

        // 팔레트의 실제 치수를 배치된 방향에 맞게 업데이트
        currentPallet.length = finalLength;
        currentPallet.width = finalWidth;
        currentPallet.height = finalHeight; // 높이는 고정
        currentPallet.type = typeLabel; // 시각화용 타입 라벨

        container.packedPallets.push(currentPallet);
        packedCount++;
        aTypePairCounter++;

        // 다음 팔레트의 Y 위치 업데이트 (현재 팔레트의 너비만큼)
        aTypeYCursor += finalWidth;
        
        // A_39W + A_59W 한 쌍(98W)을 채웠을 경우 또는 Y축 끝에 도달했을 경우
        if (aTypePairCounter % 2 === 0 && aTypePairCounter > 0) { // 한 쌍을 채웠을 때만 X 이동
             // 한 쌍을 채웠으므로 Y 커서 리셋하고 X 커서 이동
            aTypeXCursor += 59; // 한 쌍의 최대 길이(59)만큼 X 이동
            aTypeYCursor = 0;   // Y 커서 리셋
        }
    }

    // A 타입 적재 후, 다음 B 타입 팔레트가 시작할 컨테이너 위치 설정
    let bTypeHeightUsed = 0; // B 타입은 Z=0부터 새로 시작 (동일 크기만 적재 제약)
    let bTypeYCursor = 0;
    let bTypeXCursor = aTypeXCursor; // A 타입이 끝난 X 위치부터 B 타입 시작

    // 만약 A 타입이 컨테이너 길이를 넘어서서 다음 층으로 넘어갔다면, B 타입은 층 시작부터
    if (aTypeXCursor > CONTAINER_LENGTH || packedResults.length === 0) { // A 타입이 다음 층으로 넘어갔거나, A타입이 아예 없었을 경우
        bTypeXCursor = 0; // X 커서 리셋
        bTypeHeightUsed = aTypeHeightUsed; // A 타입이 사용한 층부터 B 타입 시작
        if (aTypeHeightUsed > 0 && aTypeXCursor > 0) { // A타입이 층을 바꿨는데, 마지막 A타입이 X를 다 채우지 않았다면, B타입은 그 다음부터 시작
             bTypeXCursor = aTypeXCursor;
        } else if (aTypeHeightUsed > 0) { // A타입이 다음 층으로 넘어갔고, X를 완전히 채웠다면 B타입은 0부터 시작
            bTypeXCursor = 0;
        } else { // A타입이 층을 바꾸지 않고 X를 다 채우지 않았다면, B타입은 그 다음부터 시작
            bTypeXCursor = aTypeXCursor;
        }
    } else { // A 타입이 X를 다 채우지 않고 끝났다면, B 타입은 그 다음 X부터 시작
        bTypeXCursor = aTypeXCursor;
        bTypeHeightUsed = aTypeHeightUsed;
    }

    // B타입이 A타입의 남은 공간에 이어붙지 않고, A타입이 Z축 0층을 완전히 사용한 후
    // B타입이 Z축 0층에서 새로 시작하게 하려면
    if (container.packedPallets.length > 0) {
        // A타입 팔레트의 마지막 X 위치를 찾고, 그 이후부터 B타입을 시작
        // 모든 A타입 팔레트의 최대 X + Length를 기준으로 B타입의 시작 X를 정합니다.
        const maxA_X_plus_Length = container.packedPallets.reduce((max, p) => {
            if (p.type && (p.type.startsWith('A_') || p.type.startsWith('B_'))) { // A 또는 B 타입만 고려
                return Math.max(max, p.x + p.length);
            }
            return max;
        }, 0);
        bTypeXCursor = maxA_X_plus_Length;
        bTypeHeightUsed = 0; // B 타입은 항상 Z=0부터 시작 (동일 크기 스태킹 제약)
    } else { // A 타입 팔레트가 하나도 적재되지 않은 경우
        bTypeXCursor = 0;
        bTypeHeightUsed = 0;
    }


    // 2. 유형 B 팔레트 적재 (고정 방향: 73L x 47W)
    for (const p of palletsTypeB) {
        let currentPallet = p;
        let finalLength = 73;
        let finalWidth = 47;
        let finalHeight = 49;
        let typeLabel = 'B';

        // 현재 위치에 배치 가능한지 확인
        if (!container.canPlace(finalLength, finalWidth, finalHeight, bTypeXCursor, bTypeYCursor, bTypeHeightUsed)) {
            // Y 위치에 공간 없으면 X 이동 시도
            if (bTypeYCursor + finalWidth > CONTAINER_WIDTH) {
                bTypeXCursor += finalLength; // 팔레트 길이만큼 X 이동
                bTypeYCursor = 0;           // Y 커서 리셋
            }

            // X 위치에 공간 없으면 Z 이동 시도
            if (bTypeXCursor + finalLength > CONTAINER_LENGTH) {
                bTypeHeightUsed += finalHeight; // 팔레트 높이만큼 Z 이동
                bTypeXCursor = 0;            // X 커서 리셋
                bTypeYCursor = 0;            // Y 커서 리셋
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
        currentPallet.height = finalHeight; // 높이는 고정
        currentPallet.type = typeLabel; // 시각화용 타입 라벨

        container.packedPallets.push(currentPallet);
        packedCount++;

        // 다음 팔레트의 Y 위치 업데이트 (현재 팔레트의 너비만큼)
        bTypeYCursor += finalWidth;
    }

    // --- 적재된 팔레트 결과 포맷팅 ---
    // Pallet 객체들을 JSON 직렬화 가능한 형태로 변환
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
        type: p.type // 이미 위에서 할당됨
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
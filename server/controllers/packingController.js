// controllers/packingController.js
const path = require('path');
const fetch = require('node-fetch'); // node-fetch는 Node.js 환경에서 fetch를 사용하기 위함
const Item = require('../models/itemModel.js'); // Item 모델
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const performPacking = require('../utils/packingLogic'); // JavaScript 적재 로직 임포트

// 외부 ASN API URL (로컬에서 실행되는 당신의 ASN API 주소)
const ASN_API_BASE_URL = process.env.ASN_API_BASE_URL; // .env 파일에 정의되어야 함

/**
 * 외부 ASN API를 호출하고, Item 정보와 조인하여 팔레트 데이터를 가공하는 내부 함수.
 * 이 함수는 HTTP 응답을 보내지 않고, 가공된 데이터를 반환합니다.
 * @param {string} date - 조회 날짜.
 * @param {string} group - 조회 그룹.
 * @returns {Array<Object>} 적재 로직이 필요로 하는 형식의 팔레트 데이터 배열.
 * @throws {Error} API 호출 또는 데이터 처리 중 오류 발생 시.
 */
async function fetchAndProcessPalletData(date, group) {
    // 1. ASN API 호출
    const asnApiUrl = `${ASN_API_BASE_URL}?date=${date}&group=${group}`;
    console.log(`[Internal] ASN API 호출: ${asnApiUrl}`);

    const asnResponse = await fetch(asnApiUrl);

    if (!asnResponse.ok) {
        const errorText = await asnResponse.text();
        console.error(`[Internal] ASN API 오류: ${asnResponse.status} ${asnResponse.statusText} - ${errorText}`);
        throw new Error(`ASN API 호출 오류: ${asnResponse.statusText} (${asnResponse.status})`);
    }

    const asnData = await asnResponse.json();
    const asnItems = asnData.data;

    if (!asnItems || asnItems.length === 0) {
        return []; // 데이터가 없으면 빈 배열 반환
    }

    // 2. 중복 없는 partNumber 목록 추출 후 Item 정보 조회
    const uniquePartNumbers = [...new Set(asnItems.map(item => item.partNumber))];
    const itemDetails = await Item.find({ itemNo: { $in: uniquePartNumbers } });

    const itemDetailsMap = new Map();
    itemDetails.forEach(item => {
        itemDetailsMap.set(item.itemNo, item);
    });

    // 3. 각 ASN 항목에 Item 정보 붙이기 및 필요한 형식으로 가공
    const processedPalletData = asnItems.map(asnItem => {
        const itemInfo = itemDetailsMap.get(asnItem.partNumber);

        // performPacking에서 필요로 하는 최소한의 데이터만 포함
        return {
            partNumber: asnItem.partNumber,
            palletSerial: asnItem.palletSerial,
            deliveryQty: asnItem.deliveryQty, // 이 값은 packingLogic에서 직접 사용되지는 않지만, 데이터의 무결성을 위해 포함
            description: asnItem.description,
            itemName: itemInfo?.itemName || '',
            itemType: itemInfo?.itemType || '',
            itemWeightPerUnit: itemInfo?.weight ?? 0,
            dimensions: itemInfo?.dimensions || null // dimensions는 필수이므로 null 처리 주의
        };
    }).filter(item => item.dimensions !== null); // dimensions가 없는 항목은 적재할 수 없으므로 제외

    return processedPalletData;
}


// 기존 getASNItemsSummary는 그대로 둡니다. (필요하다면)
exports.getASNItemsSummary = async (req, res) => {
    const { date, group } = req.query;

    if (!date || !group) {
        return res.status(400).json({ msg: '날짜(date)와 그룹(group) 파라미터는 필수입니다.' });
    }

    try {
        // fetchAndProcessPalletData를 활용하여 필요한 데이터를 가져온 후 요약
        const rawPalletData = await fetchAndProcessPalletData(date, group);

        if (rawPalletData.length === 0) {
            return res.status(404).json({ msg: '해당 조건에 맞는 ASN 데이터가 없습니다.' });
        }

        const aggregatedAsn = rawPalletData.reduce((acc, currentItem) => {
            const partNumber = currentItem.partNumber;
            if (!acc[partNumber]) {
                acc[partNumber] = {
                    partNumber: partNumber,
                    totalDeliveryQty: 0, 
                    palletCount: 0, 
                    description: currentItem.description,
                    itemName: currentItem.itemName,
                    itemType: currentItem.itemType,
                    itemWeightPerUnit: currentItem.itemWeightPerUnit,
                    dimensions: currentItem.dimensions
                };
            }
            // deliveryQty는 각 팔레트의 '총 수량'이므로, 팔레트 개별 데이터에서는 '1'로 가정하거나
            // ASN API에서 'deliveryQty'가 의미하는 바에 따라 변경될 수 있습니다.
            // 현재 코드는 'palletCount'를 각 palletSerial을 기준으로 1씩 더하고, 'totalDeliveryQty'는 각 품목의 실제 수량 합을 의미하는 것으로 보입니다.
            // 여기서는 palletCount를 `itemWeightPerUnit * palletCount`로 계산하므로, palletCount는 팔레트 개수를 의미해야 합니다.
            // 원본 API에서 deliveryQty가 개별 팔레트의 '내부 물품 수량'이라면, totalDeliveryQty는 그 합이 됩니다.
            acc[partNumber].totalDeliveryQty += currentItem.deliveryQty; 
            acc[partNumber].palletCount += 1; // 각 partNumber에 대해 팔레트 하나씩 카운트
            return acc;
        }, {});

        const finalSummary = Object.values(aggregatedAsn).map(summaryItem => {
            // totalWeight 계산: (Item의 itemWeightPerUnit) * (팔레트 개수)
            const totalWeight = summaryItem.itemWeightPerUnit * summaryItem.palletCount; 
            
            return {
                ...summaryItem, // 기존 요약 정보
                totalWeight: totalWeight // 재계산된 totalWeight
            };
        });

        res.json(finalSummary);

    } catch (err) {
        console.error('ASN Summary API 컨트롤러 오류:', err.message);
        res.status(500).send('Server Error');
    }
};


// getASNItems 컨트롤러 (원본 데이터를 API로 제공)
exports.getASNItems = async (req, res) => {
    const { date, group } = req.query;

    if (!date || !group) {
        return res.status(400).json({ msg: '날짜(date)와 그룹(group) 파라미터는 필수입니다.' });
    }

    try {
        const processedPalletData = await fetchAndProcessPalletData(date, group);
        
        if (processedPalletData.length === 0) {
            return res.status(404).json({ msg: '해당 조건에 맞는 ASN 데이터가 없습니다.' });
        }

        // totalWeight를 모든 팔레트의 itemWeightPerUnit 합으로 계산 (getPackingPlan 입력과 일치)
        const totalWeight = processedPalletData.reduce((sum, item) => sum + item.itemWeightPerUnit, 0);

        return res.status(200).json({
            count: processedPalletData.length,
            totalWeight: totalWeight, // 전체 팔레트의 itemWeightPerUnit 합계
            data: processedPalletData
        });

    } catch (error) {
        console.error('getASNItems 서버 오류:', error);
        return res.status(500).json({ msg: '서버 내부 오류가 발생했습니다.' });
    }
};

// getPackingPlan 컨트롤러 (내부에서 데이터를 가져와 적재 로직 실행)
exports.getPackingPlan = async (req, res) => {
    const { date, group } = req.query; // 클라이언트가 날짜와 그룹을 쿼리 파라미터로 보낸다고 가정

    if (!date || !group) {
        return res.status(400).json({ msg: '날짜(date)와 그룹(group) 파라미터는 필수입니다.' });
    }

    try {
        // 1. 내부 함수를 호출하여 팔레트 데이터를 가져옵니다.
        const palletDataForPacking = await fetchAndProcessPalletData(date, group);

        if (palletDataForPacking.length === 0) {
            return res.status(404).json({ msg: '해당 조건에 맞는 적재할 팔레트 데이터가 없습니다.' });
        }
        
        // 2. 적재 로직 실행 (JavaScript로 포팅된 performPacking 함수)
        const packingResults = performPacking(palletDataForPacking);

        // 3. 클라이언트에게 결과 반환
        res.json(packingResults);

    } catch (error) {
        console.error("Error in getPackingPlan:", error);
        // fetchAndProcessPalletData에서 발생한 오류를 클라이언트에 적절히 전달
        res.status(500).json({ 
            error: "Failed to calculate packing plan due to internal data fetching error.", 
            details: error.message 
        });
    }
};
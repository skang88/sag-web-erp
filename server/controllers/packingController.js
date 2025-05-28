// controllers/packingController.js
const path = require('path');
const fetch = require('node-fetch');
const Item = require('../models/itemModel.js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 외부 ASN API URL (로컬에서 실행되는 당신의 ASN API 주소)
const ASN_API_BASE_URL = process.env.ASN_API_BASE_URL; // 필요에 따라 변경하세요

exports.getASNItemsSummary = async (req, res) => {
  const { date, group } = req.query;

  if (!date || !group) {
    return res.status(400).json({ msg: '날짜(date)와 그룹(group) 파라미터는 필수입니다.' });
  }

  try {
    // 1. 외부 (또는 내부) ASN API 호출
    const asnApiUrl = `${ASN_API_BASE_URL}?date=${date}&group=${group}`;
    console.log(`ASN API 호출: ${asnApiUrl}`);

    const asnResponse = await fetch(asnApiUrl);

    if (!asnResponse.ok) {
      const errorText = await asnResponse.text();
      console.error(`ASN API 오류: ${asnResponse.status} ${asnResponse.statusText} - ${errorText}`);
      return res.status(asnResponse.status).json({ msg: `ASN API 호출 오류: ${asnResponse.statusText}` });
    }

    const asnData = await asnResponse.json();
    const asnItems = asnData.data;

    if (!asnItems || asnItems.length === 0) {
      return res.status(404).json({ msg: '해당 조건에 맞는 ASN 데이터가 없습니다.' });
    }

    // 2. partNumber별로 deliveryQty를 합산 (총 수량 계산)
    // 여기서는 deliveryQty가 '총 수량'으로 사용됩니다.
    // 각 partNumber별로 'palletSerial'의 개수(count)를 세는 것이 아니라,
    // 'deliveryQty' 필드의 합계를 'totalCount'로 사용합니다.
    // 만약 "팔레트 수량"을 세는 것이 목적이라면, $group 단계에서 $sum: 1 (각 문서에 대해 1을 더함)
    // 그리고 최종 $project에서 uniquePalletCount를 반환하도록 변경해야 합니다.
    // 현재 요청은 "수량이 카운트"와 "weight * 카운트 = tot_weight" 이므로 deliveryQty의 합계를 사용합니다.

    const aggregatedAsn = asnItems.reduce((acc, currentItem) => {
      const partNumber = currentItem.partNumber;
      if (!acc[partNumber]) {
        acc[partNumber] = {
          partNumber: partNumber,
          totalDeliveryQty: 0, // deliveryQty의 합계
          palletCount: 0, // 각 partNumber별 팔레트 수량 (palletSerial의 고유 개수)
          description: currentItem.description
        };
      }
      acc[partNumber].totalDeliveryQty += currentItem.deliveryQty;
      acc[partNumber].palletCount += 1; // 각 partNumber에 대해 팔레트 하나씩 카운트
      return acc;
    }, {});

    const uniquePartNumbers = Object.keys(aggregatedAsn);

    // 3. Item 컬렉션에서 해당 partNumber에 맞는 정보 가져오기
    const itemDetails = await Item.find({ itemNo: { $in: uniquePartNumbers } });

    const itemDetailsMap = new Map();
    itemDetails.forEach(item => {
      itemDetailsMap.set(item.itemNo, item);
    });

    // 4. 합산된 ASN 데이터와 Item 정보를 조인하고 totalWeight 계산
    const finalSummary = Object.values(aggregatedAsn).map(asnSummary => {
      const itemInfo = itemDetailsMap.get(asnSummary.partNumber);

      if (itemInfo) {
        // totalWeight 계산: (Item의 weight) * (총 deliveryQty)
        const totalWeight = itemInfo.weight * asnSummary.palletCount;

        return {
          partNumber: asnSummary.partNumber,
          itemName: itemInfo.itemName,
          itemType: itemInfo.itemType,
          totalDeliveryQty: asnSummary.totalDeliveryQty, // 요청하신 '수량' (deliveryQty의 합계)
          palletCount: asnSummary.palletCount, // partNumber별 팔레트 개수
          itemWeightPerUnit: itemInfo.weight, // 단위당 무게도 포함 (원래 item.weight)
          totalWeight: totalWeight,             // 요청하신 'tot_weight'
          dimensions: itemInfo.dimensions
        };
      } else {
        console.warn(`Item 정보가 없는 partNumber: ${asnSummary.partNumber}`);
        return {
          partNumber: asnSummary.partNumber,
          totalDeliveryQty: asnSummary.totalDeliveryQty,
          palletCount: asnSummary.palletCount,
          totalWeight: null, // Item weight 정보가 없으므로 null
          description: asnSummary.description,
          dimensions: null,
          itemWeightPerUnit: null,
          itemName: null,
          carType: null,
          itemType: null,
          note: "Item details not found in local database"
        };
      }
    });

    res.json(finalSummary);

  } catch (err) {
    console.error('ASN Summary API 컨트롤러 오류:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.getASNItems = async (req, res) => {
  const { date, group } = req.query;

  if (!date || !group) {
    return res.status(400).json({ msg: '날짜(date)와 그룹(group) 파라미터는 필수입니다.' });
  }

  try {
    // 1. ASN API 호출
    const asnApiUrl = `${ASN_API_BASE_URL}?date=${date}&group=${group}`;
    console.log(`ASN API 호출: ${asnApiUrl}`);

    const asnResponse = await fetch(asnApiUrl);

    if (!asnResponse.ok) {
      const errorText = await asnResponse.text();
      console.error(`ASN API 오류: ${asnResponse.status} ${asnResponse.statusText} - ${errorText}`);
      return res.status(asnResponse.status).json({ msg: `ASN API 호출 오류: ${asnResponse.statusText}` });
    }

    const asnData = await asnResponse.json();
    const asnItems = asnData.data;

    if (!asnItems || asnItems.length === 0) {
      return res.status(404).json({ msg: '해당 조건에 맞는 ASN 데이터가 없습니다.' });
    }

    // 2. 중복 없는 partNumber 목록 추출 후 Item 정보 조회
    const uniquePartNumbers = [...new Set(asnItems.map(item => item.partNumber))];
    const itemDetails = await Item.find({ itemNo: { $in: uniquePartNumbers } });

    const itemDetailsMap = new Map();
    itemDetails.forEach(item => {
      itemDetailsMap.set(item.itemNo, item);
    });

    // 3. 각 ASN 항목에 Item 정보 붙이기 및 totalWeight 계산
    let totalWeight = 0;

    const finalSummary = asnItems.map(asnItem => {
      const itemInfo = itemDetailsMap.get(asnItem.partNumber);

      const itemWeightPerUnit = itemInfo?.weight ?? 0;
      const qty = asnItem.deliveryQty ?? 0;

      const itemTotalWeight = itemWeightPerUnit * qty;
      totalWeight += itemWeightPerUnit;

      return {
        partNumber: asnItem.partNumber,
        palletSerial: asnItem.palletSerial,
        deliveryQty: qty,
        description: asnItem.description,
        itemName: itemInfo?.itemName || '',
        itemType: itemInfo?.itemType || '',
        itemWeightPerUnit,
        
      };
    });

    // 4. 응답
    return res.status(200).json({
      count: finalSummary.length,
      totalWeight,
      data: finalSummary
    });

  } catch (error) {
    console.error('서버 오류:', error);
    return res.status(500).json({ msg: '서버 내부 오류가 발생했습니다.' });
  }
};


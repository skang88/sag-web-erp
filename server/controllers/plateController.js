const Plate = require('../models/plateModel'); // 수정된 모델을 import

exports.createPlate = async (req, res) => {
  try {
    // 단일 객체 또는 배열 형태의 요청 모두 처리
    let dataArray = req.body;
    if (!Array.isArray(dataArray)) {
      dataArray = [dataArray];
    }

    // 복잡한 JSON 데이터를 Mongoose 스키마 구조에 맞게 변환
    const documentsToCreate = dataArray.map(item => {
      const vehicle = item.vehicle || {};
      const bestPlateInfo = item.best_plate || {};

      return {
        dataType: item.data_type,
        startTime: new Date(item.epoch_start),
        endTime: new Date(item.epoch_end),
        // ### FIX: 'bestUuid'가 아니라 'best_uuid'를 사용하도록 수정 ###
        bestUuid: item.best_uuid, 
        companyId: item.company_id,
        agentUid: item.agent_uid,
        cameraId: item.camera_id,
        bestPlateNumber: item.best_plate_number,
        bestConfidence: item.best_confidence,
        vehicle: {
          color: vehicle.color?.[0]?.name || 'N/A',
          make: vehicle.make?.[0]?.name || 'N/A',
          makeModel: vehicle.make_model?.[0]?.name || 'N/A',
          bodyType: vehicle.body_type?.[0]?.name || 'N/A',
        }
      };
    });

    // 변환된 데이터를 데이터베이스에 한 번에 저장
    const createdData = await Plate.insertMany(documentsToCreate);

    res.status(201).json({
      message: 'Plate data successfully created',
      count: createdData.length,
      data: createdData,
    });
  } catch (error) {
    console.error('Error creating Plate data:', error);
    res.status(500).json({ message: 'Error creating Plate data', error: error.message });
  }
};

exports.getPlates = async (req, res) => {
  try {
    // find 메서드로 모든 데이터를 찾되, select 메서드로 필요한 필드만 선택합니다.
    // 필드 이름 앞에 -를 붙이면 (예: '-_id') 해당 필드를 제외시킬 수 있습니다.
    const plates = await Plate.find({})
      .select('startTime bestPlateNumber vehicle -_id')
      .sort({ startTime: -1 }); // 최신 데이터가 위로 오도록 정렬

    // 성공적으로 데이터를 찾으면 200 OK 상태 코드와 함께 데이터를 반환합니다.
    res.status(200).json({
      message: 'Plates successfully retrieved',
      count: plates.length,
      data: plates,
    });
  } catch (error) {
    // 에러 발생 시 서버 로그에 에러를 기록합니다.
    console.error('Error retrieving Plate data:', error);
    // 500 서버 에러 상태 코드와 에러 메시지를 반환합니다.
    res.status(500).json({ message: 'Error retrieving Plate data', error: error.message });
  }
};

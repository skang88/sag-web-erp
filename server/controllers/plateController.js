// plateController.js

const Plate = require('../models/plateModel');
// [추가] shellyController에서 내부 호출용 함수들을 가져옵니다.
const { _turnOn, _turnOff } = require('./shellyController'); // 파일 경로는 실제 위치에 맞게 수정하세요.

// [추가] 밀리초(ms)만큼 기다리는 간단한 delay 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.createPlate = async (req, res) => {
  try {
    const requestBody = req.body;

    // --- ### 1. 웹훅 소스가 보낸 에러 처리 ### ---
    // 요청 본문에 error 필드가 포함되어 있는지 확인합니다.
    if (requestBody && requestBody.error) {
      console.warn('번호판 인식기(웹훅 소스)로부터 에러를 수신했습니다:', requestBody.error);
      // 400 Bad Request 상태 코드로 클라이언트의 요청이 잘못되었음을 알립니다.
      return res.status(400).json({
        message: 'Webhook source reported an error. Processing stopped.',
        sourceError: requestBody.error,
      });
    }
    // --- ### 처리 완료 ### ---

    // 단일 객체 또는 배열 형태의 요청 모두 처리
    let dataArray = requestBody;
    if (!Array.isArray(dataArray)) {
      dataArray = [dataArray];
    }

    // (기존 데이터 변환 로직은 그대로 유지)
    const documentsToCreate = dataArray.map(item => {
        const vehicle = item.vehicle || {};
        return {
            dataType: item.data_type,
            startTime: new Date(item.epoch_start),
            endTime: new Date(item.epoch_end),
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

    const createdData = await Plate.insertMany(documentsToCreate);
    console.log(`데이터베이스에 ${createdData.length}개의 번호판 정보 저장 완료.`);

    // Shelly 릴레이 제어 로직 (이전과 동일)
    try {
      console.log('번호판 저장 완료. Shelly 릴레이 시퀀스를 시작합니다.');
      await _turnOn();
      await delay(1000);
      await _turnOff();
      console.log('Shelly 릴레이 시퀀스 완료.');
    } catch (shellyError) {
      console.error('Shelly 릴레이 제어 중 오류 발생:', shellyError.message);
    }

    res.status(201).json({
      message: 'Plate data successfully created',
      count: createdData.length,
      data: createdData,
    });

  } catch (error) {
    // --- ### 2. 서버 측 Mongoose 유효성 검사 오류 처리 ### ---
    if (error.name === 'ValidationError') {
      console.error('데이터베이스 저장 실패 (Mongoose Validation Error):', error.message);
      // 422 Unprocessable Entity: 요청은 잘 만들어졌지만, 포함된 내용의 문제로 처리할 수 없음을 의미합니다.
      return res.status(422).json({
        message: 'Plate validation failed before saving to database.',
        error: error.message,
        // 어떤 필드가 잘못되었는지 상세 정보를 함께 보낼 수 있습니다.
        details: error.errors,
      });
    }
    // --- ### 처리 완료 ### ---

    // 그 외의 서버 내부 오류 처리
    console.error('Error creating Plate data:', error);
    res.status(500).json({ message: 'An unexpected server error occurred', error: error.message });
  }
};

exports.getPlates = async (req, res) => {
  // getPlates 함수는 변경 사항 없습니다.
  try {
    const plates = await Plate.find({})
      .select('startTime bestPlateNumber vehicle -_id')
      .sort({ startTime: -1 });

    res.status(200).json({
      message: 'Plates successfully retrieved',
      count: plates.length,
      data: plates,
    });
  } catch (error) {
    console.error('Error retrieving Plate data:', error);
    res.status(500).json({ message: 'Error retrieving Plate data', error: error.message });
  }
};
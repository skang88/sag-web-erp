// controllers/plateController.js

const Plate = require('../models/plateModel');
const User = require('../models/userModel'); // User 모델 임포트
const { _turnOn, _turnOff } = require('./shellyController');
const { sendTelegramMessage } = require('../utils/telegramUtils'); // 텔레그램 유틸리티 임포트!

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ⭐⭐⭐ IMPORTANT FIX: escapeMarkdownV2 함수를 최상단으로 이동 ⭐⭐⭐
// 이 함수는 텔레그램 MarkdownV2에서 예약된 모든 문자를 이스케이프합니다.
// 이는 가장 보수적인 방법이며, 일반적으로 안전합니다.
// Source: https://core.telegram.org/bots/api#markdownv2-style
const escapeMarkdownV2 = (text) => {
    // text가 null 또는 undefined일 수 있으므로 string으로 변환
    if (text === null || typeof text === 'undefined') {
        return 'N/A'; // 또는 빈 문자열
    }
    const textString = String(text);
    // 예약 문자는 다음 목록에 있습니다: _ * [ ] ( ) ~ ` > # + - = | { } . !
    // 정규식에서 대괄호 `[]` 안에 `-`가 있을 경우 마지막에 놓거나 이스케이프해야 합니다.
    const reservedChars = /([_*[\]()~`>#+\-=|{}.!])/g;
    return textString.replace(reservedChars, '\\$1');
};


exports.createPlate = async (req, res) => {
    try {
        const requestBody = req.body;

        // --- ### 1. 웹훅 소스가 보낸 에러 처리 ### ---
        if (requestBody && requestBody.error) {
            console.warn('번호판 인식기(웹훅 소스)로부터 에러를 수신했습니다:', requestBody.error);
            // 에러 보고 시에도 텔레그램 알림을 보내고 싶다면 여기에 sendTelegramMessage 호출 추가
            await sendTelegramMessage(escapeMarkdownV2(`🚨 Rekor Scout Webhook Error: ${requestBody.error}`));
            return res.status(400).json({
                message: 'Webhook source reported an error. Processing stopped.',
                sourceError: requestBody.error,
            });
        }

        let dataArray = requestBody;
        if (!Array.isArray(dataArray)) {
            dataArray = [dataArray];
        }

        let overallShellyOperated = false; // 이번 요청에서 Shelly가 한 번이라도 작동했는지 여부
        const telegramMessages = [];

        const createdPlateDocs = []; // 생성된 문서들을 저장할 배열

        // 각 번호판 데이터 처리
        for (const item of dataArray) {
            const vehicle = item.vehicle || {};
            const detectedPlateNumber = item.best_plate_number ? item.best_plate_number.toUpperCase().trim() : null; // null 유지

            // detectionTime을 for 루프의 시작 부분으로 이동
            const detectionTime = new Date(item.epoch_start).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

            let currentRegistrationStatus = 'NO_PLATE'; // 현재 번호판의 등록 상태 초기화
            let currentShellyOperated = false;       // 현재 번호판 처리로 Shelly가 작동했는지 여부
            let userEmailInfo = ''; // 등록된 사용자의 이메일 정보 초기화

            // 번호판 인식 여부 및 유효성 검사
            if (detectedPlateNumber && detectedPlateNumber.length > 0) { // 인식된 번호판이 유효한 경우에만 검사
                const registeredUser = await User.findOne({
                    licensePlates: detectedPlateNumber
                });

                if (registeredUser) {
                    currentRegistrationStatus = 'REGISTERED';
                    // userEmailInfo에 email 값 할당 (안전하게 || 연산자 사용)
                    userEmailInfo = registeredUser.email || '등록자 이메일 없음';
                    console.log(`[${detectedPlateNumber}] 등록된 차량입니다. 사용자: ${userEmailInfo}`);

                    // 등록된 차량이고, 아직 이번 요청에서 Shelly가 작동하지 않았다면 작동
                    if (!overallShellyOperated) {
                        try {
                            console.log('등록된 차량 감지! Shelly 릴레이 시퀀스를 시작합니다.');
                            await _turnOn();
                            await delay(1000);
                            await _turnOff();
                            console.log('Shelly 릴레이 시퀀스 완료.');
                            currentShellyOperated = true; // 현재 번호판 처리로 Shelly 작동
                            overallShellyOperated = true; // 전체 요청에서 Shelly 작동
                        } catch (shellyError) {
                            console.error('Shelly 릴레이 제어 중 오류 발생:', shellyError.message);
                            // Shelly 오류가 발생하더라도 번호판 저장 및 응답은 계속 진행
                        }
                    }
                } else {
                    currentRegistrationStatus = 'UNREGISTERED';
                    console.log(`[${detectedPlateNumber}] 미등록 차량입니다. Shelly를 작동하지 않습니다.`);
                }
            } else {
                console.log('인식된 번호판이 유효하지 않습니다 (NO_PLATE). Shelly를 작동하지 않습니다.');
                // currentRegistrationStatus는 이미 'NO_PLATE'로 초기화되어 있음
            }

            // 데이터베이스에 저장할 문서 객체 구성
            const documentToCreate = {
                dataType: item.data_type,
                startTime: new Date(item.epoch_start),
                endTime: new Date(item.epoch_end),
                bestUuid: item.best_uuid,
                companyId: item.company_id,
                agentUid: item.agent_uid,
                cameraId: item.camera_id,
                bestPlateNumber: detectedPlateNumber,
                bestConfidence: item.best_confidence,
                vehicle: {
                    color: vehicle.color?.[0]?.name || 'N/A',
                    make: vehicle.make?.[0]?.name || 'N/A',
                    makeModel: vehicle.make_model?.[0]?.name || 'N/A',
                    bodyType: vehicle.body_type?.[0]?.name || 'N/A',
                },
                // --- 새로 추가되는 필드 값 할당 ---
                registrationStatus: currentRegistrationStatus,
                shellyOperated: currentShellyOperated,
            };

            // 데이터베이스에 저장하고 생성된 문서 배열에 추가
            const createdDoc = await Plate.create(documentToCreate);
            createdPlateDocs.push(createdDoc);

            // --- 텔레그램 메시지 생성 ---
            let telegramMessage = `🚗 *차량 번호판 인식 알림* 🚗\n`;
            // 모든 텔레그램 메시지 구성 요소에 escapeMarkdownV2 함수 적용
            telegramMessage += `*시간:* ${escapeMarkdownV2(detectionTime)}\n`;
            telegramMessage += `*번호판:* \`${escapeMarkdownV2(detectedPlateNumber || 'N/A')}\`\n`; // null인 경우 'N/A'로 표시
            telegramMessage += `*등록 여부:* \`${escapeMarkdownV2(currentRegistrationStatus)}\`\n`;

            if (currentRegistrationStatus === 'REGISTERED') {
                telegramMessage += `*등록자:* ${escapeMarkdownV2(userEmailInfo)}\n`; // userEmailInfo는 이미 위에서 정의되었으므로 안전함
                telegramMessage += `*게이트 작동:* ${currentShellyOperated ? '✅ 열림' : '❌ 작동 안 함 (오류)'}\n`;
            } else if (currentRegistrationStatus === 'UNREGISTERED') {
                telegramMessage += `*게이트 작동:* ❌ 작동 안 함\n`;
            } else { // NO_PLATE
                telegramMessage += `*게이트 작동:* ❌ 작동 안 함\n`;
            }

            const confidenceValue = item.best_confidence ? item.best_confidence.toFixed(2) : 'N/A';
            telegramMessage += `_신뢰도: ${escapeMarkdownV2(confidenceValue)}%_`;

            telegramMessages.push(telegramMessage);

        } // for 루프 종료

        console.log(`데이터베이스에 ${createdPlateDocs.length}개의 번호판 정보 저장 완료.`);
        console.log(`전체 요청에서 Shelly는 ${overallShellyOperated ? '작동했습니다.' : '작동하지 않았습니다.'}`);

        // --- 모든 텔레그램 메시지 전송 (한 번의 웹훅에 여러 번호판이 있을 경우) ---
        for (const msg of telegramMessages) {
            await sendTelegramMessage(msg);
        }

        res.status(201).json({
            message: 'Plate data successfully processed and saved.',
            count: createdPlateDocs.length,
            shellyOperated: overallShellyOperated, // 전체 요청에 대한 Shelly 작동 여부
            data: createdPlateDocs, // 저장된 문서들 반환
        });

    } catch (error) {
        // 에러 처리 로직
        if (error.name === 'ValidationError') {
            console.error('데이터베이스 저장 실패 (Mongoose Validation Error):', error.message);
            // 에러 메시지도 이스케이프하여 텔레그램에 전송
            await sendTelegramMessage(escapeMarkdownV2(`🚨 DB Validation Error: ${error.message}`));
            return res.status(422).json({
                message: 'Plate validation failed before saving to database.',
                error: error.message,
                details: error.errors,
            });
        }
        // bestUuid unique 에러 처리
        if (error.code === 11000) {
            console.warn('중복된 bestUuid로 번호판 데이터 저장 시도:', error.message);
            // 에러 메시지도 이스케이프하여 텔레그램에 전송
            await sendTelegramMessage(escapeMarkdownV2(`⚠️ Duplicate Plate Data: ${error.message}`));
            return res.status(409).json({ // 409 Conflict: 요청 충돌 (이미 존재하는 리소스)
                message: 'Duplicate plate data received (bestUuid already exists).',
                error: error.message,
            });
        }

        console.error('Error processing Plate data:', error);
        // 에러 메시지도 이스케이프하여 텔레그램에 전송
        await sendTelegramMessage(escapeMarkdownV2(`❌ Server Error Processing Plate: ${error.message}`));
        res.status(500).json({ message: 'An unexpected server error occurred', error: error.message });
    }
};

// --- getPlates 함수 수정 (날짜별 조회 추가) ---
exports.getPlates = async (req, res) => {
    try {
        const { startDate, endDate, plateNumber, registrationStatus } = req.query; // 쿼리 파라미터 추가

        let query = {}; // MongoDB 쿼리 객체

        // 1. 날짜 필터링 추가
        if (startDate || endDate) {
            query.startTime = {}; // startTime 필드에 대한 쿼리 객체 생성
            if (startDate) {
                // 시작 날짜 설정 (그 날짜의 UTC 00:00:00.000Z 부터)
                query.startTime.$gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                // 종료 날짜 설정 (그 날짜의 UTC 23:59:59.999Z 까지)
                // 다음 날의 UTC 자정(00:00:00Z)을 기준으로 $lt를 사용하면 편리합니다.
                const nextDay = new Date(`${endDate}T00:00:00.000Z`);
                nextDay.setDate(nextDay.getDate() + 1);
                query.startTime.$lt = nextDay;
            }
        }

        // 2. 특정 번호판 필터링 추가 (선택 사항)
        if (plateNumber) {
            // 대소문자 구분 없이 검색하려면 정규표현식 사용 (Index 효율 고려)
            query.bestPlateNumber = new RegExp(plateNumber, 'i');
        }

        // 3. 등록 상태 필터링 추가 (선택 사항)
        if (registrationStatus) {
            // enum에 정의된 값인지 검증하는 로직 추가 가능
            const validStatus = ['REGISTERED', 'UNREGISTERED', 'NO_PLATE'];
            if (validStatus.includes(registrationStatus.toUpperCase())) {
                query.registrationStatus = registrationStatus.toUpperCase();
            } else {
                console.warn(`Invalid registrationStatus query: ${registrationStatus}`);
                return res.status(400).json({ message: 'Invalid registration status provided.' });
            }
        }

        const plates = await Plate.find(query) // 구성된 쿼리 적용
            .select('startTime bestPlateNumber vehicle registrationStatus shellyOperated -_id')
            .sort({ startTime: -1 }); // 최신순 정렬

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

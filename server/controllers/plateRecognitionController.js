// controllers/plateRecognitionController.js

const PlateRecognition = require('../models/PlateRecognition');
const User = require('../models/userModel'); // User 모델 임포트!
const { _turnOn, _turnOff } = require('./shellyController'); // Shelly 컨트롤러 임포트!
const { sendTelegramMessage } = require('../utils/telegramUtils'); // 텔레그램 유틸리티 임포트!

// 릴레이 작동 지연 함수 (비동기)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 텔레그램 MarkdownV2 형식에서 예약된 문자를 이스케이프하는 유틸리티 함수
// Source: https://core.telegram.org/bots/api#markdownv2-style
const escapeMarkdownV2 = (text) => {
    if (text === null || typeof text === 'undefined') {
        return 'N/A'; // Null 또는 undefined일 경우 'N/A' 반환
    }
    const textString = String(text);
    // 텔레그램 MarkdownV2의 모든 예약 문자: _ * [ ] ( ) ~ ` > # + - = | { } . !
    // 정규식에서 대괄호 `[]` 안에 `-`가 있을 경우 마지막에 놓거나 이스케이프해야 합니다.
    const reservedChars = /([_*[\]()~`>#+\-=|{}.!])/g;
    return textString.replace(reservedChars, '\\$1');
};

/**
 * Rekor Scout POST 요청을 받아 번호판 데이터를 처리하고 DB에 저장합니다.
 * 'alpr_group' 타입의 데이터만 저장하며, 등록된 차량인 경우 Shelly를 작동시키고 텔레그램 메시지를 보냅니다.
 *
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
exports.createPlateRecognition = async (req, res) => {
    try {
        const requestBody = req.body; // Rekor Scout에서 보낸 원본 요청 바디

        // --- ### 1. 웹훅 소스가 보낸 에러 처리 (Rekor Scout 클라우드 웹훅에서 올 수 있는 에러) ### ---
        // Local에서 보낸 데이터에서는 이 부분에 `error` 필드가 없을 수 있지만,
        // 혹시 모를 경우를 대비하여 유지하는 것이 안전합니다.
        if (requestBody && requestBody.error) {
            console.warn(`[${new Date().toISOString()}] 번호판 인식기(소스)로부터 에러를 수신했습니다:`, requestBody.error);
            // 에러 보고 시 텔레그램 알림 전송
            await sendTelegramMessage(escapeMarkdownV2(`🚨 Rekor Scout Source Error: ${requestBody.error}`));
            return res.status(400).json({
                message: 'Webhook source reported an error. Processing stopped.',
                sourceError: requestBody.error,
            });
        }

        // --- ### 2. 데이터 타입 검증 (alpr_group만 처리) ### ---
        // Rekor Scout는 여러 data_type을 보낼 수 있으므로, alpr_group만 DB에 저장
        if (requestBody.data_type !== 'alpr_group') {
            console.log(`[${new Date().toISOString()}] Received data_type: ${requestBody.data_type}. Not an alpr_group, so not saving to DB.`);
            return res.status(200).json({ // 다른 타입은 성공적으로 받았음을 알림
                message: `Received data_type: ${requestBody.data_type}. Only 'alpr_group' data is processed and saved to the database.`,
                receivedDataType: requestBody.data_type
            });
        }

        // --- ### 3. alpr_group 필수 필드 유효성 검사 및 데이터 추출 ### ---
        const {
            epoch_start,
            best_plate_number,
            best_confidence,
            vehicle_crop_jpeg,
            best_plate, // best_plate 객체를 가져옵니다.
            epoch_end,
            best_uuid, // best_uuid도 직접 가져옵니다.
            company_id,
            agent_uid,
            camera_id,
            vehicle // vehicle 객체를 직접 가져옵니다.
        } = requestBody;

        // plate_crop_jpeg는 best_plate 객체 안에 있을 수 있습니다.
        const plate_crop_jpeg = best_plate ? best_plate.plate_crop_jpeg : undefined;

        if (!epoch_start || !best_plate_number || best_confidence === undefined || !best_uuid) {
            console.warn(`[${new Date().toISOString()}] Missing required fields for alpr_group data.`);
            return res.status(400).json({ message: 'Missing required fields (epoch_start, best_plate_number, best_confidence, best_uuid) for alpr_group data.' });
        }

        let overallShellyOperated = false; // 이번 요청에서 Shelly가 한 번이라도 작동했는지 여부
        const telegramMessages = []; // 보낼 텔레그램 메시지들을 담을 배열

        const detectedPlateNumber = best_plate_number.toUpperCase().trim();
        // detectionTime을 로컬 시간으로 표시 (예: America/New_York, 또는 'Asia/Seoul'로 변경 가능)
        const detectionTime = new Date(epoch_start).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let currentRegistrationStatus = 'NO_PLATE'; // 현재 번호판의 등록 상태 초기화
        let currentShellyOperated = false;       // 현재 번호판 처리로 Shelly가 작동했는지 여부
        let userEmailInfo = '';                  // 등록된 사용자의 이메일 정보 초기화

        // --- ### 4. 등록된 차량 확인 및 Shelly 제어 ### ---
        if (detectedPlateNumber && detectedPlateNumber.length > 0) {
            const registeredUser = await User.findOne({
                licensePlates: detectedPlateNumber
            });

            if (registeredUser) {
                currentRegistrationStatus = 'REGISTERED';
                userEmailInfo = registeredUser.email || '등록자 이메일 없음';
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 등록된 차량입니다. 사용자: ${userEmailInfo}`);

                // 등록된 차량이고, 아직 이번 요청에서 Shelly가 작동하지 않았다면 작동
                // overallShellyOperated 플래그를 통해 한 번의 요청 처리 과정에서 Shelly가 중복 작동하는 것을 방지
                if (!overallShellyOperated) {
                    try {
                        console.log(`[${new Date().toISOString()}] 등록된 차량 감지! Shelly 릴레이 시퀀스를 시작합니다.`);
                        await _turnOn();
                        await delay(1000); // 1초 지연
                        await _turnOff();
                        console.log(`[${new Date().toISOString()}] Shelly 릴레이 시퀀스 완료.`);
                        currentShellyOperated = true; // 현재 번호판 처리로 Shelly 작동
                        overallShellyOperated = true; // 전체 요청에서 Shelly 작동
                    } catch (shellyError) {
                        console.error(`[${new Date().toISOString()}] Shelly 릴레이 제어 중 오류 발생:`, shellyError.message);
                        // Shelly 오류 발생 시 텔레그램 알림
                        await sendTelegramMessage(escapeMarkdownV2(`🚨 Shelly Control Error: ${shellyError.message}`));
                        // Shelly 오류가 발생하더라도 번호판 저장 및 응답은 계속 진행
                    }
                }
            } else {
                currentRegistrationStatus = 'UNREGISTERED';
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 미등록 차량입니다. Shelly를 작동하지 않습니다.`);
            }
        } else {
            console.log(`[${new Date().toISOString()}] 인식된 번호판이 유효하지 않습니다 (NO_PLATE). Shelly를 작동하지 않습니다.`);
            // currentRegistrationStatus는 이미 'NO_PLATE'로 초기화되어 있음
        }

        // --- ### 5. 데이터베이스에 저장할 문서 객체 구성 ### ---
        const documentToCreate = {
            dataType: requestBody.data_type,
            epochStart: epoch_start,
            startTime: new Date(epoch_start), // Date 객체로 변환하여 저장
            epochEnd: epoch_end,
            endTime: epoch_end ? new Date(epoch_end) : undefined, // Date 객체로 변환하여 저장
            bestUuid: best_uuid,
            companyId: company_id,
            agentUid: agent_uid,
            cameraId: camera_id,
            bestPlateNumber: detectedPlateNumber,
            bestConfidence: best_confidence,
            plateCropJpeg: plate_crop_jpeg,
            vehicleCropJpeg: vehicle_crop_jpeg,
            vehicle: { // vehicle 객체의 상세 정보
                color: vehicle?.color?.[0]?.name || 'N/A',
                make: vehicle?.make?.[0]?.name || 'N/A',
                makeModel: vehicle?.make_model?.[0]?.name || 'N/A',
                bodyType: vehicle?.body_type?.[0]?.name || 'N/A',
            },
            registrationStatus: currentRegistrationStatus,
            shellyOperated: currentShellyOperated,
            userEmail: userEmailInfo // 등록된 사용자의 이메일 저장
        };

        const createdDoc = await PlateRecognition.create(documentToCreate);
        // 생성된 문서를 응답을 위해 배열에 추가 (현재는 한 요청당 한 번호판이므로 createdPlateDocs는 1개 요소)
        const createdPlateDocs = [createdDoc];


        // --- ### 6. 텔레그램 메시지 생성 및 전송 ### ---
        let telegramMessage = `🚗 *차량 번호판 인식 알림* 🚗\n`;
        telegramMessage += `*시간:* ${escapeMarkdownV2(detectionTime)}\n`;
        telegramMessage += `*번호판:* \`${escapeMarkdownV2(detectedPlateNumber || 'N/A')}\`\n`;
        telegramMessage += `*등록 여부:* \`${escapeMarkdownV2(currentRegistrationStatus)}\`\n`;

        if (currentRegistrationStatus === 'REGISTERED') {
            telegramMessage += `*등록자:* ${escapeMarkdownV2(userEmailInfo)}\n`;
            telegramMessage += `*게이트 작동:* ${currentShellyOperated ? '✅ 열림' : '❌ 작동 안 함 (오류)'}\n`;
        } else if (currentRegistrationStatus === 'UNREGISTERED') {
            telegramMessage += `*게이트 작동:* ❌ 작동 안 함\n`;
        } else { // NO_PLATE
            telegramMessage += `*게이트 작동:* ❌ 작동 안 함\n`;
        }

        const confidenceValue = best_confidence ? best_confidence.toFixed(2) : 'N/A';
        telegramMessage += `_신뢰도: ${escapeMarkdownV2(confidenceValue)}%_`;

        telegramMessages.push(telegramMessage); // 생성된 메시지를 배열에 추가

        console.log(`[${new Date().toISOString()}] 데이터베이스에 ${createdPlateDocs.length}개의 번호판 정보 저장 완료.`);
        console.log(`[${new Date().toISOString()}] 전체 요청에서 Shelly는 ${overallShellyOperated ? '작동했습니다.' : '작동하지 않았습니다.'}`);

        // 모든 텔레그램 메시지 전송 (현재는 1개)
        for (const msg of telegramMessages) {
            await sendTelegramMessage(msg);
        }

        // --- ### 7. 응답 반환 ### ---
        res.status(201).json({
            message: 'Plate data successfully processed and saved.',
            count: createdPlateDocs.length,
            shellyOperated: overallShellyOperated,
            data: createdPlateDocs.map(doc => ({
                id: doc._id,
                dataType: doc.dataType,
                epochStart: doc.epochStart,
                bestPlateNumber: doc.bestPlateNumber,
                bestConfidence: doc.bestConfidence,
                plateCropJpeg: doc.plateCropJpeg ? '*** Base64 plate crop image data available ***' : 'No plate crop image',
                vehicleCropJpeg: doc.vehicleCropJpeg ? '*** Base64 vehicle crop image data available ***' : 'No vehicle crop image',
                registrationStatus: doc.registrationStatus,
                shellyOperated: doc.shellyOperated,
                userEmail: doc.userEmail,
                createdAt: doc.createdAt
            })),
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing Plate data:`, error);
        // --- ### 8. 상세 에러 핸들링 ### ---
        if (error.name === 'ValidationError') {
            console.error(`[${new Date().toISOString()}] 데이터베이스 저장 실패 (Mongoose Validation Error):`, error.message);
            await sendTelegramMessage(escapeMarkdownV2(`🚨 DB Validation Error: ${error.message}`));
            return res.status(422).json({ // 422 Unprocessable Entity
                message: 'Plate validation failed before saving to database.',
                error: error.message,
                details: error.errors,
            });
        }
        // bestUuid unique 에러 처리 (MongoDB duplicate key error)
        if (error.code === 11000) {
            console.warn(`[${new Date().toISOString()}] 중복된 bestUuid로 번호판 데이터 저장 시도:`, error.message);
            await sendTelegramMessage(escapeMarkdownV2(`⚠️ Duplicate Plate Data: ${error.message}`));
            return res.status(409).json({ // 409 Conflict: 요청 충돌 (이미 존재하는 리소스)
                message: 'Duplicate plate data received (bestUuid already exists).',
                error: error.message,
            });
        }

        await sendTelegramMessage(escapeMarkdownV2(`❌ Server Error Processing Plate: ${error.message}`));
        res.status(500).json({ message: 'An unexpected server error occurred', error: error.message });
    }
};

/**
 * 날짜 범위, 번호판 번호, 등록 상태를 기준으로 번호판 인식 데이터를 조회합니다.
 * GET /api/plate-recognitions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&plateNumber=ABC123&registrationStatus=REGISTERED
 *
 * @param {Object} req - Express 요청 객체 (req.query를 통해 필터링 파라미터 받음)
 * @param {Object} res - Express 응답 객체
 */
exports.getPlateRecognitions = async (req, res) => {
    try {
        const { startDate, endDate, plateNumber, registrationStatus } = req.query; // 쿼리 파라미터 추출

        let query = {}; // MongoDB 쿼리 객체 초기화

        // 1. 날짜 필터링 (startTime 필드 사용)
        if (startDate || endDate) {
            query.startTime = {}; // startTime 필드에 대한 쿼리 객체 생성
            if (startDate) {
                // 시작 날짜 설정: 해당 날짜의 UTC 00:00:00.000Z 부터
                query.startTime.$gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                // 종료 날짜 설정: 해당 날짜의 UTC 23:59:59.999Z 까지
                // 다음 날의 UTC 자정(00:00:00Z)을 기준으로 $lt를 사용하면 편리합니다.
                const nextDay = new Date(`${endDate}T00:00:00.000Z`);
                nextDay.setDate(nextDay.getDate() + 1);
                query.startTime.$lt = nextDay;
            }
        }

        // 2. 특정 번호판 필터링 (bestPlateNumber 필드 사용)
        if (plateNumber) {
            // 대소문자 구분 없이 검색하려면 정규표현식 사용 (i 옵션)
            // 인덱스를 효율적으로 사용하려면 정규표현식이 ^로 시작하는 것이 좋습니다.
            // 하지만 부분 일치 검색을 위해 `new RegExp(plateNumber, 'i')`를 그대로 사용합니다.
            query.bestPlateNumber = new RegExp(plateNumber, 'i');
        }

        // 3. 등록 상태 필터링 (registrationStatus 필드 사용)
        if (registrationStatus) {
            const validStatus = ['REGISTERED', 'UNREGISTERED', 'NO_PLATE'];
            const upperCaseStatus = registrationStatus.toUpperCase();
            if (validStatus.includes(upperCaseStatus)) {
                query.registrationStatus = upperCaseStatus;
            } else {
                console.warn(`[${new Date().toISOString()}] Invalid registrationStatus query: ${registrationStatus}`);
                return res.status(400).json({ message: 'Invalid registration status provided. Valid statuses are: REGISTERED, UNREGISTERED, NO_PLATE.' });
            }
        }

        // MongoDB 쿼리 실행
        // IMPORTANT: Add plateCropJpeg, vehicleCropJpeg, and vehicle to the select statement
        const plates = await PlateRecognition.find(query) // 구성된 쿼리 적용
            .select('startTime bestPlateNumber bestConfidence registrationStatus shellyOperated userEmail createdAt plateCropJpeg vehicleCropJpeg vehicle -_id') // 조회할 필드 선택
            .sort({ startTime: -1 }); // 최신순 (startTime 내림차순) 정렬

        res.status(200).json({
            message: 'Plate recognition data successfully retrieved.',
            count: plates.length,
            data: plates,
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error retrieving Plate recognition data:`, error);
        res.status(500).json({ message: 'Error retrieving Plate recognition data', error: error.message });
    }
};

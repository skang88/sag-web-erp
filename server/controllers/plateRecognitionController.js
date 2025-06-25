// controllers/plateRecognitionController.js

const PlateRecognition = require('../models/PlateRecognition');
const User = require('../models/userModel'); // User 모델 임포트! (실제 앱에서는 필요)
const { _turnOn, _turnOff } = require('./shellyController'); // Shelly 컨트롤러 임포트! (실제 앱에서는 필요)
const { sendTelegramMessage } = require('../utils/telegramUtils'); // 텔레그램 유틸리티 임포트! (실제 앱에서는 필요)

// 릴레이 작동 지연 함수 (비동기)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 텔레그램 MarkdownV2 형식에서 예약된 문자를 이스케이프하는 유틸리티 함수
const escapeMarkdownV2 = (text) => {
    if (text === null || typeof text === 'undefined') {
        return 'N/A';
    }
    const textString = String(text);
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
        const requestBody = req.body;

        if (requestBody && requestBody.error) {
            console.warn(`[${new Date().toISOString()}] 번호판 인식기(소스)로부터 에러를 수신했습니다:`, requestBody.error);
            await sendTelegramMessage(escapeMarkdownV2(`🚨 Rekor Scout Source Error: ${requestBody.error}`));
            return res.status(400).json({
                message: 'Webhook source reported an error. Processing stopped.',
                sourceError: requestBody.error,
            });
        }

        if (requestBody.data_type !== 'alpr_group') {
            console.log(`[${new Date().toISOString()}] Received data_type: ${requestBody.data_type}. Not an alpr_group, so not saving to DB.`);
            return res.status(200).json({
                message: `Received data_type: ${requestBody.data_type}. Only 'alpr_group' data is processed and saved to the database.`,
                receivedDataType: requestBody.data_type
            });
        }

        const {
            epoch_start,
            best_plate_number,
            best_confidence,
            vehicle_crop_jpeg,
            best_plate,
            epoch_end,
            best_uuid,
            company_id,
            agent_uid,
            camera_id,
            vehicle
        } = requestBody;

        const plate_crop_jpeg = best_plate ? best_plate.plate_crop_jpeg : undefined;

        if (!epoch_start || !best_plate_number || best_confidence === undefined || !best_uuid) {
            console.warn(`[${new Date().toISOString()}] Missing required fields for alpr_group data.`);
            return res.status(400).json({ message: 'Missing required fields (epoch_start, best_plate_number, best_confidence, best_uuid) for alpr_group data.' });
        }

        let overallShellyOperated = false;
        const telegramMessages = [];

        const detectedPlateNumber = best_plate_number.toUpperCase().trim();
        const detectionTime = new Date(epoch_start).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let currentRegistrationStatus = 'NO_PLATE';
        let currentShellyOperated = false;
        let userEmailInfo = '';

        if (detectedPlateNumber && detectedPlateNumber.length > 0) {
            // User 모델을 사용하여 등록된 사용자 확인
            const registeredUser = await User.findOne({
                licensePlates: detectedPlateNumber
            });

            if (registeredUser) {
                currentRegistrationStatus = 'REGISTERED';
                userEmailInfo = registeredUser.email || '등록자 이메일 없음';
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 등록된 차량입니다. 사용자: ${userEmailInfo}`);

                if (!overallShellyOperated) {
                    try {
                        console.log(`[${new Date().toISOString()}] 등록된 차량 감지! Shelly 릴레이 시퀀스를 시작합니다.`);
                        await _turnOn();
                        await delay(1000);
                        await _turnOff();
                        console.log(`[${new Date().toISOString()}] Shelly 릴레이 시퀀스 완료.`);
                        currentShellyOperated = true;
                        overallShellyOperated = true;
                    } catch (shellyError) {
                        console.error(`[${new Date().toISOString()}] Shelly 릴레이 제어 중 오류 발생:`, shellyError.message);
                        await sendTelegramMessage(escapeMarkdownV2(`🚨 Shelly Control Error: ${shellyError.message}`));
                    }
                }
            } else {
                currentRegistrationStatus = 'UNREGISTERED';
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 미등록 차량입니다. Shelly를 작동하지 않습니다.`);
            }
        } else {
            console.log(`[${new Date().toISOString()}] 인식된 번호판이 유효하지 않습니다 (NO_PLATE). Shelly를 작동하지 않습니다.`);
        }

        const documentToCreate = {
            dataType: requestBody.data_type,
            epochStart: epoch_start,
            startTime: new Date(epoch_start),
            epochEnd: epoch_end,
            endTime: epoch_end ? new Date(epoch_end) : undefined,
            bestUuid: best_uuid,
            companyId: company_id,
            agentUid: agent_uid,
            cameraId: camera_id,
            bestPlateNumber: detectedPlateNumber,
            bestConfidence: best_confidence,
            plateCropJpeg: plate_crop_jpeg,
            vehicleCropJpeg: vehicle_crop_jpeg,
            vehicle: {
                color: vehicle?.color?.[0]?.name || 'N/A',
                make: vehicle?.make?.[0]?.name || 'N/A',
                makeModel: vehicle?.make_model?.[0]?.name || 'N/A',
                bodyType: vehicle?.body_type?.[0]?.name || 'N/A',
            },
            registrationStatus: currentRegistrationStatus,
            shellyOperated: currentShellyOperated,
            userEmail: userEmailInfo
        };

        const createdDoc = await PlateRecognition.create(documentToCreate);
        const createdPlateDocs = [createdDoc];

        let telegramMessage = `🚗 *차량 번호판 인식 알림* 🚗\n`;
        telegramMessage += `*시간:* ${escapeMarkdownV2(detectionTime)}\n`;
        telegramMessage += `*번호판:* \`${escapeMarkdownV2(detectedPlateNumber || 'N/A')}\`\n`;
        telegramMessage += `*등록 여부:* \`${escapeMarkdownV2(currentRegistrationStatus)}\`\n`;

        if (currentRegistrationStatus === 'REGISTERED') {
            telegramMessage += `*등록자:* ${escapeMarkdownV2(userEmailInfo)}\n`;
            telegramMessage += `*게이트 작동:* ${currentShellyOperated ? '✅ 열림' : '❌ 작동 안 함 (오류)'}\n`;
        } else if (currentRegistrationStatus === 'UNREGISTERED') {
            telegramMessage += `*게이트 작동:* ❌ 작동 안 함\n`;
        } else {
            telegramMessage += `*게이트 작동:* ❌ 작동 안 함\n`;
        }

        const confidenceValue = best_confidence ? best_confidence.toFixed(2) : 'N/A';
        telegramMessage += `_신뢰도: ${escapeMarkdownV2(confidenceValue)}%_`;

        telegramMessages.push(telegramMessage);

        console.log(`[${new Date().toISOString()}] 데이터베이스에 ${createdPlateDocs.length}개의 번호판 정보 저장 완료.`);
        console.log(`[${new Date().toISOString()}] 전체 요청에서 Shelly는 ${overallShellyOperated ? '작동했습니다.' : '작동하지 않았습니다.'}`);

        for (const msg of telegramMessages) {
            await sendTelegramMessage(msg);
        }

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
        if (error.name === 'ValidationError') {
            console.error(`[${new Date().toISOString()}] 데이터베이스 저장 실패 (Mongoose Validation Error):`, error.message);
            await sendTelegramMessage(escapeMarkdownV2(`🚨 DB Validation Error: ${error.message}`));
            return res.status(422).json({
                message: 'Plate validation failed before saving to database.',
                error: error.message,
                details: error.errors,
            });
        }
        if (error.code === 11000) {
            console.warn(`[${new Date().toISOString()}] 중복된 bestUuid로 번호판 데이터 저장 시도:`, error.message);
            await sendTelegramMessage(escapeMarkdownV2(`⚠️ Duplicate Plate Data: ${error.message}`));
            return res.status(409).json({
                message: 'Duplicate plate data received (bestUuid already exists).',
                error: error.message,
            });
        }

        await sendTelegramMessage(escapeMarkdownV2(`❌ Server Error Processing Plate: ${error.message}`));
        res.status(500).json({ message: 'An unexpected server error occurred', error: error.message });
    }
};

/**
 * 날짜 범위, 번호판 번호, 등록 상태, 페이지네이션을 기준으로 번호판 인식 데이터를 조회합니다.
 * GET /api/plate-recognitions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&plateNumber=ABC123&registrationStatus=REGISTERED&page=1&limit=10
 *
 * @param {Object} req - Express 요청 객체 (req.query를 통해 필터링 및 페이지네이션 파라미터 받음)
 * @param {Object} res - Express 응답 객체
 */
exports.getPlateRecognitions = async (req, res) => {
    try {
        const { startDate, endDate, plateNumber, registrationStatus, page = 1, limit = 10 } = req.query; // page, limit 기본값 설정

        let query = {}; // MongoDB 쿼리 객체 초기화

        // 1. 날짜 필터링 (startTime 필드 사용)
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                query.startTime.$gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                const nextDay = new Date(`${endDate}T00:00:00.000Z`);
                nextDay.setDate(nextDay.getDate() + 1);
                query.startTime.$lt = nextDay;
            }
        }

        // 2. 특정 번호판 필터링 (bestPlateNumber 필드 사용)
        if (plateNumber) {
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

        // 페이지네이션 계산
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // 전체 문서 수 조회 (페이지네이션을 위해 필요)
        const totalItems = await PlateRecognition.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limitNum);

        // MongoDB 쿼리 실행
        // 불필요한 vehicle 필드 (color, make, makeModel, bodyType)를 select에서 제외
        const plates = await PlateRecognition.find(query)
            .select('startTime bestPlateNumber bestConfidence registrationStatus shellyOperated userEmail createdAt plateCropJpeg vehicleCropJpeg bestUuid') // vehicle.color 등은 제외
            .sort({ startTime: -1 }) // 최신순 (startTime 내림차순) 정렬
            .skip(skip)   // 건너뛸 문서 수
            .limit(limitNum); // 가져올 문서 수

        res.status(200).json({
            message: 'Plate recognition data successfully retrieved.',
            count: plates.length, // 현재 페이지의 아이템 수
            totalItems: totalItems, // 전체 아이템 수
            totalPages: totalPages, // 전체 페이지 수
            currentPage: pageNum, // 현재 페이지 번호
            data: plates,
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error retrieving Plate recognition data:`, error);
        res.status(500).json({ message: 'Error retrieving Plate recognition data', error: error.message });
    }
};

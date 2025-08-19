// controllers/plateRecognitionController.js

const PlateRecognition = require('../models/PlateRecognition');
const User = require('../models/userModel'); // User 모델 임포트! (실제 앱에서는 필요)
const Camera = require('../models/cameraModel'); // Camera 모델 임포트!
const { _turnOn, _turnOff } = require('./shellyController'); // Shelly 컨트롤러 임포트!
const { broadcast } = require('./websocketController'); // WebSocket 컨트롤러에서 broadcast 함수 임포트

const { DateTime } = require('luxon');

// 릴레이 작동 지연 함수 (비동기)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

        const detectedPlateNumberForCheck = best_plate_number.toUpperCase().trim();
        if (detectedPlateNumberForCheck) {
            const oneMinuteAgo = new Date(new Date(epoch_start).getTime() - 60000);
            const recentRecognition = await PlateRecognition.findOne({
                bestPlateNumber: detectedPlateNumberForCheck,
                startTime: { $gte: oneMinuteAgo }
            }).sort({ startTime: -1 });

            if (recentRecognition) {
                const timeSinceLast = (new Date(epoch_start) - recentRecognition.startTime) / 1000;
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumberForCheck}] ${timeSinceLast.toFixed(1)}초 전 동일한 번호판이 인식되어 중복 처리를 방지합니다. (ID: ${recentRecognition._id})`);
                return res.status(200).json({
                    message: `Duplicate plate recognized within a minute. Last seen ${timeSinceLast.toFixed(1)}s ago. Ignoring.`,
                    plateNumber: detectedPlateNumberForCheck,
                });
            }
        }

        let overallShellyOperated = false;
        
        const detectedPlateNumber = best_plate_number.toUpperCase().trim();
        const detectionTime = new Date(epoch_start).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let currentRegistrationStatus = 'NO_PLATE';
        let currentShellyOperated = false;
        let userEmailInfo = '';

        let cameraConfig = null; // 카메라 설정을 저장할 변수

        if (detectedPlateNumber && detectedPlateNumber.length > 0) {
            // User 모델을 사용하여 등록된 사용자 확인
            const registeredUser = await User.findOne({
                licensePlates: detectedPlateNumber
            });

            if (registeredUser) {
                currentRegistrationStatus = 'REGISTERED';
                userEmailInfo = registeredUser.email || '등록자 이메일 없음';
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 등록된 차량입니다. 사용자: ${userEmailInfo}`);
            } else {
                currentRegistrationStatus = 'UNREGISTERED';
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 미등록 차량입니다.`);
            }

            // !! 등록 여부와 관계없이 Shelly 작동 !!
            console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 차량 감지. 등록 여부(${currentRegistrationStatus})와 관계없이 Shelly 작동을 시도합니다.`);
            
            // camera_id를 기반으로 카메라 설정 조회
            cameraConfig = await Camera.findOne({ cameraId: String(camera_id) }).lean(); // String으로 변환하여 조회

            const now = new Date(); // UTC 기준 현재 시간
            
            // UTC 시간을 EST 시간대로 변환
            const utcNow = DateTime.utc();

            // EST (America/New_York) 타임존으로 변환
            const nowInEst = utcNow.setZone('America/New_York');

            // Luxon에서는 .hour, .minute, .weekday 사용
            const currentHour = nowInEst.hour; // 0~23
            const currentMinute = nowInEst.minute;
            const currentDay = nowInEst.weekday; // 1 = Monday, ..., 7 = Sunday

            // 새벽 4시부터 저녁 7시(19시) 이전까지만 Shelly 작동 허용 (EST 운영 시간)
            const isOperatingTime = (currentHour > 3 || (currentHour === 3 && nowInEst.getMinutes() >= 30)) && currentHour < 19;

            // 월요일(1)부터 금요일(5)까지
            const isWeekday = currentDay >= 1 && currentDay <= 5;

            // 11:00 ~ 11:59 또는 15:00 ~ 15:59
            // const isRestrictedTime = (currentHour === 11 && currentMinute >= 0 && currentMinute <= 59) ||
            //                          (currentHour === 15 && currentMinute >= 0 && currentMinute <= 59);
            isRestrictedTime = false

            if (isWeekday && isRestrictedTime) {
                console.log(`[${new Date().toISOString()}] 현재 시간(${currentHour}시 ${currentMinute}분)은 평일 제한 시간(${currentHour}:00-${currentHour}:59)이므로 릴레이를 작동하지 않습니다.`);
                return res.status(200).json({ message: `Shelly operation skipped due to weekday restricted time (${currentHour}:00-${currentHour}:59).` });
            }

            if (cameraConfig && cameraConfig.shellyId) {
                if (isOperatingTime) {
                    if (!overallShellyOperated) {
                        try {
                            console.log(`[${new Date().toISOString()}] 현재 시간(${currentHour}시 ${currentMinute}분) [${cameraConfig.name}]에서 차량 감지! Shelly ${cameraConfig.shellyId} 릴레이 시퀀스를 시작합니다.`);
                            await _turnOn(cameraConfig.shellyId); // 올바른 shellyId 전달
                            await delay(1000);
                            await _turnOff(cameraConfig.shellyId); // 올바른 shellyId 전달
                            console.log(`[${new Date().toISOString()}] Shelly ${cameraConfig.shellyId} 릴레이 시퀀스 완료.`);
                            currentShellyOperated = true;
                            overallShellyOperated = true;
                        } catch (shellyError) {
                            console.error(`[${new Date().toISOString()}] [${cameraConfig.name}] Shelly ${cameraConfig.shellyId} 릴레이 제어 중 오류 발생:`, shellyError.message);
                        }
                    }
                } else {
                    // 운영 시간이 아닐 경우 로그만 남김
                    console.log(`[${new Date().toISOString()}] 현재 시간(${currentHour}시)은 Shelly 작동 시간(03:30-19:00)이 아니므로 릴레이를 작동하지 않습니다.`);
                }
            } else {
                console.warn(`[${new Date().toISOString()}] [${camera_id}]에 대한 카메라 설정을 찾을 수 없습니다. Shelly를 작동하지 않습니다.`);
                
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
            cameraId: String(camera_id), // (수정) 항상 문자열로 저장되도록 타입 변환
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

        // 실시간 모니터링을 위해 WebSocket 클라이언트에게 데이터 전송
        const cameraNameForBroadcast = cameraConfig ? cameraConfig.name : `Unknown (${camera_id})`;
        const broadcastData = {
            bestUuid: createdDoc.bestUuid,
            cameraName: cameraNameForBroadcast,
            startTime: createdDoc.startTime,
            bestPlateNumber: createdDoc.bestPlateNumber,
            registrationStatus: createdDoc.registrationStatus,
            userEmail: createdDoc.userEmail,
            plateCropJpeg: createdDoc.plateCropJpeg,
            vehicleCropJpeg: createdDoc.vehicleCropJpeg,
        };
        broadcast({ type: 'NEW_PLATE_RECOGNITION', payload: broadcastData });

        const createdPlateDocs = [createdDoc];

        console.log(`[${new Date().toISOString()}] 데이터베이스에 ${createdPlateDocs.length}개의 번호판 정보 저장 완료.`);
        console.log(`[${new Date().toISOString()}] 전체 요청에서 Shelly는 ${overallShellyOperated ? '작동했습니다.' : '작동하지 않았습니다.'}`);

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
            return res.status(422).json({
                message: 'Plate validation failed before saving to database.',
                error: error.message,
                details: error.errors,
            });
        }
        if (error.code === 11000) {
            console.warn(`[${new Date().toISOString()}] 중복된 bestUuid로 번호판 데이터 저장 시도:`, error.message);
            return res.status(409).json({
                message: 'Duplicate plate data received (bestUuid already exists).',
                error: error.message,
            });
        }
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
        const { startDate, endDate, plateNumber, registrationStatus, cameraId, page = 1, limit = 10 } = req.query; // cameraId 추가, page, limit 기본값 설정

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

        // 4. 카메라 ID 필터링 (cameraId 필드 사용)
        if (cameraId) {
            query.cameraId = cameraId;
        }

        // 페이지네이션 계산
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Aggregation Pipeline을 사용하여 카메라 정보와 조인
        const aggregationPipeline = [];

        // 1. 필터링 ($match)
        if (Object.keys(query).length > 0) {
            aggregationPipeline.push({ $match: query });
        }

        // 2. 카메라 정보 조인 ($lookup)
        aggregationPipeline.push({
            $lookup: {
                from: 'cameras', // 'cameras' 컬렉션 (모델 이름의 복수형)
                localField: 'cameraId',
                foreignField: 'cameraId',
                as: 'cameraInfo'
            }
        });

        // 3. 조인된 정보 필드 추가 및 형식 정리 ($addFields)
        aggregationPipeline.push({
            $addFields: {
                cameraName: { $ifNull: [{ $arrayElemAt: ['$cameraInfo.name', 0] }, 'Unknown'] }
            }
        });

        // 4. 최종적으로 보여줄 필드 선택 ($project)
        aggregationPipeline.push({
            $project: {
                cameraInfo: 0, // 조인에 사용된 임시 필드 제외
                cameraIdString: 0, // 조인에 사용된 임시 필드 제외
                'vehicle.color': 0, 'vehicle.make': 0, 'vehicle.makeModel': 0, 'vehicle.bodyType': 0 // 불필요한 vehicle 필드 제외
            }
        });

        // 페이지네이션을 위한 전체 카운트와 데이터 조회를 별도로 실행
        const countPipeline = [...aggregationPipeline, { $count: 'totalItems' }];
        const dataPipeline = [
            ...aggregationPipeline,
            { $sort: { startTime: -1 } }, // 최신순 (startTime 내림차순) 정렬
            { $skip: skip },   // 건너뛸 문서 수
            { $limit: limitNum } // 가져올 문서 수
        ];

        const totalItemsResult = await PlateRecognition.aggregate(countPipeline);
        const totalItems = totalItemsResult.length > 0 ? totalItemsResult[0].totalItems : 0;
        const totalPages = Math.ceil(totalItems / limitNum);
        const plates = await PlateRecognition.aggregate(dataPipeline);

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

/**
 * DB에 저장된 모든 카메라의 목록을 조회합니다.
 * 프론트엔드에서 필터 드롭다운 등을 만드는 데 사용됩니다.
 * GET /api/plate-recognitions/cameras
 */
exports.getAvailableCameras = async (req, res) => {
    try {
        // 이름과 ID만 선택하여 반환합니다.
        const cameras = await Camera.find({}).select('name cameraId shellyId').lean();
        res.status(200).json(cameras);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error retrieving cameras:`, error);
        res.status(500).json({ message: 'Error retrieving camera list', error: error.message });
    }
};

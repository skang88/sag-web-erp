// controllers/plateRecognitionController.js

const PlateRecognition = require('../models/PlateRecognition');
const User = require('../models/userModel'); // Re-import User model
const Visitor = require('../models/visitorModel'); // Keep Visitor model
const Camera = require('../models/cameraModel');
const { _turnOn, _turnOff } = require('./shellyController');
const { broadcast } = require('./websocketController');

const { DateTime } = require('luxon');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
        
        let currentRegistrationStatus = 'NO_PLATE';
        let currentShellyOperated = false;
        let userEmailInfo = ''; // Keep for user logs
        let registeredVisitor = null; // To hold visitor data if found

        let cameraConfig = null;

        if (detectedPlateNumber && detectedPlateNumber.length > 0) {
            
            const registeredUser = await User.findOne({ licensePlates: detectedPlateNumber });

            if (registeredUser) {
                currentRegistrationStatus = 'REGISTERED';
                userEmailInfo = registeredUser.email || '등록자 이메일 없음';
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 등록된 직원 차량입니다. 사용자: ${userEmailInfo}.`);
            } else {
                registeredVisitor = await Visitor.findOne({
                    licensePlate: detectedPlateNumber,
                    visitEndDate: { $gte: new Date() }
                }).sort({ visitEndDate: -1 });

                if (registeredVisitor) {
                    currentRegistrationStatus = 'REGISTERED_VISITOR';
                    console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 등록된 방문자 차량입니다. 만료일: ${registeredVisitor.visitEndDate.toISOString()}.`);
                } else {
                    currentRegistrationStatus = 'UNREGISTERED';
                    console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 미등록 차량입니다.`);
                }
            }

            cameraConfig = await Camera.findOne({ cameraId: String(camera_id) }).lean();
            
            const utcNow = DateTime.utc();
            const nowInEst = utcNow.setZone('America/New_York');
            const currentHour = nowInEst.hour;
            const currentDay = nowInEst.weekday; 

            const isOperatingTime = (currentHour > 3 || (currentHour === 3 && nowInEst.minute >= 30)) && currentHour < 19;
            const isWeekday = currentDay >= 1 && currentDay <= 5;
            const isRestrictedTime = false; // Placeholder

            if (isWeekday && isRestrictedTime) {
                console.log(`[${new Date().toISOString()}] 현재 시간(${nowInEst.toFormat('HH:mm')})은 평일 제한 시간이므로 릴레이를 작동하지 않습니다.`);
                // No return here, just log
            }

            // --- Shelly Operation Logic ---
            // Only operate for registered visitors within operating hours
            if (registeredVisitor && cameraConfig && cameraConfig.shellyId) {
                if (isOperatingTime) {
                    try {
                        console.log(`[${new Date().toISOString()}] 방문자 차량 확인. Shelly ${cameraConfig.shellyId} 릴레이 시퀀스를 시작합니다.`);
                        await _turnOn(cameraConfig.shellyId);
                        await delay(1000);
                        await _turnOff(cameraConfig.shellyId);
                        console.log(`[${new Date().toISOString()}] Shelly ${cameraConfig.shellyId} 릴레이 시퀀스 완료.`);
                        currentShellyOperated = true;
                        overallShellyOperated = true;
                    } catch (shellyError) {
                        console.error(`[${new Date().toISOString()}] Shelly ${cameraConfig.shellyId} 릴레이 제어 중 오류 발생:`, shellyError.message);
                    }
                } else {
                    console.log(`[${new Date().toISOString()}] 현재 시간(${nowInEst.toFormat('HH:mm')})은 Shelly 작동 시간(03:30-19:00)이 아니므로 방문자라도 릴레이를 작동하지 않습니다.`);
                }
            } else if (registeredVisitor) {
                 console.warn(`[${new Date().toISOString()}] [${camera_id}]에 대한 카메라 설정을 찾을 수 없거나 Shelly ID가 없습니다. Shelly를 작동하지 않습니다.`);
            } else {
                console.log(`[${new Date().toISOString()}] [${detectedPlateNumber}] 방문자 차량이 아니므로 Shelly를 작동하지 않습니다.`);
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
            cameraId: String(camera_id),
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
            userEmail: userEmailInfo // Restore userEmail
        };

        const createdDoc = await PlateRecognition.create(documentToCreate);

        const eventTimestamp = new Date(epoch_start);
        const ageInSeconds = (new Date() - eventTimestamp) / 1000;

        if (cameraConfig && cameraConfig.isMonitoring && ageInSeconds <= 15) {
            const cameraNameForBroadcast = cameraConfig.name || `Unknown (${camera_id})`;
            const broadcastData = {
                bestUuid: createdDoc.bestUuid,
                cameraName: cameraNameForBroadcast,
                startTime: createdDoc.startTime,
                bestPlateNumber: createdDoc.bestPlateNumber,
                registrationStatus: createdDoc.registrationStatus,
                userEmail: createdDoc.userEmail, // Restore userEmail
                plateCropJpeg: createdDoc.plateCropJpeg,
                vehicleCropJpeg: createdDoc.vehicleCropJpeg,
            };
            broadcast({ type: 'NEW_PLATE_RECOGNITION', payload: broadcastData });
            console.log(`[${new Date().toISOString()}] [${best_plate_number}] 실시간 이벤트 (수신 지연: ${ageInSeconds.toFixed(1)}초)를 WebSocket으로 전송했습니다.`);
        }

        console.log(`[${new Date().toISOString()}] 데이터베이스에 번호판 정보 저장 완료.`);
        
        res.status(201).json({
            message: 'Plate data successfully processed and saved.',
            shellyOperated: overallShellyOperated,
            data: {
                id: createdDoc._id,
                bestPlateNumber: createdDoc.bestPlateNumber,
                registrationStatus: createdDoc.registrationStatus,
                shellyOperated: createdDoc.shellyOperated,
                userEmail: createdDoc.userEmail, // Restore userEmail
                createdAt: createdDoc.createdAt
            },
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing Plate data:`, error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

exports.getPlateRecognitions = async (req, res) => {
    try {
        const { startDate, endDate, plateNumber, registrationStatus, cameraId, page = 1, limit = 10 } = req.query;

        let query = {};

        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) query.startTime.$gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) {
                const nextDay = new Date(`${endDate}T00:00:00.000Z`);
                nextDay.setDate(nextDay.getDate() + 1);
                query.startTime.$lt = nextDay;
            }
        }

        if (plateNumber) {
            query.bestPlateNumber = new RegExp(plateNumber, 'i');
        }

        if (registrationStatus) {
            const validStatus = ['REGISTERED', 'REGISTERED_VISITOR', 'UNREGISTERED', 'NO_PLATE'];
            const upperCaseStatus = registrationStatus.toUpperCase();
            if (validStatus.includes(upperCaseStatus)) {
                query.registrationStatus = upperCaseStatus;
            } else {
                return res.status(400).json({ message: 'Invalid registration status provided.' });
            }
        }

        if (cameraId) {
            query.cameraId = cameraId;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalItems = await PlateRecognition.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limitNum);
        
        const plates = await PlateRecognition.aggregate([
            { $match: query },
            { $sort: { startTime: -1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
                $lookup: {
                    from: 'cameras', // The collection name for the Camera model
                    localField: 'cameraId',
                    foreignField: 'cameraId',
                    as: 'cameraInfo'
                }
            },
            {
                $addFields: {
                    cameraName: { $ifNull: [{ $arrayElemAt: ['$cameraInfo.name', 0] }, 'N/A'] }
                }
            },
            {
                $project: {
                    cameraInfo: 0 // Exclude the cameraInfo array from the final output
                }
            }
        ]);

        res.status(200).json({
            message: 'Plate recognition data successfully retrieved.',
            totalItems,
            totalPages,
            currentPage: pageNum,
            data: plates,
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error retrieving Plate recognition data:`, error);
        res.status(500).json({ message: 'Error retrieving Plate recognition data', error: error.message });
    }
};

exports.getAvailableCameras = async (req, res) => {
    try {
        const cameras = await Camera.find({}).select('name cameraId shellyId').lean();
        res.status(200).json(cameras);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error retrieving cameras:`, error);
        res.status(500).json({ message: 'Error retrieving camera list', error: error.message });
    }
};

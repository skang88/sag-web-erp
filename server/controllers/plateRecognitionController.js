// controllers/plateRecognitionController.js

const PlateRecognition = require('../models/PlateRecognition');

// 새로운 차량 번호판 인식 데이터 수신 및 저장
exports.createPlateRecognition = async (req, res) => {
    try {
        const {
            data_type,
            epoch_start,
            best_plate_number,
            best_confidence,
            plate_crop_jpeg,
            vehicle_crop_jpeg,
            // Rekor Scout의 바디에서 전송하는 모든 필드를 여기에 구조 분해 할당
            version,
            epoch_end,
            frame_start,
            frame_end,
            company_id,
            agent_uid,
            agent_version,
            agent_type,
            camera_id,
            gps_latitude,
            gps_longitude,
            country,
            strip_identifying_information,
            uuids,
            vehicle_path,
            plate_indexes,
            candidates,
            best_plate,
            best_uuid,
            best_uuid_epoch_ms,
            best_image_width,
            best_image_height,
            travel_direction,
            is_parked,
            is_preview,
            vehicle_signature
        } = req.body;

        // 필수 데이터 유효성 검사
        if (!data_type || !epoch_start || !best_plate_number || best_confidence === undefined) {
            return res.status(400).json({ message: 'Missing required fields for plate recognition data.' });
        }

        // 새로운 PlateRecognition 인스턴스 생성
        const newPlateRecognition = new PlateRecognition({
            dataType: data_type,
            epochStart: epoch_start,
            bestPlateNumber: best_plate_number,
            bestConfidence: best_confidence,
            plateCropJpeg: plate_crop_jpeg,
            vehicleCropJpeg: vehicle_crop_jpeg,
            
            // 나머지 필드도 모델의 스키마에 맞춰 매핑
            version: version,
            epochEnd: epoch_end,
            frameStart: frame_start,
            frameEnd: frame_end,
            companyId: company_id,
            agentUid: agent_uid,
            agentVersion: agent_version,
            agentType: agent_type,
            cameraId: camera_id,
            gpsLatitude: gps_latitude,
            gpsLongitude: gps_longitude,
            country: country,
            stripIdentifyingInformation: strip_identifying_information,
            uuids: uuids,
            vehiclePath: vehicle_path,
            plateIndexes: plate_indexes,
            candidates: candidates,
            bestPlate: best_plate,
            bestUuid: best_uuid,
            bestUuidEpochMs: best_uuid_epoch_ms,
            bestImageWidth: best_image_width,
            bestImageHeight: best_image_height,
            travelDirection: travel_direction,
            isParked: is_parked,
            isPreview: is_preview,
            vehicleSignature: vehicle_signature
        });

        // 데이터베이스에 저장
        const savedRecognition = await newPlateRecognition.save();

        console.log(`[${new Date().toISOString()}] Plate Recognition data saved: ${savedRecognition.bestPlateNumber}`);
        res.status(201).json({ 
            message: 'Plate recognition data successfully received and saved.',
            data: savedRecognition // 저장된 데이터 반환
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error saving plate recognition data:`, error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// (선택 사항) 저장된 번호판 인식 데이터를 조회하는 함수
exports.getAllPlateRecognitions = async (req, res) => {
    try {
        const recognitions = await PlateRecognition.find().sort({ epochStart: -1 }).limit(10); // 최신 10개 조회
        res.status(200).json({ 
            message: 'Successfully fetched plate recognition data.',
            count: recognitions.length,
            data: recognitions
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching plate recognition data:`, error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
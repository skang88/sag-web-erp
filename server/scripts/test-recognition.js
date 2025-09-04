// server/test-recognition.js

// 이 스크립트는 Thunder Client 대신 API 요청을 보내는 테스트용입니다.
// 사용법: 터미널에서 `node server/test-recognition.js` 실행

const fs = require('fs');
const path = require('path');

// --- 설정값 (여기를 수정해서 테스트하세요) ---
const PLATE_NUMBER = "TEST-1238"; // 테스트할 차량 번호
const API_PORT = 8001; // 서버가 실행중인 포트
// ----------------------------------------

async function sendTestRequest() {
    const endpoint = `http://172.16.220.32:8001/api/plate-recognitions`;
    const now = Date.now();

    // 이미지 데이터를 파일에서 읽어옵니다.
    const plateImagePath = path.join(__dirname, 'samplePlateImageData.txt');
    const samplePlateImageData = fs.readFileSync(plateImagePath, 'utf8').trim();

    const vehicleImagePath = path.join(__dirname, 'sampleVehicleImageData.txt');
    const sampleVehicleImageData = fs.readFileSync(vehicleImagePath, 'utf8').trim();


    const body = {
        data_type: "alpr_group",
        epoch_start: now,
        epoch_end: now,
        best_uuid: `test-uuid-${now}`,
        company_id: "test-company",
        agent_uid: "test-agent",
        camera_id: "275477815",
        best_plate_number: PLATE_NUMBER,
        best_confidence: 90.0,
        vehicle_crop_jpeg: sampleVehicleImageData,
        best_plate: {
            plate_crop_jpeg: samplePlateImageData,
        },
        vehicle: {
            color: [{ name: "White", confidence: 90 }],
            make: [{ name: "Hyundai", confidence: 90 }],
            make_model: [{ name: "Sonata", confidence: 90 }],
            body_type: [{ name: "Sedan", confidence: 90 }]
        }
    };

    console.log(`Sending request for plate: ${PLATE_NUMBER}`);
    console.log(`Epoch time being used: ${now}`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const responseData = await response.json();

        console.log('\n--- Response ---');
        console.log(`Status: ${response.status}`);
        console.log('Body:', responseData);
        console.log('----------------\n');

    } catch (error) {
        console.error('\n--- Error ---');
        console.error('Failed to send request:', error.message);
        console.log('----------------\n');
    }
}

sendTestRequest();

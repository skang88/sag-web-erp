// controllers/itemController.js
const Item = require('../models/itemModel'); // Item 모델 임포트

// 특정 item_id로 아이템 스펙을 조회하는 컨트롤러 함수
exports.getItemById = async (req, res) => {
    try {
        const itemId = req.params.item_id; // URL 파라미터에서 item_id 가져오기

        // Mongoose findById를 사용하여 MongoDB에서 아이템 조회
        // .lean()을 사용하여 Mongoose 문서 객체 대신 일반 JavaScript 객체를 반환하여 성능 최적화
        const item = await Item.findById(itemId).lean();

        if (item) {
            // 아이템을 찾았다면 JSON 형태로 반환
            res.json(item);
        } else {
            // 아이템을 찾지 못했다면 404 Not Found 응답
            res.status(404).json({ error: 'Item not found.' });
        }
    } catch (error) {
        // 데이터베이스 조회 중 오류 발생 시 500 Internal Server Error 응답
        console.error('Error fetching item by ID:', error);
        res.status(500).json({ error: 'Failed to fetch item data.' });
    }
};

// 모든 아이템 스펙을 조회하는 컨트롤러 함수 (선택 사항)
exports.getAllItems = async (req, res) => {
    try {
        const items = await Item.find({}).lean(); // 모든 아이템 조회
        res.json(items);
    } catch (error) {
        console.error('Error fetching all items:', error);
        res.status(500).json({ error: 'Failed to fetch all item data.' });
    }
};
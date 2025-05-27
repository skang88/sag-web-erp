// seed.js
const path = require('path');
// .env 파일이 seed.js가 있는 곳의 상위 폴더에 있다면 아래처럼 path를 지정합니다.
// 만약 seed.js가 프로젝트 루트에 있다면, 그냥 require('dotenv').config(); 만 해도 됩니다.
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

const mongoose = require('mongoose');
const Item = require('../models/itemModel.js'); // Item 모델 불러오기

// 초기 제품 데이터 불러오기
const initialItemData = require('./initialItemData.js');

console.log((initialItemData.length), "개 데이터 입력 중...");

const seedProducts = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB에 성공적으로 연결되었습니다.');

    // 1. 기존 제품 데이터 삭제 (선택 사항: 중복 방지 및 초기화)
    // 개발 단계에서는 유용하지만, 운영 환경에서는 매우 주의해야 합니다.
    console.log('기존 제품 데이터 삭제 중...');
    await Item.deleteMany({});
    console.log('기존 제품 데이터 삭제 완료.');

    // 2. 초기 제품 데이터 삽입
    const items = await Item.insertMany(initialItemData);
    console.log(`${items.length}개의 제품이 성공적으로 삽입되었습니다.`);

    console.log('제품 데이터 시딩이 완료되었습니다!');
  } catch (err) {
    console.error('데이터 시딩 중 오류 발생:', err);
  } finally {
    // 작업 완료 후 MongoDB 연결 종료
    mongoose.connection.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
};

// 스크립트 실행
seedProducts();
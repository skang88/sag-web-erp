// controllers/userController.js
const User = require('../models/userModel');
const bcrypt = require('bcryptjs'); // 비밀번호 변경 시 사용

// --- 내 프로필 정보 조회 (GET /api/users/profile) ---
exports.getUserProfile = async (req, res) => {
  try {
    // req.user는 authMiddleware에서 추가된 인증된 사용자 정보입니다.
    const user = await User.findById(req.user._id).select('-password -passwordResetToken -passwordResetExpires'); // 민감 정보 제외
    
    if (user) {
      res.status(200).json({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        licensePlates: user.licensePlates,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get User Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 내 프로필 정보 업데이트 (PUT /api/users/profile) ---
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // 인증된 사용자 객체 가져오기

    if (user) {
      // 요청 본문에서 업데이트할 필드 가져오기
      const { name, phone, password, licensePlates } = req.body;

      // 이름, 전화번호 업데이트 (제공된 경우에만)
      user.name = name !== undefined ? name : user.name;
      user.phone = phone !== undefined ? phone : user.phone;

      // 비밀번호 업데이트 (제공된 경우에만, 해싱 필요)
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      // 자동차 번호판 업데이트
      // 기존 번호판을 완전히 대체하거나, 추가/제거 로직을 구현할 수 있습니다.
      // 여기서는 `licensePlates` 배열을 통째로 교체하는 방식으로 구현합니다.
      // 실제 애플리케이션에서는 기존 번호판과 중복 검사, 유효성 검사 등 추가 로직이 필요할 수 있습니다.
      if (Array.isArray(licensePlates)) {
          // 중복 제거 및 형식 검증 (예시: trim, uppercase)
          const uniquePlates = Array.from(new Set(
              licensePlates.map(plate => (typeof plate === 'string' ? plate.trim().toUpperCase() : null))
              .filter(plate => plate && plate.length > 0) // 유효한 번호판만 필터링
          ));
          user.licensePlates = uniquePlates;
      }

      await user.save(); // 변경사항 저장

      res.status(200).json({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        licensePlates: user.licensePlates,
        message: 'Profile updated successfully!'
      });

    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update User Profile Error:', error);
    // MongoDB duplicate key error (번호판 unique 위반 등) 처리
    if (error.code === 11000) {
        return res.status(400).json({ message: 'One or more license plates are already registered.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
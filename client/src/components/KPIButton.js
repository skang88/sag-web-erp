import React from 'react';

const KPIButton = () => {
  const openPopup = () => {
    const popupWidth = window.screen.width; // 팝업 창 너비
    const popupHeight = window.screen.height; // 팝업 창 높이
    const left = window.screenX + (window.outerWidth - popupWidth) / 2; // 화면 중앙에 위치
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;

    window.open(
      `${process.env.REACT_APP_SHINY_URL}`, // 외부 앱 URL
      'KPI Dashboard', // 팝업 창 이름
      `width=${popupWidth},height=${popupHeight},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <button
      onClick={openPopup}
      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
    >
      KPI
    </button>
  );
};

export default KPIButton;

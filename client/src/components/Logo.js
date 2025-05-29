const Logo = () => {
  // 현재는 텍스트 로고를 사용하고 계시므로, 텍스트 스타일을 적용합니다.
  return (
    // 기존 CSS: text-decoration: none; (from Link)
    // Tailwind: no-underline (Link 컴포넌트에 이미 적용되어 있으므로 여기서 중복으로 적용할 필요는 없지만,
    // 혹시 몰라 Link 외부에서 Logo 컴포넌트만 단독으로 사용될 경우를 대비해 여기에 flex와 텍스트 스타일을 추가합니다.)
    <div className='text-white text-2xl font-extrabold p-2'> {/* 기존 로고 텍스트 스타일 */}
      SAG
    </div>
  );
  
  // 만약 나중에 이미지 로고를 사용하실 경우, 아래와 같이 Tailwind 클래스를 적용할 수 있습니다.
  /*
  return (
    <img 
      src="/logo.png" 
      alt="Company Logo" 
      // 기존 CSS: .logo (가로, 세로, 마진 등)
      // Tailwind: w-auto h-10 (예시: 높이 40px)
      className="h-10 w-auto" 
    />
  );
  */
};

export default Logo;
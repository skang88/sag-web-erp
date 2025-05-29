const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6"> {/* Navbar 높이(64px) 고려하여 화면 중앙 정렬 */}
      <h2 className="text-4xl font-extrabold text-blue-800 text-center leading-tight"> {/* 제목 스타일 */}
        Welcome to Seohan Auto Georgia
      </h2>
      <p className="mt-4 text-xl text-gray-600 text-center">
        Your go-to portal for internal systems.
      </p>
    </div>
  );
};

export default Home;
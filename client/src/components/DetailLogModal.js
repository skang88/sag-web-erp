import React from 'react';

const DetailLogModal = ({ user, logs, loading, onClose }) => {
  if (!user) return null;

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.length !== 6) return timeStr;
    return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}:${timeStr.substring(4, 6)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Detail Logs for {user.C_Name}</h3>
          <button onClick={onClose} className="text-black font-bold text-2xl">&times;</button>
        </div>
        {loading ? (
          <p>Loading logs...</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="p-2 border">{formatDate(user.C_Date)}</td>
                    <td className="p-2 border">{formatTime(log.C_Time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailLogModal;

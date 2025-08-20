import React, { useEffect, useRef } from 'react';
import JSMpeg from '@cycjimmy/jsmpeg-player';

const JsmpegPlayer = ({ websocketUrl }) => {
  const playerRef = useRef(null);

  useEffect(() => {
    let player = null;
    try {
      player = new JSMpeg.VideoElement(
        playerRef.current,
        websocketUrl,
        { autoplay: true, protocols: [] }
      );
    } catch (e) {
      console.error('JSMpeg Player: Error creating player:', e);
    }

    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (e) {
          console.error('JSMpeg Player: Error destroying player:', e);
        }
      }
    };
  }, [websocketUrl]);

  return <div ref={playerRef} style={{ width: '100%', height: '100%' }} />;
};

export default JsmpegPlayer;
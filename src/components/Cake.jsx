import React, { useEffect, useState, useRef } from 'react';
import "../assets/css/cake.css";
import { CakeSVG, confetti } from '../assets';
import { motion } from "framer-motion";
import { Link } from 'react-router-dom'; 
import bgMusic from "../assets/audio/happy-birthday.mp3"; // Import your audio file

function Cake() {
  const [candlesBlownOut, setCandlesBlownOut] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const audioRef = useRef(null);
  const micRef = useRef(null);

  useEffect(() => {
    let audioContext;
    let analyser;
    let dataArray;
    let blowStartTime = null;
    let bandPassFilter;

    async function initBlowDetection() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.AudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        // 🎵 Band-Pass Filter to Isolate Blowing Sound (300Hz - 800Hz)
        bandPassFilter = audioContext.createBiquadFilter();
        bandPassFilter.type = "bandpass";
        bandPassFilter.frequency.value = 500;
        bandPassFilter.Q.value = 1.5;
        source.connect(bandPassFilter);
        bandPassFilter.connect(analyser);

        analyser.fftSize = 1024;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        micRef.current = true;

        // 🎚️ Lower Music Volume While Mic is Active
        if (audioRef.current) {
          audioRef.current.volume = 0.1;
        }

        detectBlow();
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    }

    function detectBlow() {
      if (!analyser || !dataArray) return;
      analyser.getByteFrequencyData(dataArray);

      // 🎤 Focus on 300Hz - 800Hz Range (Eliminating Music)
      const blowFrequencyValues = dataArray.slice(10, 40); 
      const rms = Math.sqrt(blowFrequencyValues.reduce((sum, value) => sum + value ** 2, 0) / blowFrequencyValues.length);
      
      const blowThreshold = 50;
      const requiredDuration = 1000;

      if (rms > blowThreshold) {
        if (!blowStartTime) {
          blowStartTime = performance.now();
        } else if (performance.now() - blowStartTime > requiredDuration) {
          setCandlesBlownOut(true);

          // 🎚️ Restore Music Volume After Detection
          if (audioRef.current) {
            audioRef.current.volume = 1.0;
          }
        }
      } else {
        blowStartTime = null;
      }

      if (!candlesBlownOut) {
        requestAnimationFrame(detectBlow);
      }
    }

    function handleMusicEnd() {
      if (!micActive) {
        setMicActive(true);
        initBlowDetection();
      }
    }

    if (audioRef.current) {
      audioRef.current.onended = handleMusicEnd; // 🎵 Start Mic After First Loop Ends
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      micRef.current = false;
    };
  }, [candlesBlownOut]);

  return (
    <>
      {/* Background Music */}
      <audio ref={audioRef} src={bgMusic} autoPlay onEnded={() => handleMusicEnd()} />

      <div className="bg-black/80 h-screen w-screen flex items-center justify-center overflow-hidden relative">
        {candlesBlownOut && (
          <div
            className="absolute inset-0 bg-cover bg-center z-50"
            style={{ backgroundImage: `url(${confetti})` }}
          />
        )}
        
        {candlesBlownOut && (
          <motion.div
            className="absolute top-20 text-white text-3xl font-bold z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <svg width="800" height="200" viewBox="0 0 400 200">
              <defs>
                <path id="curve" d="M50,150 Q200,50 350,150" fill="transparent" stroke="white" />
              </defs>
              <text fontSize="40" fill="white" textAnchor="middle">
                <textPath href="#curve" startOffset="50%">Happy Birthday!</textPath>
              </text>
            </svg>
          </motion.div>
        )}

        <div className="relative z-10">
          <div className="absolute -top-48 left-1/2 transform -translate-x-1/2">
            <div className="candle">
              {!candlesBlownOut && (
                <>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                </>
              )}
            </div>
          </div>
          <CakeSVG />
        </div>
      </div>
    </>
  );
}

export default Cake;

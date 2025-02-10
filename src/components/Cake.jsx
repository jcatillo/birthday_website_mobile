import React, { useEffect, useState } from 'react';
import "../assets/css/cake.css";
import { CakeSVG, confetti } from '../assets';
import { motion } from "framer-motion";
import { Link } from 'react-router-dom'; 
import bgMusic from "../assets/audio/happy-birthday.mp3"; // Import your audio file

function Cake() {
  const [candlesBlownOut, setCandlesBlownOut] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);

  useEffect(() => {
    let audioContext;
    let analyser;
    let dataArray;
    let blowStartTime = null;
  
    async function initBlowDetection() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.AudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
  
        analyser.fftSize = 1024; // Higher for better accuracy
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        source.connect(analyser);
  
        detectBlow(); 
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    }
  
    function detectBlow() {
      if (!analyser || !dataArray) return;
      analyser.getByteFrequencyData(dataArray);
  
      // Use a wider frequency range
      const lowFrequencyValues = dataArray.slice(0, 50); // Capture more data
      const rms = Math.sqrt(lowFrequencyValues.reduce((sum, value) => sum + value ** 2, 0) / lowFrequencyValues.length);
  
      const blowThreshold = 50; // Lower threshold
      const requiredDuration = 1000; // 1 sec blow required
  
      if (rms > blowThreshold) {
        if (!blowStartTime) {
          blowStartTime = performance.now();
        } else if (performance.now() - blowStartTime > requiredDuration) {
          setCandlesBlownOut(true);
        }
      } else {
        blowStartTime = null;
      }
  
      requestAnimationFrame(detectBlow); 
    }
  
    setTimeout(() => {
      initBlowDetection();
      setMicPermissionGranted(true);
    }, 3000); // Shorter delay
  
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  return (
    <>
      {/* Background Music */}
      <audio src={bgMusic} autoPlay loop />

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

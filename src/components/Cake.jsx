import React, { useEffect, useState, useRef } from 'react';
import "../assets/css/cake.css";
import { CakeSVG, confetti } from '../assets';
import { motion } from "framer-motion";
import { Link } from 'react-router-dom'; 
import bgMusic from "../assets/audio/happy-birthday.mp3"; // Import your audio file

function Cake() {
  const [candlesBlownOut, setCandlesBlownOut] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const audioRef = useRef(null); // Ref for background music control

  useEffect(() => {
    let audioContext;
    let analyser;
    let dataArray;
    let blowStartTime = null;
    let highPassFilter;
  
    async function initBlowDetection() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.AudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
  
        // 🎵 Apply a High-Pass Filter to Remove Music Interference
        highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = "highpass";
        highPassFilter.frequency.value = 300; // Ignore anything below 300Hz (mostly music)
        source.connect(highPassFilter);
        highPassFilter.connect(analyser);
  
        analyser.fftSize = 1024;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // 🎚️ Lower Music Volume When Listening for Blow
        if (audioRef.current) {
          audioRef.current.volume = 0.2; // Reduce volume temporarily
        }
  
        detectBlow();
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    }
  
    function detectBlow() {
      if (!analyser || !dataArray) return;
      analyser.getByteFrequencyData(dataArray);
  
      // 🎤 Use a Higher Frequency Range to Ignore Music
      const lowFrequencyValues = dataArray.slice(0, 20); 
      const rms = Math.sqrt(lowFrequencyValues.reduce((sum, value) => sum + value ** 2, 0) / lowFrequencyValues.length);
  
      const blowThreshold = 60; // More sensitive than before
      const requiredDuration = 1000; 
  
      // 🎯 Detect Sudden Volume Increase (Blowing)
      if (rms > blowThreshold) {
        if (!blowStartTime) {
          blowStartTime = performance.now();
        } else if (performance.now() - blowStartTime > requiredDuration) {
          setCandlesBlownOut(true);

          // 🎚️ Restore Music Volume After Detection
          if (audioRef.current) {
            audioRef.current.volume = 1.0; // Reset volume
          }
        }
      } else {
        blowStartTime = null;
      }
  
      requestAnimationFrame(detectBlow);
    }
  
    setTimeout(() => {
      initBlowDetection();
      setMicPermissionGranted(true);
    }, 3000);
  
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);
  

  return (
    <>
      {/* Background Music */}
      <audio ref={audioRef} src={bgMusic} autoPlay loop />

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

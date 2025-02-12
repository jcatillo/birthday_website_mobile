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
  const micRef = useRef(null); // Keep track of microphone status

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

        // 🎵 Band-Pass Filter (Focus on Blowing Sound Range: 300Hz - 800Hz)
        bandPassFilter = audioContext.createBiquadFilter();
        bandPassFilter.type = "bandpass";
        bandPassFilter.frequency.value = 500; // Center frequency
        bandPassFilter.Q.value = 1.5; // Bandwidth tightness
        source.connect(bandPassFilter);
        bandPassFilter.connect(analyser);

        analyser.fftSize = 1024;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        micRef.current = true;

        // 🎚️ Lower Music Volume Only While Listening
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

      // 🎤 Focus on 300Hz - 800Hz Range (Eliminating Background Music Interference)
      const blowFrequencyValues = dataArray.slice(10, 40); 
      const rms = Math.sqrt(blowFrequencyValues.reduce((sum, value) => sum + value ** 2, 0) / blowFrequencyValues.length);
      
      const blowThreshold = 50; // Adjusted to be more precise
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

    // 🎤 Delay Mic Activation Until the First Loop Ends
    setTimeout(() => {
      if (!candlesBlownOut) {
        initBlowDetection();
        setMicPermissionGranted(true);
      }
    }, 5000); // Delay mic activation

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

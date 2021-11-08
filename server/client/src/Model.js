import React, { useRef } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as handpose from '@tensorflow-models/handpose'
import Webcam from 'react-webcam'
import './Model.css'

function Model(props) {
	const webcamRef = useRef(null);
	const canvasRef = useRef(null);
	const fingerJoints = {
		thumb: [0, 1, 2, 3, 4],
		indexFinger: [0, 5, 6, 7, 8],
		middleFinger: [0, 9, 10, 11, 12],
		ringFinger: [0, 13, 14, 15, 16],
		pinky: [0, 17, 18, 19, 20],
	};
	
	const drawHand = (predictions, ctx) => {
		if (predictions.length > 0) {
			predictions.forEach((prediction) => {
				const landmarks = prediction.landmarks;
	
				for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
					let finger = Object.keys(fingerJoints)[j];

					for (let k = 0; k < fingerJoints[finger].length - 1; k++) {
						const firstJointIndex = fingerJoints[finger][k];
						const secondJointIndex = fingerJoints[finger][k + 1];
	
						ctx.beginPath();
						ctx.moveTo(
							landmarks[firstJointIndex][0],
							landmarks[firstJointIndex][1]
						);
						ctx.lineTo(
							landmarks[secondJointIndex][0],
							landmarks[secondJointIndex][1]
						);
						ctx.strokeStyle = "plum";
						ctx.lineWidth = 4;
						ctx.stroke();
					}
				}
	
				for (let i = 0; i < landmarks.length; i++) {
					const x = landmarks[i][0];
					const y = landmarks[i][1];
					ctx.beginPath();
					ctx.arc(x, y, 5, 0, 3 * Math.PI);
	
					ctx.fillStyle = "indigo";
					ctx.fill();
				}
			});
		}
	};

	const runHandpose = async () => {
		const net = await handpose.load();

		setInterval(() => {
			detect(net);
		}, 100)
	}

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const hand = await net.estimateHands(video);
			const ctx = canvasRef.current.getContext("2d");
			drawHand(hand, ctx);
    }
  };

  runHandpose();

	return (
		<div className="model">
      <canvas
        ref={canvasRef}
        style={{
					width: "300px",
					height: "300px",
        }}
      >
				<Webcam
    	    ref={webcamRef}
    	    style={{
						width: "300px",
						height: "300px",
    	    }}
      	/>
			</canvas>
		</div>
	)
}

export default Model
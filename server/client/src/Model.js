import React, { useState, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as fp from 'fingerpose'
import * as blazeface from '@tensorflow-models/blazeface'
import Webcam from 'react-webcam'
import './Model.css'

function Model(props) {
	const webcamRef = useRef(null);

	const runHandpose = async () => {
		const net = await blazeface.load();

		setInterval(() => {
			detect(net);
		}, 1000)
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

      const faces = await net.estimateFaces(video);
			console.log(faces.length);
			props.setFaces(faces.length);
    }
  };

  runHandpose();

	return (
		<div className="model">
			<Webcam
  	    ref={webcamRef}
  	    style={{
					width: "0px",
					height: "0px",
  	    }}
     	/>
		</div>
	)
}

export default Model
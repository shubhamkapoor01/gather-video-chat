import React, { useState, useEffect, useRef } from 'react'
import './RoomSetup.css'

function RoomSetup(props) {
	const videoStream = useRef(null);

	useEffect(() => {
		const getUserMedia = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
				videoStream.current.srcObject = stream;
			} catch (err) {
				console.log(err)
			}
		}

		getUserMedia();
	}, []);

	const muteUnmute = (e) => {
		const enabled = videoStream.current.srcObject.getAudioTracks()[0].enabled;
		if (enabled) {
			videoStream.current.srcObject.getAudioTracks()[0].enabled = false;	
		} else {
			videoStream.current.srcObject.getAudioTracks()[0].enabled = true;
		}
	}

	const cameraOnOff = (e) => {
		const enabled = videoStream.current.srcObject.getVideoTracks()[0].enabled;
		if (enabled) {
			videoStream.current.srcObject.getVideoTracks()[0].enabled = false;
		} else {
			videoStream.current.srcObject.getVideoTracks()[0].enabled = true;
		}
	}

	return (
		<div className="roomsetup">
			<button onClick={ (e) => props.setJoinedRoom(true) } > 
				Join
			</button>
			<button onClick={ (e) => props.setMic(false) }>
				mute mic
			</button>
			<button onClick={ (e) => props.setCam(false) }>
				turn off cam
			</button>
			<input placeholder="enter display name" onChange={ (e) => props.setName(e.target.value) }/>
			<video muted ref={ videoStream } autoPlay />
		</div>
	)
}

export default RoomSetup

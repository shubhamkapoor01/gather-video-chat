import React, { useState, useEffect, useRef } from 'react'
import './RoomSetup.css'

function RoomSetup(props) {
	const [mic, setMic] = useState(true);
	const [cam, setCam] = useState(true);
	const [name, setName] = useState("");
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
		if (mic) {
			setMic(false);
			props.setMic(false);
		} else {
			setMic(true);
			props.setMic(true);
		}
		const enabled = videoStream.current.srcObject.getAudioTracks()[0].enabled;
		if (enabled) {
			videoStream.current.srcObject.getAudioTracks()[0].enabled = false;	
		} else {
			videoStream.current.srcObject.getAudioTracks()[0].enabled = true;
		}
	}

	const cameraOnOff = (e) => {
		if (cam) {
			setCam(false);
			props.setCam(false);
		} else {
			setCam(true);
			props.setCam(true);
		}
		const enabled = videoStream.current.srcObject.getVideoTracks()[0].enabled;
		if (enabled) {
			videoStream.current.srcObject.getVideoTracks()[0].enabled = false;
		} else {
			videoStream.current.srcObject.getVideoTracks()[0].enabled = true;
		}
	}
	
	const updateName = (newName) => {
		setName(newName);
		props.setName(newName);
	}

	const joinRoom = (e) => {
		if (name === "") {
			alert("please enter a valid name");
			return;
		}
		props.setJoinedRoom(true);
	}

	return (
		<div className="roomsetup">
			<button onClick={ (e) => joinRoom(e) } > 
				Join
			</button>
			<button onClick={ (e) => muteUnmute(e) }>
				mute mic
			</button>
			<button onClick={ (e) => cameraOnOff(e) }>
				turn off cam
			</button>
			<input placeholder="enter display name" onChange={ (e) => updateName(e.target.value) }/>
			<video muted ref={ videoStream } autoPlay />
		</div>
	)
}

export default RoomSetup
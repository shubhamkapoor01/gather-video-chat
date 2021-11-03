import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import "./Room.css";
import Sketch from "react-p5";
import styled from "styled-components";
import Chat from "./Chat";

const muteBtn = document.querySelector(".mute");
const cameraBtn = document.querySelector(".camera");
const screenBtn = document.querySelector(".screenshare");
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/js/all.min.js"
  integrity="sha512-cyAbuGborsD25bhT/uz++wPqrh5cqPh1ULJz4NSpN9ktWcA6Hnh9g+CWKeNx2R0fgQt+ybRXdabSBgYXkQTTmA=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
></script>;
import RoomSetup from './RoomSetup';

const socket = io.connect("http://localhost:3001");

const StyledVideo = styled.video`
  height: 300px;
  width: 300px;
`;

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    ref.current.srcObject = props.peer;
  }, []);

  return <StyledVideo playsInline autoPlay ref={ref} />;
};

function Room(props) {
		const [name, setName] = useState("");
		const [mic, setMic] = useState(true);
		const [cam, setCam] = useState(true);
		const [joinedRoom, setJoinedRoom] = useState(false);
		const [users, setUsers] = useState([]);
		const [peers, setPeers] = useState([]);
		const [connected, setConnected] = useState({});
		const myVideo = useRef(null);
		const myPeer = useRef(null);
		var currentPeer = [];
    const roomID = props.match.params.roomID;

		useEffect(() => {
			socket.emit("join room", roomID);

			const getUserMedia = async () => {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
					myVideo.current.srcObject = stream;
					if (!cam) {
						cameraOnOff();
					}
					if (!mic) {
						muteUnmute();
					}
				} catch (err) {
					console.log(err)
				}
			}

			getUserMedia();

			const peer = new Peer(socket.id);
			
			peer.on('call', call => {
				call.answer(myVideo.current.srcObject);
				currentPeer.push(call.peerConnection)
				call.on('stream', peerStream => {
					let temp = peers;
					temp.push(peerStream);
					setPeers(temp);
				})
			})
			myPeer.current = peer;
		}, [myVideo.current]);

	useEffect(() => {
		socket.on('receive move', (data) => {
			setUsers(data.all);
			for (let i = 0; i < data.all.length; i ++) {
				if (data.all[i].id === data.me.id) {
					continue;
				}

				let closer = proximity(data.all[i], data.me)

				if (closer && connected[data.all[i].id] === undefined) {
					connectPeer(data.all[i], data.me);

				} else if (!closer && connected[data.all[i].id] !== undefined) {
					disconnectPeer(data.all[i], data.me);
				}
			}
		})
	}, [socket]);

	let setup = (p5, canvas) => {
		let canv = p5.createCanvas(800, 600).parent(canvas);
		let tempUsers = [];
		tempUsers.push({
			id: socket.id,
			room: roomID,
			x: 400,
			y: 100
		});
		
		setUsers(tempUsers);
	}

	let draw = (p5) => {
		p5.background("rgb(255, 255, 255)");

		let idx = users.findIndex((user) => user.id === socket.id)
		if (idx !== -1) {
			let tempUsers = users;

			if (p5.keyIsDown(87) || p5.keyIsDown(38)) {
				tempUsers[idx].y = tempUsers[idx].y - 2;
			}
			if (p5.keyIsDown(65) || p5.keyIsDown(37)) {
				tempUsers[idx].x = tempUsers[idx].x - 2;
			}
			if (p5.keyIsDown(83) || p5.keyIsDown(40)) {
				tempUsers[idx].y = tempUsers[idx].y + 2;
			}
			if (p5.keyIsDown(68) || p5.keyIsDown(39)) {
				tempUsers[idx].x = tempUsers[idx].x + 2;
			}	
			
			let data = {
				id: socket.id,
				room: roomID,
				x: tempUsers[idx].x,
				y: tempUsers[idx].y	
			}

			setUsers(tempUsers);
			socket.emit('send move', data);
		}

		for (let i = 0; i < users.length; i ++) {
			p5.circle(users[i].x, users[i].y, 16);
		}
	}

	const muteUnmute = (e) => {
		const enabled = myVideo.current.srcObject.getAudioTracks()[0].enabled;
		if (enabled) {
			myVideo.current.srcObject.getAudioTracks()[0].enabled = false;	
		} else {
			myVideo.current.srcObject.getAudioTracks()[0].enabled = true;
		}
	}

	const cameraOnOff = (e) => {
		const enabled = myVideo.current.srcObject.getVideoTracks()[0].enabled;
		if (enabled) {
			myVideo.current.srcObject.getVideoTracks()[0].enabled = false;
		} else {
			myVideo.current.srcObject.getVideoTracks()[0].enabled = true;
		}
	}
	
	const screenShare = (e) => {
		navigator.mediaDevices.getDisplayMedia({
			video: { cursor: "always" },
			audio: {
				echoCancellation: true,
				echoSupression: true,
			}
		}).then(stream => {
			let videoTrack = stream.getVideoTracks()[0];
			videoTrack.onended = () => { stopScreenShare() }
			for (let i = 0; i < currentPeer.length; i ++) {
				let sender = currentPeer[i].getSenders().find(s => {
					return s.track.kind === videoTrack.kind;
				})
				sender.replaceTrack(videoTrack);
			}
		})
		setPeers(peers);
	}

	const stopScreenShare = () => {
		let videoTrack = myVideo.current.srcObject.getVideoTracks()[0];
		for (let x = 0; x < currentPeer.length; x++) {
			let sender = currentPeer[x].getSenders().find(function (s) {
				return s.track.kind === videoTrack.kind;
			});
			sender.replaceTrack(videoTrack);
		}
		setPeers(peers);
	}

	const proximity = (user, me) => {
		if ((user.x - me.x) * (user.x - me.x) + (user.y - me.y) * (user.y - me.y) <= 10000) {
			if (user.x >= me.x) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}	

	const connectPeer = (user, me) => {
		const call = myPeer.current.call(user.id, myVideo.current.srcObject)

		call.on('stream', peerStream => {
			let temp = peers;
			temp.push(peerStream);
			setPeers(temp);
		})
		
		let temp = connected;
		temp[user.id] = true;
		setConnected(temp);
		return;
	}

	const disconnectPeer = (user) => {
		

		let temp = connected;
		delete temp[user.id]
		setConnected(temp);
		return;
	}

  return (
		<div>
			{ joinedRoom ? (
				<div className="room">
					<div className="video-canvas">
						<div className="videobox">
							<div className="buttonbox">
								<button type="button" className="mute" onClick={ (e) => muteUnmute(e) }> Mute </button>
								<button type="button" className="camera" onClick={ (e) => cameraOnOff(e) }> Camera </button>
								<button type="button" className="screenshare" onClick={ (e) => screenShare(e) }> ScreenShare </button>
							</div>
							<StyledVideo muted ref={ myVideo } autoPlay playsInLine />
							<div className="videos">
								{ peers.map((peer, idx) => {
									return(
										<Video peer={ peer } />
									)
								})}
							</div>
						</div>
						<Sketch setup={ setup } draw={ draw } className="canvas" />
					</div>
					<Chat className="chat" socket={ socket } room={ roomID } name={ name } />
				</div>
				) : (
					<RoomSetup 
						setJoinedRoom={ () => setJoinedRoom(true) } 
						setMic={ preference => setMic(preference) } 
						setCam={ preference => setCam(preference) } 
						setName={ name => setName(name) }
					/>
				)
			}
		</div>
  );
}

export default Room;

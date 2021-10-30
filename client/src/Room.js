import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
// import Peer from "peerjs";
import Peer from 'simple-peer';
import "./Room.css";
import Sketch from 'react-p5';
import styled from "styled-components";
import Chat from "./Chat";

const socket = io.connect("http://localhost:3001");

const StyledVideo = styled.video`
	height: 300px;
	width: 300px;
`;

const Video = (props) => {
	const ref = useRef();

	useEffect(() => {
			props.peer.on("stream", stream => {
					ref.current.srcObject = stream;
			})
	}, []);

	return (
			<StyledVideo playsInline autoPlay ref={ ref } />
	);
}

function Room(props) {
		const [users, setUsers] = useState([]);
		const [peers, setPeers] = useState([]);
		const [stream, setStream] = useState();
		const [connected, setConnected] = useState({});
		const myVideo = useRef();
		const partnerVideo = useRef();
		const peersRef = useRef([]);
    const roomID = props.match.params.roomID;

		useEffect(() => {
			socket.emit("join room", roomID);
			const getUserMedia = async () => {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
					myVideo.current.srcObject = stream;
					setStream(stream);
				} catch (err) {
					console.log(err)
				}
			}
			getUserMedia();

			socket.on('hey', data => {
				const peer = new Peer({
					initiator: false,
					trickle: false,
					stream: myVideo.current.srcObject,
				})

				let caller = data.from
				peer.on('signal', data => {
					socket.emit('accept call', { signal: data, to: caller })
				})

				peer.on('stream', stream => {
					if (peersRef.current) {
						peersRef.current.push({
							peer
						})
						peersRef.current[peersRef.current.length - 1].srcObject = stream;
					}
					let temp = peers;
					temp.push(peer);
					temp[temp.length - 1].srcObject = stream;
					setPeers(temp);
				})

				peer.signal(data.signal)
			})
		}, []);

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

	}

	const cameraOnOff = (e) => {

	}

	const screenShare = (e) => {

	}

	const proximity = (user, me) => {
		if ((user.x - me.x) * (user.x - me.x) + (user.y - me.y) * (user.y - me.y) <= 10000) {
			return true;
		} else {
			return false;
		}
	}	

	const connectPeer = (user, me) => {
		console.log("connecting");

		const peer = new Peer({
			initiator: true,
			trickle: false,
			config: {
				'iceServers': [
					{ 
						url: 'stun:stun1.l.google.com:19302' 
					},
					{
						url: 'turn:numb.viagenie.ca',
						credential: 'muazkh',
						username: 'webrtc@live.com'
					}
				]
    	},
			stream: myVideo.current.srcObject,
		})

		peer.on('signal', data => {
			socket.emit('call user', { userToCall: user.id, signalData: data, from: me.id });
		})
		
		peer.on('stream', stream => {
			if (peersRef.current) {
				peersRef.current.push({
					peer
				})
				peersRef.current[peersRef.current.length - 1].srcObject = stream;
			}
			let temp = peers;
			temp.push(peer);
			temp[temp.length - 1].srcObject = stream;
			setPeers(temp);
		})

		socket.on('call accepted', signal => {
			peer.signal(signal);
		})

		let temp = connected;
		temp[user.id] = true;
		setConnected(temp);
		return;
	}

	const disconnectPeer = (user) => {
		console.log("disconnecting")

		let temp = connected;
		delete temp[user.id]
		setConnected(temp);
		return;
	}

  return (
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
						{ peers.map(peer => {
							return(
								<div>
									<Video peer={ peer } />
								</div>
							)
						})}
					</div>
				</div>
				<Sketch setup={ setup } draw={ draw } className="canvas" />
			</div>
			<Chat className="chat" socket={ socket } room={ roomID } />
		</div>
  );
};

export default Room;
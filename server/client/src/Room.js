import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import "./Room.css";
import Sketch from 'react-p5';
import styled from "styled-components";
import Chat from './Chat';
import RoomSetup from './RoomSetup';

const socket = io.connect("https://gather-town.herokuapp.com")

const StyledVideo = styled.video`
    height: 300px;
    width: 300px;
`;

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
		console.log(props.peer);
		ref.current.srcObject = props.peer.streams[0];
  }, []);

  return (
  	<StyledVideo playsInline autoPlay ref={ ref } />
  );
}

function Room(props) {
const [name, setName] = useState("");
const [mic, setMic] = useState(true);
const [cam, setCam] = useState(true);
const [joinedRoom, setJoinedRoom] = useState(false);

const [nearby, setNearby] = useState([]);
const [users, setUsers] = useState([]);
const userVideo = useRef();
const peersRef = useRef([]);
const trackPeers = useRef([]);
const roomID = props.match.params.roomID;

useEffect(() => {
	navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
		userVideo.current.srcObject = stream;
		socket.emit("join room", roomID);
		socket.on("all users", users => {
			users.forEach(userID => {
				const peer = createPeer(userID, socket.id, stream);
				peersRef.current.push({
					peerID: userID,
					peer,
				})
			})
		})

		socket.on("user joined", payload => {
			const peer = addPeer(payload.signal, payload.callerID, stream);
			peersRef.current.push({
				peerID: payload.callerID,
				peer,
			})
		});

		socket.on("receiving returned signal", payload => {
			const item = peersRef.current.find(p => p.peerID === payload.id);
			item.peer.signal(payload.signal);
		});

		socket.on("user left", id => {
			const peerObj = peersRef.current.find(p => p.peerID === id);
			if (peerObj) {
				peerObj.peer.destroy();
			}
			const peers = peersRef.current.filter(p => p.peerID !== id);
			const tempNearby = nearby.filter(p => p.peerID !== id);
			peersRef.current = peers;
			setNearby(tempNearby);
		})
	})
}, []);

const createPeer = (userToSignal, callerID, stream) => {
	const peer = new Peer({
		initiator: true,
		trickle: false,
		stream,
	});

	peer.on("signal", signal => {
		socket.emit("sending signal", { userToSignal, callerID, signal })
	})

	return peer;
}

const addPeer = (incomingSignal, callerID, stream) => {
	const peer = new Peer({
		initiator: false,
		trickle: false,
		stream,
	})

	peer.on("signal", signal => {
		socket.emit("returning signal", { signal, callerID })
	})

	peer.signal(incomingSignal);

	return peer;
}

useEffect(() => {
	socket.on('receive move', (data) => {
		setUsers(data.all);

		var me = {};
		for (let i = 0; i < data.all.length; i ++) {
			if (data.all[i].id === socket.id) {
				me = data.all[i];
				break;
			}
		}

		var tempNearby = [];
		for (let i = 0; i < data.all.length; i ++) {
			if (data.all[i].id === socket.id) {
				continue;
			}
			if (proximity(data.all[i], me)) {
				for (var j = 0; j < peersRef.current.length; j ++) {
					if (peersRef.current[j].peerID === data.all[i].id) {
						tempNearby.push(peersRef.current[j]);
					}
				}
			}
		}

		setNearby(tempNearby);
	})
}, [socket]);


const muteUnmute = (e) => {
	const enabled = userVideo.current.srcObject.getAudioTracks()[0].enabled;
	if (enabled) {
		userVideo.current.srcObject.getAudioTracks()[0].enabled = false;	
	} else {
		userVideo.current.srcObject.getAudioTracks()[0].enabled = true;
	}
}

const cameraOnOff = (e) => {
	const enabled = userVideo.current.srcObject.getVideoTracks()[0].enabled;
	if (enabled) {
		userVideo.current.srcObject.getVideoTracks()[0].enabled = false;
	} else {
		userVideo.current.srcObject.getVideoTracks()[0].enabled = true;
	}
}

const screenShare = (e) => {

}

const stopScreenShare = () => {

}

const proximity = (user, me) => {
	if ((user.x - me.x) * (user.x - me.x) + (user.y - me.y) * (user.y - me.y) <= 10000) {
		return true;
	} else {
		return false;
	}
}

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
	
	setUsers(tempUsers);
	let data = {
		id: socket.id,
		room: roomID,
		x: tempUsers[idx].x,
		y: tempUsers[idx].y	
	}
	socket.emit('send move', data);
}
for (let i = 0; i < users.length; i ++) {
	p5.circle(users[i].x, users[i].y, 16);
}
}

return (
<div className="room">
	<div className="video-canvas">
		<div className="buttonbox">
			<button type="button" className="mute" onClick={ (e) => muteUnmute(e) }> Mute </button>
		  <button type="button" className="camera" onClick={ (e) => cameraOnOff(e) }> Camera </button>
	 		<button type="button" className="screenshare" onClick={ (e) => screenShare(e) }> ScreenShare </button>
		</div>
		<div className="videobox">
			<StyledVideo muted ref={ userVideo } autoPlay playsInline />
			{ nearby.map((peer) => {
				return (
					<Video peer={ peer.peer } />
				);
			})}
		</div>
		<Sketch setup={ setup } draw={ draw } className="canvas" />
	</div>
	<Chat className="chat" socket={ socket } room={ roomID } />
</div>
);
};

export default Room;


// import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
// import Peer from "simple-peer";
// import "./Room.css";
// import Sketch from 'react-p5';
// import styled from "styled-components";
// import Chat from "./Chat";
// import RoomSetup from './RoomSetup';

// const socket = io.connect("http://localhost:3001");

// const StyledVideo = styled.video`
// 	height: 300px;
// 	width: 300px;
// `;

// const Video = (props) => {
// 	const ref = useRef();

// 	useEffect(() => {
// 		ref.current.srcObject = props.peer;
// 	}, []);

// 	return (
// 			props.muted ? (
// 				<StyledVideo muted playsInline autoPlay ref={ ref } />
// 			) : (
// 				<StyledVideo playsInline autoPlay ref={ ref } />
// 			)
// 	);
// }

// function Room(props) {
// 		const [name, setName] = useState("");
// 		const [mic, setMic] = useState(true);
// 		const [cam, setCam] = useState(true);
// 		const [joinedRoom, setJoinedRoom] = useState(false);
		
// 		const [users, setUsers] = useState([]);
// 		const [peers, setPeers] = useState([]);
// 		const [connected, setConnected] = useState({});
// 		const peersRef = useRef([]);
// 		const myVideo = useRef([]);
//     const roomID = props.match.params.roomID;

// 		useEffect(() => {
// 			const getUserMedia = async () => {
// 				try {
// 					const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
// 					socket.emit("join room", roomID);
// 					myVideo.current.srcObject = stream;
// 					if (!cam) {
// 						cameraOnOff();
// 					}
// 					if (!mic) {
// 						muteUnmute();
// 					}
// 				} catch (err) {
// 					console.log(err)
// 				}
// 			}

// 			getUserMedia().then(stream => {
// 				socket.on("all users", users => {
// 					const peers = [];
// 					users.forEach(userID => {
// 						const peer = createPeer(userID, socket.id, stream);
// 						peersRef.current.push({
// 							peerID: userID,
// 							peer,
// 						})
// 						peers.push({
// 							peerID: userID,
// 							peer,
// 						});
// 					})
// 					setPeers(peers);
// 				})
	
// 				socket.on("user joined", payload => {
// 					const peer = addPeer(payload.signal, payload.callerID, stream);
// 					peersRef.current.push({
// 						peerID: payload.callerID,
// 						peer,
// 					})
// 					const peerObj = {
// 						peer,
// 						peerID: payload.callerID,
// 					}
// 					setPeers(users => [...users, peerObj]);
// 				});
	
// 				socket.on("receiving returned signal", payload => {
// 					const item = peersRef.current.find(p => p.peerID === payload.id);
// 					item.peer.signal(payload.signal);
// 				});
	
// 				socket.on("user left", id => {
// 					const peerObj = peersRef.current.find(p => p.peerID === id);
// 					if (peerObj) {
// 						peerObj.peer.destroy();
// 					}
// 					const peers = peersRef.current.filter(p => p.peerID !== id);
// 					peersRef.current = peers;
// 					setPeers(peers);
// 				})	
// 			});
// 		}, [myVideo.current]);

// 	useEffect(() => {
// 		socket.on('receive move', (data) => {
// 			setUsers(data.all);
// 			for (let i = 0; i < data.all.length; i ++) {
// 				if (data.all[i].id === data.me.id) {
// 					continue;
// 				}

// 				let closer = proximity(data.all[i], data.me)

// 				if (closer && connected[data.all[i].id] === undefined) {
// 					connectPeer(data.all[i], data.me);

// 				} else if (!closer && connected[data.all[i].id] !== undefined) {
// 					disconnectPeer(data.all[i], data.me);
// 				}
// 			}
// 		})
// 	}, [socket]);

// 	const createPeer = (userToSignal, callerID, stream) => {
// 		const peer = new Peer({
// 			initiator: true,
// 			trickle: false,
// 			stream
// 		})

// 		peer.on('signal', signal => {
// 			socket.emit('sending signal', { userToSignal, callerID, signal })
// 		})

// 		return peer;
// 	}

// 	const addPeer = (incomingSignal, callerID, stream) => {
// 		const peer = new Peer({
// 			initiator: false, 
// 			trickle: false,
// 			stream
// 		})

// 		peer.on('signal', signal => {
// 			socket.emit('returning signal', { signal, callerID })
// 		})

// 		peer.signal(incomingSignal);
// 		return peer;
// 	}

// 	let setup = (p5, canvas) => {
// 		let canv = p5.createCanvas(800, 600).parent(canvas);
// 		let tempUsers = [];
// 		tempUsers.push({
// 			id: socket.id,
// 			room: roomID,
// 			x: 400,
// 			y: 100
// 		});
		
// 		setUsers(tempUsers);
// 	}

// 	let draw = (p5) => {
// 		p5.background("rgb(255, 255, 255)");

// 		let idx = users.findIndex((user) => user.id === socket.id)
// 		if (idx !== -1) {
// 			let tempUsers = users;

// 			if (p5.keyIsDown(87) || p5.keyIsDown(38)) {
// 				tempUsers[idx].y = tempUsers[idx].y - 2;
// 			}
// 			if (p5.keyIsDown(65) || p5.keyIsDown(37)) {
// 				tempUsers[idx].x = tempUsers[idx].x - 2;
// 			}
// 			if (p5.keyIsDown(83) || p5.keyIsDown(40)) {
// 				tempUsers[idx].y = tempUsers[idx].y + 2;
// 			}
// 			if (p5.keyIsDown(68) || p5.keyIsDown(39)) {
// 				tempUsers[idx].x = tempUsers[idx].x + 2;
// 			}	
			
// 			let data = {
// 				id: socket.id,
// 				room: roomID,
// 				x: tempUsers[idx].x,
// 				y: tempUsers[idx].y	
// 			}

// 			setUsers(tempUsers);
// 			socket.emit('send move', data);
// 		}

// 		for (let i = 0; i < users.length; i ++) {
// 			p5.circle(users[i].x, users[i].y, 16);
// 		}
// 	}

	// const muteUnmute = (e) => {
	// 	const enabled = myVideo.current.stcObject.getAudioTracks()[0].enabled;
	// 	if (enabled) {
	// 		myVideo.current.srcObject.getAudioTracks()[0].enabled = false;	
	// 	} else {
	// 		myVideo.current.srcObject.getAudioTracks()[0].enabled = true;
	// 	}
	// }

	// const cameraOnOff = (e) => {
	// 	const enabled = myVideo.current.srcObject.getVideoTracks()[0].enabled;
	// 	if (enabled) {
	// 		myVideo.current.srcObject.getVideoTracks()[0].enabled = false;
	// 	} else {
	// 		myVideo.current.srcObject.getVideoTracks()[0].enabled = true;
	// 	}
	// }
	
	// const screenShare = (e) => {

	// }

	// const stopScreenShare = () => {

	// }

	// const proximity = (user, me) => {
	// 	if ((user.x - me.x) * (user.x - me.x) + (user.y - me.y) * (user.y - me.y) <= 10000) {
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}
	// }

// 	const connectPeer = (user, me) => {
		
		
// 		let temp = connected;
// 		temp[user.id] = true;
// 		setConnected(temp);
// 		return;
// 	}

// 	const disconnectPeer = (user) => {
		

// 		let temp = connected;
// 		delete temp[user.id]
// 		setConnected(temp);
// 		return;
// 	}

  // return (
	// 	<div>
	// 		{ joinedRoom ? (
	// 			<div className="room">
	// 				<div className="video-canvas">
	// 					<div className="videobox">
	// 						<div className="buttonbox">
	// 							<button type="button" className="mute" onClick={ (e) => muteUnmute(e) }> Mute </button>
	// 							<button type="button" className="camera" onClick={ (e) => cameraOnOff(e) }> Camera </button>
	// 							<button type="button" className="screenshare" onClick={ (e) => screenShare(e) }> ScreenShare </button>
	// 						</div>
	// 						<StyledVideo muted ref={ myVideo } autoPlay playsInLine />
	// 						<div className="videos">
	// 							{ peers.map((peer, idx) => {
	// 								return(
	// 									<div>
	// 										{ console.log(peer) }
	// 										<Video peer={ peer.peer } key={ peer.peerID }/>
	// 									</div>
	// 								)
	// 							})}
	// 						</div>
	// 					</div>
	// 					<Sketch setup={ setup } draw={ draw } className="canvas" />
	// 				</div>
	// 				<Chat className="chat" socket={ socket } room={ roomID } name={ name } />
	// 			</div>
	// 			) : (
	// 				<RoomSetup 
	// 					setJoinedRoom={ () => setJoinedRoom(true) } 
	// 					setMic={ preference => setMic(preference) } 
	// 					setCam={ preference => setCam(preference) } 
	// 					setName={ name => setName(name) }
	// 				/>
	// 			)
	// 		}
	// 	</div>
  // );
// };

// export default Room;
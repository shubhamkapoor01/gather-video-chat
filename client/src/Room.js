import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import "./Room.css";
import Sketch from 'react-p5';
import styled from "styled-components";
import Chat from './Chat';

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
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        userVideo.current.srcObject = stream;
					socket.emit("join room", roomID);
            socket.on("all users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socket.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push({
										peerID: userID,
										peer,
									});
                })
                setPeers(peers);
            })

            socket.on("user joined", payload => {
              const peer = addPeer(payload.signal, payload.callerID, stream);
              peersRef.current.push({
              	peerID: payload.callerID,
                peer,
              })

				const peerObj = {
					peer,
					peerID: payload.callerID,
				}
                setPeers(users => [...users, peerObj]);
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
				peersRef.current = peers;
				setPeers(peers);
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
			setUsers(data);
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

	const proximity = (peer) => {
		if (peer.peerID === socket.id) {
			return false;
		}
		let X, Y;
		for (let i = 0; i < users.length; i ++) {
			if (users[i].id === socket.id) {
				X = users[i].x;
				Y = users[i].y;
				break;
			}
		}
		for (let i = 0; i < users.length; i ++) {
			if (users[i].id === peer.peerID) {
				if (Math.abs(users[i].x - X) < 100 && Math.abs(users[i].y - Y) < 100) {
					return true;
				} else {
					return false;
				}
			}
		}
		return false;
	}

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

    return (
		<div className="room">
			<div className="video-canvas">
				<div className="videobox">
					<div className="buttonbox">
						<button type="button" className="mute" onClick={ (e) => muteUnmute(e) }> Mute </button>
						<button type="button" className="camera" onClick={ (e) => cameraOnOff(e) }> Camera </button>
						<button type="button" className="screenshare" onClick={ (e) => screenShare(e) }> ScreenShare </button>
					</div>
					<StyledVideo muted ref={ userVideo } autoPlay playsInline />
    	    	{ peers.map((peer) => {
    	        return (
								proximity(peer) ? (
         	        <Video key={ peer.peerID } peer={ peer.peer } />
								) : (
									<div></div>
								)
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
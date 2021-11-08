import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import "./Room.css";
import Sketch from "react-p5";
import styled from "styled-components";
import Chat from "./Chat";
import RoomSetup from "./RoomSetup";
import "font-awesome/css/font-awesome.min.css";
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/js/all.min.js"
  integrity="sha512-cyAbuGborsD25bhT/uz++wPqrh5cqPh1ULJz4NSpN9ktWcA6Hnh9g+CWKeNx2R0fgQt+ybRXdabSBgYXkQTTmA=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
></script>;
const socket = io.connect("http://localhost:3001");

const StyledVideo = styled.video`
  height: 100%;
  width: 100%;
`;

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    ref.current.srcObject = props.peer._remoteStreams[0];
  }, []);

  return <StyledVideo playsInline autoPlay ref={ref} />;
};

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
    if (!joinedRoom) {
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
        if (!cam) {
          cameraOnOff();
        }
        if (!mic) {
          muteUnmute();
        }
        socket.emit("join room", { roomID: roomID, name: name });
        socket.on("all users", (users) => {
          users.forEach((userID) => {
            const peer = createPeer(userID, socket.id, stream);
            peersRef.current.push({
              peerID: userID,
              peer,
            });
          });
        });

        socket.on("user joined", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
          });
        });

        socket.on("receiving returned signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          item.peer.signal(payload.signal);
        });

        socket.on("user left", (id) => {
          const peerObj = peersRef.current.find((p) => p.peerID === id);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          const peers = peersRef.current.filter((p) => p.peerID !== id);
          const tempNearby = nearby.filter((p) => p.peerID !== id);
          peersRef.current = peers;
          setNearby(tempNearby);
        });
      });
  }, [joinedRoom]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending signal", { userToSignal, callerID, signal });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  useEffect(() => {
    socket.on("receive move", (data) => {
      setUsers(data.all);

      var me = {};
      for (let i = 0; i < data.all.length; i++) {
        if (data.all[i].id === socket.id) {
          me = data.all[i];
          break;
        }
      }

      var tempNearby = [];
      for (let i = 0; i < data.all.length; i++) {
        if (data.all[i].id === socket.id) {
          continue;
        }
        if (proximity(data.all[i], me)) {
          for (var j = 0; j < peersRef.current.length; j++) {
            if (peersRef.current[j].peerID === data.all[i].id) {
              tempNearby.push({
                peerObj: peersRef.current[j],
                name: data.all[i].name,
              });
            }
          }
        }
      }

      setNearby(tempNearby);
    });
  }, [socket]);

  const muteUnmute = (e) => {
    const enabled = userVideo.current.srcObject.getAudioTracks()[0].enabled;
    if (enabled) {
      userVideo.current.srcObject.getAudioTracks()[0].enabled = false;
    } else {
      userVideo.current.srcObject.getAudioTracks()[0].enabled = true;
    }
    const muteBtn = document.querySelector(".mute-1");
    muteBtn.classList.toggle("whitened");
  };

  const cameraOnOff = (e) => {
    const enabled = userVideo.current.srcObject.getVideoTracks()[0].enabled;
    if (enabled) {
      userVideo.current.srcObject.getVideoTracks()[0].enabled = false;
    } else {
      userVideo.current.srcObject.getVideoTracks()[0].enabled = true;
    }
    const cameraBtn = document.querySelector(".camera-1");
    cameraBtn.classList.toggle("cameraOff");
  };

  const screenShare = (e) => {};

  const stopScreenShare = () => {};

  const proximity = (user, me) => {
    if (
      (user.x - me.x) * (user.x - me.x) + (user.y - me.y) * (user.y - me.y) <=
      10000
    ) {
      return true;
    } else {
      return false;
    }
  };

  let setup = (p5, canvas) => {
    let canv = p5.createCanvas(924, 500).parent(canvas);
    let tempUsers = [];
    tempUsers.push({
      id: socket.id,
      room: roomID,
      x: 462,
      y: 100,
    });

    setUsers(tempUsers);
  };

  let draw = (p5) => {
    p5.background("rgb(255, 255, 255)");

    let idx = users.findIndex((user) => user.id === socket.id);
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
        y: tempUsers[idx].y,
      };
      socket.emit("send move", data);
    }
    for (let i = 0; i < users.length; i++) {
      p5.circle(users[i].x, users[i].y, 16);
    }
  };

  return (
    <div>
      {joinedRoom ? (
        <div className="room">
          <div className="video-canvas">
            <div className="buttonbox">
              <button
                type="button"
                className="mute-1"
                onClick={(e) => muteUnmute(e)}
              >
                {" "}
                <i className="fa fa-microphone-slash"></i>{" "}
              </button>
              <button
                type="button"
                className="camera-1"
                onClick={(e) => cameraOnOff(e)}
              >
                {" "}
                <i className="fa fa-camera"></i>{" "}
              </button>
              <button
                type="button"
                className="screenshare-1"
                onClick={(e) => screenShare(e)}
              >
                {" "}
                <i className="fa fa-desktop"></i>{" "}
              </button>
            </div>
            <div className="videobox">
              <div className="video-container">
                <p className="person-name">{name}</p>
                <div className="video-style">
                  <StyledVideo
                    className="video-room"
                    muted
                    ref={userVideo}
                    autoPlay
                    playsInline
                  />
                </div>
              </div>
              {nearby.map((peer) => {
                return (
                  <div className="video-container-peer">
                    <p className="person-name-peer">{peer.name}</p>
                    <div className="video-style-peer">
                      <Video peer={peer.peerObj.peer} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Sketch setup={setup} draw={draw} className="canvas" />
          </div>
          <div>
            <h2> Room ID: </h2>
            <h3> {roomID} </h3>
            <Chat className="chat" socket={socket} room={roomID} name={name} />
          </div>
        </div>
      ) : (
        <RoomSetup
          setJoinedRoom={() => setJoinedRoom(true)}
          setMic={(preference) => setMic(preference)}
          setCam={(preference) => setCam(preference)}
          setName={(name) => setName(name)}
        />
      )}
    </div>
  );
}

export default Room;

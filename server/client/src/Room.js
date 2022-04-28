import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import "./Room.css";
import Sketch from "react-p5";
import styled from "styled-components";
import Chat from "./Chat";
import RoomSetup from "./RoomSetup";
import Model from "./Model";
import "font-awesome/css/font-awesome.min.css";
import imag from "./Sprites/char-idle.png";
import imagu from "./Sprites/char-run-f.gif";
import imagr from "./Sprites/char-run-r-1.gif";
import imagl from "./Sprites/char-run-l.gif";
import imagd from "./Sprites/char-run-2.gif";
import imagg from "./Sprites/char-idle-green-1.png";
import imago from "./Sprites/char-idle-orange-1.png";
import bg1 from "./Sprites/bg-8.png";
import imaggb from "./Sprites/char-run-b-g.gif";
import imaggf from "./Sprites/char-run-f-g.gif";
import imaggl from "./Sprites/char-run-l-g.gif";
import imaggr from "./Sprites/char-run-r-g.gif";
import imagob from "./Sprites/char-run-b-o.gif";
import imagof from "./Sprites/char-run-f-o.gif";
import imagol from "./Sprites/char-run-l-o.gif";
import imagor from "./Sprites/char-run-r-o.gif";
let img,
  imgu,
  imgr,
  imgl,
  bg,
  imgd,
  imgg,
  imgo,
  imggb,
  imggf,
  imggl,
  imggr,
  imgob,
  imgof,
  imgol,
  imgor;
let keypressed = false;
let greenUsed = false;
let fr = 60;
var twoLeft = false;
var userNum = null;
let colorSet = [];
let tempUsers = [];
let tempFine;
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/js/all.min.js"
  integrity="sha512-cyAbuGborsD25bhT/uz++wPqrh5cqPh1ULJz4NSpN9ktWcA6Hnh9g+CWKeNx2R0fgQt+ybRXdabSBgYXkQTTmA=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
></script>;
const socket = io.connect();

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
  const [aiEnabled, setAiEnabled] = useState(false);
  const [name, setName] = useState("");
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [faces, setFaces] = useState(1);
  const [joinedRoom, setJoinedRoom] = useState(false);

  const [nearby, setNearby] = useState([]);
  const [users, setUsers] = useState([]);
  const userVideo = useRef();
  const modelVideo = useRef();
  const peersRef = useRef([]);
  const roomID = props.match.params.roomID;

  useEffect(() => {
    if (!joinedRoom) {
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
        modelVideo.current = {};
        modelVideo.current.srcObject = stream;
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

  useEffect(() => {
    if (!joinedRoom) {
      return;
    }

    if (faces === 0) {
      userVideo.current.srcObject.getVideoTracks()[0].enabled = false;
      userVideo.current.srcObject.getAudioTracks()[0].enabled = false;
    } else {
      if (cam) {
        userVideo.current.srcObject.getVideoTracks()[0].enabled = true;
      }
      if (mic) {
        userVideo.current.srcObject.getAudioTracks()[0].enabled = true;
      }
    }
  }, [faces]);

  const muteUnmute = (e) => {
    const enabled = userVideo.current.srcObject.getAudioTracks()[0].enabled;
    if (enabled) {
      userVideo.current.srcObject.getAudioTracks()[0].enabled = false;
      setMic(false);
    } else {
      userVideo.current.srcObject.getAudioTracks()[0].enabled = true;
      setMic(true);
    }
    const muteBtn = document.querySelector(".mute-1");
    muteBtn.classList.toggle("whitened");
  };

  const cameraOnOff = (e) => {
    const enabled = userVideo.current.srcObject.getVideoTracks()[0].enabled;
    if (enabled) {
      userVideo.current.srcObject.getVideoTracks()[0].enabled = false;
      setCam(false);
    } else {
      userVideo.current.srcObject.getVideoTracks()[0].enabled = true;
      setCam(true);
    }
    const cameraBtn = document.querySelector(".camera-1");
    cameraBtn.classList.toggle("cameraOff");
  };

  const screenShare = (e) => {
    navigator.mediaDevices
      .getDisplayMedia({
        cursor: true,
      })
      .then((screen) => {
        const screenTrack = screen.getVideoTracks()[0];
        userVideo.current.srcObject = screen;
        for (let i = 0; i < peersRef.current.length; i++) {
          let p = peersRef.current[i].peer;
          p.streams[0].getVideoTracks()[0].stop();
          p.replaceTrack(
            p.streams[0].getVideoTracks()[0],
            screenTrack,
            p.streams[0]
          );
        }

        screenTrack.onended = () => {
          navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
              const videoTrack = stream.getVideoTracks()[0];
              userVideo.current.srcObject = stream;
              for (let i = 0; i < peersRef.current.length; i++) {
                let p = peersRef.current[i].peer;
                p.streams[0].getVideoTracks()[0].stop();
                p.replaceTrack(
                  p.streams[0].getVideoTracks()[0],
                  videoTrack,
                  p.streams[0]
                );
              }
            });
        };
      });
  };

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

  let preload = (p5) => {
    img = p5.loadImage(imag);
    imgu = p5.loadImage(imagu);
    imgr = p5.loadImage(imagr);
    imgl = p5.loadImage(imagl);
    imgd = p5.loadImage(imagd);
    bg = p5.loadImage(bg1);
    imgg = p5.loadImage(imagg);
    imgo = p5.loadImage(imago);
    imggb = p5.loadImage(imaggb);
    imggf = p5.loadImage(imaggf);
    imggl = p5.loadImage(imaggl);
    imggr = p5.loadImage(imaggr);
    imgob = p5.loadImage(imagob);
    imgof = p5.loadImage(imagof);
    imgol = p5.loadImage(imagol);
    imgor = p5.loadImage(imagor);
  };

  let setup = (p5, canvas) => {
    p5.frameRate(fr);
    let canv = p5.createCanvas(924, 500).parent(canvas);
    tempUsers.push({
      id: socket.id,
      room: roomID,
      x: 462,
      y: 100,
      direction: null,
      quit: false,
    });

    setUsers(tempUsers);
  };

  let draw = (p5) => {
    p5.background(bg);
    let winClose = false;
    let idx = users.findIndex((user) => user.id === socket.id);
    if (idx !== -1) {
      let tempUsers = users;
      tempUsers[idx].direction = null;
      if (p5.keyIsDown(87) || p5.keyIsDown(38)) {
        keypressed = true;
        tempUsers[idx].y = tempUsers[idx].y - 2;
        p5.image(imgu, users[idx].x, users[idx].y);
        tempUsers[idx].direction = "w";
      } else if (p5.keyIsDown(65) || p5.keyIsDown(37)) {
        keypressed = true;
        tempUsers[idx].x = tempUsers[idx].x - 2;
        p5.image(imgl, users[idx].x, users[idx].y);
        tempUsers[idx].direction = "a";
      } else if (p5.keyIsDown(83) || p5.keyIsDown(40)) {
        keypressed = true;
        tempUsers[idx].y = tempUsers[idx].y + 2;
        p5.image(imgd, users[idx].x, users[idx].y);
        tempUsers[idx].direction = "s";
      } else if (p5.keyIsDown(68) || p5.keyIsDown(39)) {
        keypressed = true;
        tempUsers[idx].x = tempUsers[idx].x + 2;
        p5.image(imgr, users[idx].x, users[idx].y);
        tempUsers[idx].direction = "d";
      } else if (p5.keyIsDown(27)) {
        tempUsers[idx].quit = true;
      }
      if (keypressed == false) {
        if (users[idx].quit == false) {
          p5.image(img, users[idx].x, users[idx].y);
        }
      }
      keypressed = false;
      setUsers(tempUsers);
      let data = {
        id: socket.id,
        room: roomID,
        x: tempUsers[idx].x,
        y: tempUsers[idx].y,
        direction: tempUsers[idx].direction,
        quit: tempUsers[idx].quit,
      };
      socket.emit("send move", data);
    }

    for (let i = 0; i < users.length; i++) {
      if (i === idx) {
        continue;
      }
      if (i === userNum) {
        continue;
      }
      if (twoLeft == true) {
        if (users[i].quit == true) {
          continue;
        }
        if (users.length == 3) {
          if (users[i].direction == "w") {
            p5.image(imggb, users[i].x, users[i].y);
          } else if (users[i].direction == "s") {
            p5.image(imggf, users[i].x, users[i].y);
          } else if (users[i].direction == "a") {
            p5.image(imggl, users[i].x, users[i].y);
          } else if (users[i].direction == "d") {
            p5.image(imggr, users[i].x, users[i].y);
          } else {
            p5.image(imgg, users[i].x, users[i].y);
          }
          continue;
        }
      }
      if (users[i].quit === true) {
        if (users.length === 3) {
          userNum = i;
          twoLeft = true;
          continue;
        }
        continue;
      }
      if (colorSet[i] == "g") {
        if (users[i].direction == "w") {
          p5.image(imggb, users[i].x, users[i].y);
        } else if (users[i].direction == "s") {
          p5.image(imggf, users[i].x, users[i].y);
        } else if (users[i].direction == "a") {
          p5.image(imggl, users[i].x, users[i].y);
        } else if (users[i].direction == "d") {
          p5.image(imggr, users[i].x, users[i].y);
        } else {
          p5.image(imgg, users[i].x, users[i].y);
        }
        continue;
      }
      if (colorSet[i] == "o") {
        if (users[i].direction == "w") {
          p5.image(imgob, users[i].x, users[i].y);
        } else if (users[i].direction == "s") {
          p5.image(imgof, users[i].x, users[i].y);
        } else if (users[i].direction == "a") {
          p5.image(imgol, users[i].x, users[i].y);
        } else if (users[i].direction == "d") {
          p5.image(imgor, users[i].x, users[i].y);
        } else {
          p5.image(imgo, users[i].x, users[i].y);
        }
        continue;
      }
      if (users.length == 2) {
        if (users[i].direction == "w") {
          p5.image(imggb, users[i].x, users[i].y);
        } else if (users[i].direction == "s") {
          p5.image(imggf, users[i].x, users[i].y);
        } else if (users[i].direction == "a") {
          p5.image(imggl, users[i].x, users[i].y);
        } else if (users[i].direction == "d") {
          p5.image(imggr, users[i].x, users[i].y);
        } else {
          p5.image(imgg, users[i].x, users[i].y);
        }
      } else if (users.length > 2) {
        if (greenUsed == false) {
          colorSet[i] = "g";
          if (users[i].direction == "w") {
            p5.image(imggb, users[i].x, users[i].y);
          } else if (users[i].direction == "s") {
            p5.image(imggf, users[i].x, users[i].y);
          } else if (users[i].direction == "a") {
            p5.image(imggl, users[i].x, users[i].y);
          } else if (users[i].direction == "d") {
            p5.image(imggr, users[i].x, users[i].y);
          } else {
            p5.image(imgg, users[i].x, users[i].y);
          }
          greenUsed = true;
        } else {
          colorSet[i] = "o";
          if (users[i].direction == "w") {
            p5.image(imgob, users[i].x, users[i].y);
          } else if (users[i].direction == "s") {
            p5.image(imgof, users[i].x, users[i].y);
          } else if (users[i].direction == "a") {
            p5.image(imgol, users[i].x, users[i].y);
          } else if (users[i].direction == "d") {
            p5.image(imgor, users[i].x, users[i].y);
          } else {
            p5.image(imgo, users[i].x, users[i].y);
          }
          greenUsed = false;
        }
      }
    }
  };
  // const setFalse = () => {
  //   let idx = users.findIndex((user) => user.id === socket.id);
  //   if (tempFine) {
  //     users[idx].quit = false;
  //   }
  //   return;
  // };
  const leaveRoom = () => {
    let idx = users.findIndex((user) => user.id === socket.id);
    if (tempFine) {
      users[idx].quit = true;
    }
    tempFine = false;
  };
  useEffect(
    () => {
      let idx = users.findIndex((user) => user.id === socket.id);
      if (users[idx] != undefined) {
        tempFine = true;
      }
      console.log(tempFine);
      if (users.length > 0) {
        if (users[idx].quit === true) {
          // setFalse();
          // console.log(users[idx].quit);
          props.history.push(`/`);
        }
      }
    },
    [draw],
    [leaveRoom]
  );

  const handleAiToggle = () => {
    if (aiEnabled) {
      setAiEnabled(false);
    } else {
      setAiEnabled(true);
    }
    const aiBtn = document.querySelector(".enable-ai");
    aiBtn.classList.toggle("aiBtnOn");
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
            <Sketch
              setup={setup}
              draw={draw}
              preload={preload}
              className="canvas"
            />
            <button className="leave-room" onClick={(e) => leaveRoom()}>
              Leave Room
            </button>
          </div>
          <div>
            <button className="enable-ai" onClick={(e) => handleAiToggle()}>
              Enable Auto Video Controller AI
            </button>
            {aiEnabled ? (
              <Model
                streamRef={modelVideo}
                setFaces={(faces) => setFaces(faces)}
              />
            ) : (
              <div></div>
            )}
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

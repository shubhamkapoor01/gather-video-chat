import React, { useState, useEffect, useRef } from "react";
import "./RoomSetup.css";
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/js/all.min.js"
  integrity="sha512-cyAbuGborsD25bhT/uz++wPqrh5cqPh1ULJz4NSpN9ktWcA6Hnh9g+CWKeNx2R0fgQt+ybRXdabSBgYXkQTTmA=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
></script>;

function RoomSetup(props) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [name, setName] = useState("");
  const videoStream = useRef(null);

  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoStream.current.srcObject = stream;
      } catch (err) {
        console.log(err);
      }
    };

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
    const muteBtn = document.querySelector(".mute");
    muteBtn.classList.toggle("whitened");
  };

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
    const cameraBtn = document.querySelector(".camera");
    cameraBtn.classList.toggle("cameraOff");
  };

  const updateName = (newName) => {
    setName(newName);
    props.setName(newName);
  };

  const joinRoom = (e) => {
    if (name === "") {
      alert("please enter a valid name");
      return;
    }
    props.setJoinedRoom(true);
  };

  return (
    <div className="roomsetup">
      <div className="roomsetup-1">
        <div className="Vid-controls">
          <div className="Btn-controls">
            <button onClick={(e) => muteUnmute(e)} className="mute">
              <i className="fa fa-microphone-slash"></i>
            </button>
            <button onClick={(e) => cameraOnOff(e)} className="camera">
              <i className="fa fa-camera"></i>
            </button>
          </div>
          <video className="video" muted ref={videoStream} autoPlay />
        </div>
        <div className="join-controls">
          <h1 className="name">Enter Your Name</h1>
          <input
            className="dispName"
            placeholder="Enter Display Name"
            onChange={(e) => updateName(e.target.value)}
          />
          <button className="join-Btn" onClick={(e) => joinRoom(e)}>
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomSetup;

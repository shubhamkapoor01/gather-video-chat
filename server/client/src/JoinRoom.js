import React, { useState } from "react";
import './JoinRoom.css'
import { v1 as uuid } from "uuid";
import io from "socket.io-client";
import e from "cors";

const socket = io.connect("https://gather-town.herokuapp.com")

function JoinRoom(props) {
    const [name, setName] = useState("")
    const [room, setRoom] = useState("")
  
    const joinRoom = (e) => {
      e.preventDefault()
      if (name === "" || room === "") {
        alert("Please enter valid values")
        return
      }

      document.getElementById("input-name").value = ""
      document.getElementById("input-room").value = ""

      props.history.push(`/room/${room}`);
    }

    const createRoom = (e) => {
        e.preventDefault();
        if (name === "") {
            alert("Please enter a name")
            return
        }

        document.getElementById("input-name").value = ""
        document.getElementById("input-room").value = ""

        const roomID = uuid();
        props.history.push(`/room/${roomID}`);
    }

    return (
        <div className="joinRoom">
            <h1> Enter Room Details </h1>
            <input id="input-name" type="text" placeholder="Enter Your Name..." onChange={ (e) => setName(e.target.value) }/>
            <input id="input-room" type="text" placeholder="Enter Room ID..." onChange={ (e) => setRoom(e.target.value) }/>
            <button type="submit" onClick={ (e) => joinRoom(e) }> Join a room </button>
            <button onClick={ (e) => createRoom(e) }> Create new room </button>
        </div>
    );
};

export default JoinRoom;
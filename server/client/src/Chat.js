import React, { useState, useEffect } from 'react'
import './Chat.css'
import ScrollToBottom from 'react-scroll-to-bottom'

function Chat({ socket, room, name }) {
	const [messages, setMessages] = useState([])
	const [message, setMessage] = useState("")

	const sendMessage = async (e) => {
		e.preventDefault()
		if (message === "") {
			alert("Please enter a valid message")
			return
		}

		const messageData = {
			room: room,
			senderId: socket.id,
			senderName: name,
			message: message,
			time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
		}

		await socket.emit('send message', messageData)
		setMessages((list) => [...list, messageData])
		setMessage("");
		document.getElementById('input').value = ""
	}

  useEffect(() => {
    socket.on('receive message', (data) => {
			setMessages((list) => [...list, data])
    })
  }, [socket])

	return (
		<div className="chatbox">
			<div className="chat">
				<div className="chat-header"> Live Chat </div>
				<div className="chat-body">
					<ScrollToBottom className="message-container">
						{ messages.map((message) => {
							return (
								<div className="message">
									{ message.senderId === socket.id ? (
										<div className="message-sent"> 
											<div className="message-sender">
												<div className="sender-name">
													<div className="sender-send"> { message.senderName } </div>
												</div>
												<div className="content-box">
													<div className="text"> { message.message } </div>
													<div className="time"> { message.time } </div>
												</div>
											</div>
										</div>
									) : (
										<div className="message-received">
											<div className="message-receiver">
												<div className="sender-received"> { message.senderName } </div>
												<div className="content-reciever">
													<div className="content-box">
														<div className="text"> { message.message } </div>
														<div className="time"> { message.time } </div>
													</div>
												</div> 
											</div>
										</div>
									)}
								</div>
							)
						})}
					</ScrollToBottom>
				</div>
				<div className="chat-footer">
					<input className="message-input" id="input" type="text" placeholder="Type Message Here..." onChange={ (e) => setMessage(e.target.value) }/>
					<button className="send-message" onClick={ (e) => sendMessage(e) }> 
						&#9658;
					</button>
				</div>
			</div>
		</div>
	)
}

export default Chat
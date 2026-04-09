import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

const AdminChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // 이제 임시 방 번호('test-admin-room')가 아니라 빈 값으로 시작합니다!
  const [roomId, setRoomId] = useState(''); 
  
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // 임시 테스트용 데이터 (추후 실제 로그인한 유저 ID로 변경하세요)
  const currentUser = sessionStorage.getItem("username"); 

  // 채팅창이 열릴 때마다 스크롤을 맨 아래로 내리기
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // 🚀 모달창 열고 닫기 핸들러 (API 호출을 위해 async 추가!)
  const toggleChat = async () => {
    if (!isOpen) {
      // 채팅창을 열 때 백엔드에 "관리자 방 번호 주세요!" 하고 요청합니다.
      try {
        // 🚨 1. 로컬 스토리지에서 발급받은 토큰을 꺼냅니다. (저장하신 키 이름에 맞게 수정하세요! 예: token, jwt 등)
        const token = sessionStorage.getItem("accessToken"); 
        
        // 🚨 2. Axios에 실어 보낼 헤더(신분증)를 미리 만듭니다.
        const axiosConfig = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // const roomRes = await axios.post('http://localhost/api/chat/room/admin', {
        const roomRes = await axios.post('/api/chat/room/admin', {
        },axiosConfig);
        
        let realRoomId = roomRes.data.roomId;
        // 🚨 [임시 테스트용 트릭] 만약 지금 로그인한 사람이 관리자라면?
        if (currentUser === "admin") {
           // 무조건 아까 복사해둔 'es'의 방 번호로 덮어씌워서 강제 입장시킵니다!
           realRoomId = "0b4c63e1-16da-4051-abb1-302048f8f733"; 
        }
        setRoomId(realRoomId); // 받아온 진짜 UUID 방 번호를 상태에 저장

        // (보너스!) 방 번호를 알았으니 이전 대화 기록도 깔끔하게 불러옵니다.
        // const historyRes = await axios.get(`http://localhost/api/chat/room/${realRoomId}/messages`);
        const historyRes = await axios.get(`/api/chat/room/${realRoomId}/messages`);
        setMessages(historyRes.data);

        // 이전 기록까지 다 불렀으면, 그 방 번호로 웹소켓 연결 시작!
        connectStomp(realRoomId); 

      } catch (error) {
        console.error("고객센터 방 생성 및 연결 실패:", error);
      }
    } else {
      // 채팅창을 닫을 때는 연결을 끊어줍니다.
      disconnectStomp();
    }
    setIsOpen(!isOpen);
  };

  // 🚀 STOMP 연결 (매개변수로 realRoomId를 받도록 수정)
  const connectStomp = (currentRoomId) => {

    const token = sessionStorage.getItem("accessToken");
    const client = new Client({
      // webSocketFactory: () => new SockJS('http://localhost/ws-chat'),
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: {
        Authorization: `Bearer ${token}` 
      },
      onConnect: () => {
        console.log("고객센터 웹소켓 연결 성공! 방 번호:", currentRoomId);
        
        // 받아온 진짜 방 번호로 구독!
        client.subscribe(`/sub/chat/room/${currentRoomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, receivedMessage]);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP 에러:', frame.headers['message']);
      },
    });

    client.activate();
    stompClient.current = client;
  };

  // STOMP 연결 해제
  const disconnectStomp = () => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
  };

  // 메시지 전송
  const sendMessage = () => {
    // roomId가 확실히 발급된 상태에서만 전송 가능하도록 조건 추가
    if (inputMessage.trim() !== '' && stompClient.current && stompClient.current.connected && roomId) {
      const messageData = {
        roomId: roomId,
        sender: currentUser,
        content: inputMessage
      };

      stompClient.current.publish({
        destination: '/pub/chat/message',
        body: JSON.stringify(messageData),
      });

      setInputMessage('');
    }
  };

  return (
    <div className="admin-chat-wrapper">
      {/* 1. 채팅 모달 창 */}
      <div className={`admin-chat-modal ${isOpen ? 'open' : ''}`}>
        <div className="admin-chat-header">
          <div className="header-info">
            <i className="fas fa-headset"></i>
            <div>
              <h3>환승마켓 고객센터</h3>
              <p>무엇을 도와드릴까요?</p>
            </div>
          </div>
          <button className="close-btn" onClick={toggleChat}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="admin-chat-body">
          {messages.length === 0 && (
            <div className="empty-message">
              <i className="far fa-comment-dots"></i>
              <p>관리자에게 문의를 남겨주세요.<br/>(현재 관리자 시스템 점검 중)</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-wrap ${msg.sender === currentUser ? 'me' : 'admin'}`}>
              <div className="chat-bubble">
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="admin-chat-footer">
          <input 
            type="text" 
            placeholder="메시지를 입력하세요..." 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={!roomId} // 방 번호가 발급되기 전에는 입력 막기
          />
          <button onClick={sendMessage} disabled={!inputMessage.trim() || !roomId}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* 2. 플로팅 둥근 버튼 */}
      <button className="admin-chat-fab" onClick={toggleChat}>
        {isOpen ? <i className="fas fa-times"></i> : <i className="fas fa-comment-dots"></i>}
      </button>
    </div>
  );
};

export default AdminChat;
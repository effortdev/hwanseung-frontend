import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
// 🚨 만약 CSS 파일이 별도로 있다면 여기에 꼭 import 해주세요! (예: import './AdminChat.css';)

const TradeChatTest = () => {
  // 📦 가짜 상품 데이터
  const mockProduct = {
    itemId: 101, 
    title: "맥북 프로 16인치 M3 팝니다",
    sellerId: "admin", // 테스트를 위해 sellerId를 admin으로 세팅 (상황에 맞게 변경 가능)
    price: "2,500,000원"
  };

  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  const currentUser = sessionStorage.getItem("username"); 
  const token = sessionStorage.getItem("accessToken");

  // 스크롤 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // 🚀 '채팅하기' 버튼 클릭 시
  const startTradeChat = async () => {
    try {
      // const res = await axios.post('http://localhost/api/chat/room/trade', {
      const res = await axios.post('/api/chat/room/trade', {
        itemId: mockProduct.itemId,
        sellerId: mockProduct.sellerId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const realRoomId = res.data.roomId;
      setRoomId(realRoomId);

      // const historyRes = await axios.get(`http://localhost/api/chat/room/${realRoomId}/messages`, {
      const historyRes = await axios.get(`/api/chat/room/${realRoomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(historyRes.data);

      connectStomp(realRoomId);
      setIsOpen(true); // 모달창 열기!

    } catch (error) {
      console.error("중고거래 방 생성 실패:", error);
    }
  };

  // 🚀 STOMP 연결
  const connectStomp = (currentRoomId) => {
    const client = new Client({
      // webSocketFactory: () => new SockJS('http://localhost/ws-chat'),
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log("중고거래 웹소켓 연결 성공! 방 번호:", currentRoomId);
        client.subscribe(`/sub/chat/room/${currentRoomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, receivedMessage]);
        });
      }
    });
    client.activate();
    stompClient.current = client;
  };

  // 창 닫기
  const closeChat = () => {
    if (stompClient.current) stompClient.current.deactivate();
    setIsOpen(false);
  };

  // 메시지 전송
  const sendMessage = () => {
    if (inputMessage.trim() !== '' && stompClient.current?.connected && roomId) {
      const messageData = {
        roomId: roomId,
        senderId: currentUser,
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
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      
      {/* 1. 임시 상품 상세 페이지 영역 */}
      <h2>임시 상품 상세 페이지 (테스트용)</h2>
      <div style={{ border: '1px solid #ddd', padding: '20px', width: '300px', borderRadius: '8px' }}>
        <h3>{mockProduct.title}</h3>
        <p style={{ color: 'gray' }}>판매자: {mockProduct.sellerId}</p>
        <p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{mockProduct.price}</p>
        <button 
          onClick={startTradeChat} 
          style={{ width: '100%', padding: '10px', backgroundColor: '#ff6f0f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
        >
          채팅으로 거래하기
        </button>
      </div>

      {/* 2. 🚨 기존 관리자 창 디자인(클래스명)을 그대로 이식한 채팅 모달창! */}
      <div className="admin-chat-wrapper">
        <div className={`admin-chat-modal ${isOpen ? 'open' : ''}`}>
          
          {/* 채팅창 헤더 */}
          <div className="admin-chat-header">
            <div className="header-info">
              <i className="fas fa-store"></i> {/* 상점 아이콘으로 변경 */}
              <div>
                <h3>{mockProduct.sellerId} 님과의 대화</h3>
                <p>{mockProduct.title}</p>
              </div>
            </div>
            <button className="close-btn" onClick={closeChat}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* 채팅창 대화 내용 */}
          <div className="admin-chat-body">
            {messages.length === 0 && (
              <div className="empty-message">
                <i className="far fa-comment-dots"></i>
                <p>판매자에게 인사해보세요!</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              // 상대방 메시지 디자인을 적용하기 위해 기존 CSS의 'admin' 클래스를 그대로 활용합니다.
              <div key={index} className={`chat-bubble-wrap ${msg.sender === currentUser ? 'me' : 'admin'}`}>
                <div className="chat-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 채팅창 입력부 */}
          <div className="admin-chat-footer">
            <input 
              type="text" 
              placeholder="메시지를 입력하세요..." 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} disabled={!inputMessage.trim()}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default TradeChatTest;
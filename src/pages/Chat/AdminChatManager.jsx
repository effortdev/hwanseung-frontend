import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
// ✅ 대시보드와 동일한 CSS 모듈 임포트
import styles from "../Admin/AdminContent.module.css";

const AdminChatManager = () => {
  const [rooms, setRooms] = useState([]); // 전체 문의방 목록
  const [selectedRoomId, setSelectedRoomId] = useState(null); // 관리자가 클릭한 방 번호
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // 관리자 권한 확인용 토큰 및 아이디
  const currentUser = sessionStorage.getItem("username") || "admin"; 
  const token = sessionStorage.getItem("accessToken");

  // 1. 관리자가 '문의 내역' 탭에 들어오면 전체 방 목록을 불러옵니다.
  useEffect(() => {
    fetchRooms();
  }, []);

  // 대화가 추가될 때마다 스크롤을 맨 아래로 내려줍니다.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🚀 전체 방 목록 불러오기 API 호출
  const fetchRooms = async () => {
    try {
      // const res = await axios.get('http://localhost/api/chat/admin/rooms', {
      const res = await axios.get('/api/chat/admin/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("백엔드가 준 방 목록 데이터:", res.data);
      setRooms(res.data);
    } catch (error) {
      console.error("방 목록 불러오기 실패:", error);
    }
  };

  // 🚀 왼쪽 방 목록에서 특정 고객의 방을 클릭했을 때!
  const handleRoomSelect = async (roomId) => {
    if (stompClient.current) {
        stompClient.current.deactivate();
    }
    
    setSelectedRoomId(roomId);

    try {
      // const historyRes = await axios.get(`http://localhost/api/chat/room/${roomId}/messages`, {
      const historyRes = await axios.get(`/api/chat/room/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(historyRes.data);
      connectStomp(roomId);
    } catch (error) {
      console.error("대화 기록 불러오기 실패:", error);
    }
  };

  // 🚀 STOMP 웹소켓 연결 로직 (고객용과 동일)
  const connectStomp = (roomId) => {
    const client = new Client({
      // webSocketFactory: () => new SockJS('http://localhost/ws-chat'),
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log("관리자 모드: 웹소켓 연결 성공! 현재 접속한 방:", roomId);
        
        client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
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

  // 🚀 관리자가 고객에게 메시지 전송
  const sendMessage = () => {
    if (inputMessage.trim() !== '' && stompClient.current?.connected && selectedRoomId) {
      const messageData = {
        roomId: selectedRoomId,
        sender: currentUser, // "admin"으로 전송됨
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
    // ✅ 대시보드와 동일한 container 클래스 적용
    <div className={styles.container}>
      {/* ✅ 대시보드 타이틀 스타일 적용 */}
      <h2 className={styles.title}>고객 문의 관리</h2>

      {/* ✅ 대시보드 카드 스타일(그림자, 둥근 테두리, 배경색) 적용 */}
      <div style={{ 
        display: 'flex', 
        height: '75vh', 
        width: '100%', 
        backgroundColor: 'var(--sidebar-color)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden'
      }}>
        
        {/* 1. 왼쪽 패널: 고객 문의 방 목록 */}
        <div style={{ width: '30%', borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>문의 내역</h3>
              <button onClick={fetchRooms} style={{ 
                padding: '6px 12px', 
                cursor: 'pointer',
                backgroundColor: 'var(--primary-color-light)',
                color: 'var(--primary-color)',
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '600'
              }}>
                <i className="bx bx-refresh"></i> 새로고침
              </button>
            </div>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {rooms.length === 0 ? (
              <p style={{ padding: '20px', color: 'var(--text-color)', opacity: 0.6, textAlign: 'center' }}>열려있는 문의가 없습니다.</p>
            ) : null}
            
            {rooms.map((room) => (
              <div 
                key={room.roomId} 
                onClick={() => handleRoomSelect(room.roomId)}
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid rgba(0,0,0,0.04)', 
                  cursor: 'pointer',
                  backgroundColor: selectedRoomId === room.roomId ? 'var(--primary-color-light)' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-color)' }}>{room.buyerId} 님의 문의</strong>
                <div style={{ fontSize: '0.85em', color: 'var(--text-color)', opacity: 0.6 }}>방 번호: {room.roomId.substring(0, 8)}...</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. 오른쪽 패널: 채팅창 */}
        <div style={{ width: '70%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sidebar-color)' }}>
          {selectedRoomId ? (
            <>
              {/* 채팅창 헤더 */}
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>
                  현재 연결된 방: <span style={{ opacity: 0.7, fontWeight: 'normal' }}>{selectedRoomId.substring(0, 8)}...</span>
                </h3>
              </div>
              
              {/* 채팅 내역 영역 */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                {messages.map((msg, index) => (
                  <div key={index} style={{ textAlign: msg.sender === currentUser ? 'right' : 'left', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.8em', color: 'var(--text-color)', opacity: 0.6, marginRight: '8px', marginLeft: '8px' }}>
                      {msg.sender === currentUser ? '관리자' : msg.sender}
                    </span>
                    <div style={{ 
                      display: 'inline-block', 
                      padding: '12px 16px', 
                      borderRadius: '12px', 
                      // 관리자(본인)는 primary 컬러, 고객은 기본 카드 색상
                      backgroundColor: msg.sender === currentUser ? 'var(--primary-color)' : 'var(--sidebar-color)',
                      color: msg.sender === currentUser ? '#fff' : 'var(--text-color)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      border: msg.sender === currentUser ? 'none' : '1px solid rgba(0,0,0,0.08)',
                      maxWidth: '70%',
                      wordBreak: 'break-word',
                      textAlign: 'left'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 채팅 입력 영역 */}
              <div style={{ padding: '20px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  style={{ 
                    flex: 1, 
                    padding: '14px 16px', 
                    border: '1px solid rgba(0,0,0,0.1)', 
                    borderRadius: '8px', 
                    outline: 'none',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    color: 'var(--text-color)'
                  }}
                  placeholder="고객에게 보낼 메시지를 입력하세요..."
                />
                <button 
                  onClick={sendMessage} 
                  style={{ 
                    padding: '0 24px', 
                    backgroundColor: inputMessage.trim() ? 'var(--primary-color)' : 'var(--primary-color-light)', 
                    color: inputMessage.trim() ? '#fff' : 'var(--primary-color)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  disabled={!inputMessage.trim()}
                >
                  전송
                </button>
              </div>
            </>
          ) : (
            /* 방을 선택하기 전 안내 문구 (Boxicon 추가 및 테마에 맞춤) */
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-color)', opacity: 0.6 }}>
              <i className="bx bx-message-square-dots" style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--primary-color)' }}></i>
              <p>왼쪽 목록에서 답변할 고객의 문의방을 선택해주세요.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminChatManager;
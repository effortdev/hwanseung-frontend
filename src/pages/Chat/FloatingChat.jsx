import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

import { useUser } from '../../UserContext';

const FloatingChat = () => {

  const { userInfo } = useUser();

  const [isOpen, setIsOpen] = useState(false); 
  const [activeRoom, setActiveRoom] = useState(null); 

  const [chatRooms, setChatRooms] = useState([]); 
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); 

  // 🚨 1. 알림만 전담해서 듣는 두 번째 STOMP 클라이언트 (배경에서 계속 켜져 있음)
  const notiStompClient = useRef(null);

  const token = sessionStorage.getItem("accessToken");
  // const currentUser = sessionStorage.getItem("username") || "알수없음";
  const currentUser = userInfo?.username || userInfo?.userId || sessionStorage.getItem("username");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoom]);

  // ========================================================
  // 🚨 [여기에 추가!] 컴포넌트가 화면에서 완전히 사라질 때 채팅 연결을 강제 종료하는 청소부
  // ========================================================
  useEffect(() => {
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  // ========================================================
  // 🚨 2. [핵심] 처음에 알림 채널에 연결해서 귀를 열어둡니다!
  // ========================================================
  useEffect(() => {
    fetchMyChatRooms();

    // 플로팅 아이콘 전용 "알림 수신기" 연결
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        // 내 알림 전용 주파수에 귀를 엽니다.
        client.subscribe(`/sub/user/${currentUser}/notification`, (message) => {
          const newNoti = JSON.parse(message.body);
          
          // 오직 "채팅" 알림일 때만 빨간 점을 올립니다!
          if (newNoti.type === 'CHAT') {
            // const incomingRoomId = newNoti.relatedItemId.toString();
            const incomingRoomId = newNoti.relatedStringId;

            setChatRooms((prevRooms) => {
              // 꼼수: 최신 activeRoom 상태 확인
              let currentActiveRoomId = null;
              setActiveRoom(current => {
                 currentActiveRoomId = current?.roomId;
                 return current;
              });

              // 내가 이미 그 방 안에서 채팅을 보고 있다면 알림 숫자 안 올림!
              if (currentActiveRoomId === incomingRoomId) {
                return prevRooms; 
              }

              // 안 보고 있는 방이라면 뱃지 올리기!
              const roomExists = prevRooms.find(r => r.roomId === incomingRoomId);
              if (roomExists) {
                const updatedRoom = { ...roomExists, unreadCount: roomExists.unreadCount + 1, lastMessage: newNoti.content };
                return [updatedRoom, ...prevRooms.filter(r => r.roomId !== incomingRoomId)]; // 맨 위로 끌어올림
              } else {
                fetchMyChatRooms(); // 처음 말 거는 사람이면 목록 새로 불러오기
                return prevRooms;
              }
            });
          }
        });
      }
    });

    client.activate();
    notiStompClient.current = client;

    return () => {
      if (notiStompClient.current) notiStompClient.current.deactivate();
    };
  }, [token, currentUser]);
  // ========================================================

  const fetchMyChatRooms = async () => {
    if (!token) return;
    try {
      // const res = await axios.get('http://localhost/api/chat/my-rooms', {
      const res = await axios.get('/api/chat/my-rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatRooms(res.data);
    } catch (error) {
      console.error("채팅방 목록 불러오기 실패:", error);
    }
  };

  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0);

  useEffect(() => {
    const handleOpenChat = async (e) => {
      const { roomId, buyerId, sellerId, itemName } = e.detail;
      setIsOpen(true);
      
      const newRoom = { roomId, buyerId, sellerId, itemName, unreadCount: 0, lastMessage: "새로운 대화가 시작되었습니다." };
      setActiveRoom(newRoom);
      setMessages([]);

      setChatRooms((prev) => {
        const exists = prev.find(r => r.roomId === roomId);
        if (exists) return prev;
        return [newRoom, ...prev]; 
      });

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

    window.addEventListener('openTradeChat', handleOpenChat);
    return () => window.removeEventListener('openTradeChat', handleOpenChat);
  }, [token]);

  const toggleChat = () => {
    if (isOpen) {
      // if (stompClient.current) stompClient.current.deactivate();
      setActiveRoom(null); 
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const backToList = () => {
    // if (stompClient.current) stompClient.current.deactivate(); 
    setActiveRoom(null); 
  };

  const enterRoom = async (room) => {
    setActiveRoom(room); 
    setMessages([]); 

    // 🚨 3. 방에 들어갔을 때, 화면에서 안 읽은 메시지 숫자를 즉시 0으로 폭파!
    setChatRooms(prev => prev.map(r => r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r));
    
    try {
      // const historyRes = await axios.get(`http://localhost/api/chat/room/${room.roomId}/messages`, {
      const historyRes = await axios.get(`/api/chat/room/${room.roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(historyRes.data);
      connectStomp(room.roomId);
    } catch (error) {
      console.error("방 입장 실패:", error);
    }
  };

  const startAdminChat = async () => {
    try {
      // const roomRes = await axios.post('http://localhost/api/chat/room/admin', {}, { 
      const roomRes = await axios.post('/api/chat/room/admin', {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const realRoomId = roomRes.data.roomId;
      
      setActiveRoom({ roomId: realRoomId, buyerId: "환승마켓 고객센터", itemName: "1:1 문의", unreadCount: 0 });
      setMessages([]);

      // const historyRes = await axios.get(`http://localhost/api/chat/room/${realRoomId}/messages`, {
      const historyRes = await axios.get(`/api/chat/room/${realRoomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(historyRes.data);
      connectStomp(realRoomId);
    } catch (error) {
      console.error("고객센터 방 생성 실패:", error);
      alert("고객센터에 연결할 수 없습니다.");
    }
  };

  const connectStomp = (currentRoomId) => {
    // 🚨 [핵심 방어 코드 1] 기존에 연결된 방 라디오가 있다면 반드시 먼저 전원을 끕니다!
    if (stompClient.current) {
      stompClient.current.deactivate();
      stompClient.current = null;
    }

    const client = new Client({
      // webSocketFactory: () => new SockJS('http://localhost/ws-chat'),
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/sub/chat/room/${currentRoomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, receivedMessage]);
        });
      }
    });
    client.activate();
    stompClient.current = client;
  };

  // ========================================================
  // 🚨 4. [핵심] 메시지 쏠 때, 상대방 아이디(receiverId) 묶어 보내기!
  // ========================================================
  const sendMessage = () => {
    if (inputMessage.trim() !== '' && stompClient.current?.connected && activeRoom) {
      
      const opponentId = getOpponentName(activeRoom); // 상대방 아이디 알아내기

      const messageData = { 
        roomId: activeRoom.roomId, 
        sender: currentUser, 
        senderId: currentUser, 
        content: inputMessage,
        receiverId: opponentId === "환승마켓 고객센터" ? "admin" : opponentId // 🚨 백엔드 DTO에 추가한 바로 그 녀석!
      };

      // 🚨 [탐지기 1번] 백엔드로 쏘기 직전에 데이터 확인! (F12 콘솔창 확인)
      console.log("🔥 [탐지기 1번] 백엔드로 보낼 데이터:", messageData);
      
      stompClient.current.publish({ destination: '/pub/chat/message', body: JSON.stringify(messageData) });
      setInputMessage('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file); 

    try {
      // const uploadRes = await axios.post('http://localhost/api/chat/image', formData, {
      const uploadRes = await axios.post('/api/chat/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      const imageUrl = uploadRes.data; 

      if (stompClient.current?.connected && activeRoom) {
        const messageData = { roomId: activeRoom.roomId, sender: currentUser, senderId: currentUser, content: imageUrl };
        stompClient.current.publish({ destination: '/pub/chat/message', body: JSON.stringify(messageData) });
      }
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      e.target.value = ''; 
    }
  };

  const getOpponentName = (room) => {
    if (!room) return "";
    if (room.buyerId === "환승마켓 고객센터") return "환승마켓 고객센터";
    if (room.sellerId) {
      return currentUser === room.buyerId ? room.sellerId : room.buyerId;
    }
    return room.buyerId; 
  };

  return (
    <>
      <div className="admin-chat-wrapper">
        <div className={`admin-chat-modal ${isOpen ? 'open' : ''}`}>
          
          {!activeRoom ? (
            /* ================= [화면 1] 채팅방 목록 ================= */
            <>
              <div className="admin-chat-header">
                <h3>내 채팅방</h3>
                <button className="close-btn" onClick={toggleChat}><i className="fas fa-times"></i></button>
              </div>
              
              <div className="chat-list-body">
                {currentUser !== "admin" && (
                  <div className="admin-contact-item" onClick={startAdminChat}>
                    <div className="admin-icon-box"><i className="fas fa-headset"></i></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--brand-color, #ff6f0f)', marginBottom: '2px', fontSize: '15px' }}>관리자와 1:1 문의하기</div>
                      <div style={{ fontSize: '0.85em', color: '#888' }}>환승마켓 고객센터 연결</div>
                    </div>
                  </div>
                )}
                
                <div style={{ backgroundColor: '#fff' }}>
                  {chatRooms.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>참여 중인 채팅방이 없습니다.</div>}
                  {chatRooms.map((room) => (
                    <div key={room.roomId} className="chat-room-item" onClick={() => enterRoom(room)}>
                      <div className="chat-room-header">
                        <span className="opponent-name">{getOpponentName(room)}</span>
                        {room.unreadCount > 0 && <span className="unread-badge">{room.unreadCount}</span>}
                      </div>
                      {room.itemName && (
                        <div className="item-name-preview">[{room.itemName}]</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            
            /* ================= [화면 2] 채팅방 내부 ================= */
            <>
              <div className="admin-chat-header">
                <button className="back-btn" onClick={backToList}><i className="fas fa-chevron-left"></i></button>
                <div className="header-info">
                  <div>
                    <h3>{getOpponentName(activeRoom)}</h3>
                    {activeRoom.itemName && <p>{activeRoom.itemName}</p>}
                  </div>
                </div>
                <button className="close-btn" onClick={toggleChat}><i className="fas fa-times"></i></button>
              </div>

              <div className="admin-chat-body">
                {messages.length === 0 && <div className="empty-message"><p>대화를 시작해보세요!</p></div>}
                
                {messages.map((msg, index) => {

                  const isImage = msg.content && msg.content.includes('/api/imgs/');
                  const isMe = (msg.senderId || msg.sender) === currentUser;

                  return (
                    <div key={index} className={`chat-bubble-wrap ${isMe ? 'me' : 'admin'}`}>
                      {/* 상대방이 보낸 경우에만 위에 아이디 작게 표시 */}
                      {!isMe && (
                        <div className="sender-name">
                          {(msg.senderId || msg.sender) === "admin" ? "고객센터" : (msg.senderId || msg.sender)}
                        </div>
                      )}
                      
                      <div className={`chat-bubble ${isImage ? 'image-bubble' : ''}`}>
                        {isImage ? (
                          <img 
                            // src={`http://localhost${msg.content}`} 
                            src={`${msg.content}`} 
                            alt="전송된 이미지" 
                            // onClick={() => setSelectedImage(`http://localhost${msg.content}`)}
                            onClick={() => setSelectedImage(`${msg.content}`)}
                          />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="admin-chat-footer">
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                <button className="btn-attach" onClick={() => fileInputRef.current.click()} title="사진 첨부"><i className="far fa-image"></i></button>
                <input 
                  type="text" placeholder="메시지를 입력하세요..." value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn-send" onClick={sendMessage} disabled={!inputMessage.trim()}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </>
          )}
        </div>

        <button className="admin-chat-fab" onClick={toggleChat}>
          {isOpen ? <i className="fas fa-times"></i> : <i className="fas fa-comment-dots"></i>}
          
          {/* 플로팅 알림 뱃지 */}
          {!isOpen && totalUnreadCount > 0 && (
            <span className="fab-unread-badge">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 이미지 전체화면 모달 */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="확대된 이미지" />
          <button className="image-modal-close" onClick={() => setSelectedImage(null)}>&times;</button>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
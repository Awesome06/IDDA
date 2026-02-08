import React, { useState } from 'react';
import IddaIcon from '../../components/IconManager'; //

const AgentService = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your IDDA Agent. How can I help you link or categorize data today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // User message
    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    // Simulated AI Logic for new hires
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `I've analyzed your query about "${input}". You can find related logistics files in the 'L' section of the Dictionary.` 
      }]);
    }, 1000);
  };

  return (
    <div style={styles.agentBox}>
      <div style={styles.chatHeader}>
        <IddaIcon name="chat" size="20px" />
        <span style={{marginLeft: '10px'}}>IDDA Intelligence Agent</span>
      </div>
      <div style={styles.messageArea}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'ai' ? styles.aiMsg : styles.userMsg}>
            {msg.text}
          </div>
        ))}
      </div>
      <div style={styles.inputBar}>
        <input 
          style={styles.input} 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Agent..." 
        />
        <button onClick={handleSendMessage} style={styles.sendBtn}>Send</button>
      </div>
    </div>
  );
};

const styles = {
  agentBox: { backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', height: '400px' },
  chatHeader: { padding: '10px', background: '#2c3e50', color: '#fff', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', alignItems: 'center' },
  messageArea: { flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  aiMsg: { alignSelf: 'flex-start', background: '#f0f2f5', padding: '8px 12px', borderRadius: '12px', fontSize: '14px', maxWidth: '80%' },
  userMsg: { alignSelf: 'flex-end', background: '#3498db', color: '#fff', padding: '8px 12px', borderRadius: '12px', fontSize: '14px', maxWidth: '80%' },
  inputBar: { padding: '10px', borderTop: '1px solid #eee', display: 'flex' },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '14px' },
  sendBtn: { background: 'none', border: 'none', color: '#3498db', fontWeight: 'bold', cursor: 'pointer' }
};

export default AgentService;
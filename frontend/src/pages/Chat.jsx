import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// A component for rendering individual messages
const ChatMessage = ({ message }) => {
  const isUser = message.sender === 'user';
  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-bubble">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        {message.sql && (
          <div className="sql-query-display">
            <h4>Generated SQL:</h4>
            <pre>
              <code>{message.sql}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I'm the Intelligent Data Agent. Ask me anything about your connected database." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState('summary'); // 'summary' or 'sql'
  const messagesEndRef = useRef(null);

  const dbUrl = localStorage.getItem('dbUrl');

  // Redirect to home if no connection string is found
  useEffect(() => {
    if (!dbUrl) {
      navigate('/');
    }
  }, [dbUrl, navigate]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          connection_string: dbUrl,
          chat_mode: chatMode,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = { sender: 'ai', text: data.answer, sql: data.generated_sql };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Failed to get response from agent:", error);
      const errorMessage = { sender: 'ai', text: `Sorry, I encountered an error: ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          &larr; Dashboard
        </button>
        <h1>Chat with Data Agent</h1>
        <div style={{ flex: 1 }} /> {/* Spacer to keep title centered */}
      </header>
      <main className="chat-container">
        <div className="mode-selector-tabs">
          <button
            className={`mode-tab ${chatMode === 'summary' ? 'active' : ''}`}
            onClick={() => setChatMode('summary')}
            disabled={isLoading}
          >
            Business Mode
          </button>
          <button
            className={`mode-tab ${chatMode === 'sql' ? 'active' : ''}`}
            onClick={() => setChatMode('sql')}
            disabled={isLoading}
          >
            SQL Mode
          </button>
        </div>
        <div className="message-list">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="chat-message ai-message">
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="chat-input-area">
        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            disabled={isLoading}
          />
          <div className="chat-actions">
            <button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
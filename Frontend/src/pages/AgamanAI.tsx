import React, { useState } from 'react';
import { FaPaperPlane, FaRobot } from 'react-icons/fa';

const AgamanAI = () => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle message submission
    setMessage('');
  };

  const mockMessages = [
    {
      type: 'bot',
      content: 'Hello! I\'m Agaman AI, your coding assistant. How can I help you today?',
    },
    {
      type: 'user',
      content: 'Can you help me optimize my code?',
    },
    {
      type: 'bot',
      content: 'Of course! Please share your code snippet, and I\'ll help you identify potential improvements and optimizations.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-700 flex items-center">
          <FaRobot className="w-6 h-6 text-emerald-500 mr-2" />
          <h1 className="text-xl font-bold">Agaman AI Assistant</h1>
        </div>

        <div className="h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    msg.type === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
            <div className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about coding..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 flex items-center"
              >
                <FaPaperPlane className="w-4 h-4 mr-2" />
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgamanAI;
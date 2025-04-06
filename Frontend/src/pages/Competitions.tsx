import React from 'react';
import { FaTrophy, FaCalendarAlt, FaClock, FaUsers } from 'react-icons/fa';

const Competitions = () => {
  const competitions = [
    {
      title: 'Global Hackathon 2024',
      type: 'Hackathon',
      date: '2024-04-15',
      participants: '1000+',
      status: 'Upcoming',
      prize: '$10,000',
      description: 'Build innovative solutions for sustainable development',
    },
    {
      title: 'CodeForce Round #850',
      type: 'Competitive Programming',
      date: '2024-03-25',
      participants: '5000+',
      status: 'Live',
      duration: '2.5 hours',
      description: 'Algorithmic programming contest',
    },
    {
      title: 'UI/UX Design Challenge',
      type: 'Design',
      date: '2024-04-01',
      participants: '500+',
      status: 'Upcoming',
      prize: '$5,000',
      description: 'Create innovative user interfaces for healthcare',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Competitions & Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitions.map((competition) => (
          <div
            key={competition.title}
            className="bg-gray-800 rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{competition.title}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    competition.status === 'Live'
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-blue-500/20 text-blue-500'
                  }`}
                >
                  {competition.status}
                </span>
              </div>

              <p className="text-gray-400 mb-4">{competition.description}</p>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <FaTrophy className="w-4 h-4 mr-2 text-emerald-500" />
                  <span>{competition.type}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FaCalendarAlt className="w-4 h-4 mr-2 text-emerald-500" />
                  <span>{competition.date}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FaUsers className="w-4 h-4 mr-2 text-emerald-500" />
                  <span>{competition.participants} Participants</span>
                </div>
                {competition.duration && (
                  <div className="flex items-center text-sm">
                    <FaClock className="w-4 h-4 mr-2 text-emerald-500" />
                    <span>{competition.duration}</span>
                  </div>
                )}
              </div>

              <button className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg transition-colors">
                Register Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Competitions;
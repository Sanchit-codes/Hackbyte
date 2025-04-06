import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';

const TechNews = () => {
  const news = [
    {
      title: 'Next.js 14 Released with Improved Performance',
      source: 'Vercel Blog',
      category: 'Framework',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
      url: '#',
    },
    {
      title: 'TypeScript 5.0: What\'s New and Notable',
      source: 'Microsoft Dev Blog',
      category: 'Language',
      image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=60',
      url: '#',
    },
    {
      title: 'The Future of Web Development: 2024 Trends',
      source: 'Dev.to',
      category: 'Industry',
      image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=60',
      url: '#',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tech News & Updates</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <div
            key={item.title}
            className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-200"
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-xs rounded-full">
                  {item.category}
                </span>
                <span className="text-sm text-gray-400">{item.source}</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
              <a
                href={item.url}
                className="inline-flex items-center text-emerald-500 hover:text-emerald-400"
              >
                Read More
                <FaExternalLinkAlt className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Subscribed Topics</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'JavaScript',
            'React',
            'Node.js',
            'Python',
            'Machine Learning',
            'Web Development',
            'DevOps',
            'Cloud Computing',
          ].map((topic) => (
            <span
              key={topic}
              className="px-3 py-1 bg-gray-700 rounded-full text-sm hover:bg-gray-600 cursor-pointer transition-colors"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechNews;
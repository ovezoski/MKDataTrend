import React, { useState } from 'react';
import JobVacanciesZoomChart from './JobVacanciesZoomChart';
import JobVacanciesLineChart from './JobVacanciesLineChart';

const JobVacanciesDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'zoom' | 'line'>('line');

  return (
    <div className="mx-auto my-3 flex min-h-screen max-w-7xl flex-col items-center justify-center rounded-lg bg-white p-4 shadow-2xl">
      <h1 className="text-3xl font-extrabold text-gray-800 mt-4 mb-8">
        Преглед на занимања
      </h1>
      <div className="mb-6 flex space-x-4 rounded-lg bg-gray-100 p-2 shadow-inner">
        <button
          className={`px-6 py-2 rounded-md font-semibold transition-colors duration-200
                      ${activeTab === 'line' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('line')}
        >
          Тренд по тримесечја (Линиски график)
        </button>
        <button
          className={`px-6 py-2 rounded-md font-semibold transition-colors duration-200
                      ${activeTab === 'zoom' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('zoom')}
        >
          Преглед по занимања (Кругови)
        </button>
      </div>

      <div className="w-full">
        {activeTab === 'zoom' && <JobVacanciesZoomChart />}
        {activeTab === 'line' && <JobVacanciesLineChart />}
      </div>
    </div>
  );
};

export default JobVacanciesDashboard;
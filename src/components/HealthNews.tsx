import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Newspaper, ThermometerSun, Leaf, Wind, MapPin } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  category: 'health' | 'climate';
  summary: string;
}

export default function HealthNews() {
  const { t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string>('Your Location');

  useEffect(() => {
    // Simulate fetching localized news and climate data based on location
    const fetchNews = async () => {
      setLoading(true);
      
      try {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              // In a real app, we would reverse geocode to get the city/region name
              // and fetch targeted news.
              setLocation('Local Area');
              generateMockNews();
            },
            (error) => {
              console.warn('Geolocation denied or failed:', error);
              setLocation('National');
              generateMockNews();
            }
          );
        } else {
          setLocation('National');
          generateMockNews();
        }
      } catch (e) {
         generateMockNews();
      }
    };

    fetchNews();
  }, []);

  const generateMockNews = () => {
    // Mock data from Ministry of Health or Environmental agencies
    setTimeout(() => {
      setNews([
        {
          id: '1',
          title: 'Upcoming Vaccination Drive in Your Area',
          source: 'Ministry of Health',
          date: 'Just now',
          category: 'health',
          summary: 'A new immunization campaign against measles will begin next week. Ensure all children under 5 are vaccinated.'
        },
        {
          id: '2',
          title: 'Heatwave Warning: Precautions to Take',
          source: 'Meteorological Agency',
          date: '2 hours ago',
          category: 'climate',
          summary: 'Temperatures are expected to rise above 40°C. Stay hydrated, avoid direct sunlight during peak hours, and check on vulnerable individuals.'
        },
        {
          id: '3',
          title: 'Malaria Prevention Guidelines Updated',
          source: 'Ministry of Health',
          date: '1 day ago',
          category: 'health',
          summary: 'New guidelines for issuing insecticide-treated nets have been published following recent outbreaks in surrounding regions.'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Newspaper className="text-emerald-600" size={24} />
            Health & Climate Updates
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Latest advisories from the Ministry of Health
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 w-fit">
          <MapPin size={16} className="text-emerald-600" />
          {location}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           {[1, 2, 3].map((i) => (
             <div key={i} className="animate-pulse flex gap-4 p-4 rounded-2xl bg-slate-50">
               <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
               <div className="flex-1 space-y-3 py-1">
                 <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div className="space-y-2">
                   <div className="h-3 bg-slate-200 rounded"></div>
                   <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                 </div>
               </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((item) => (
            <div key={item.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow group flex flex-col h-full">
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${item.category === 'health' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                   {item.category === 'health' ? <Leaf size={20} /> : <ThermometerSun size={20} />}
                </div>
                <div>
                   <h4 className="font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">{item.title}</h4>
                   <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 font-medium">
                     <span className="text-emerald-700 font-semibold">{item.source}</span>
                     <span>•</span>
                     <span>{item.date}</span>
                   </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mt-2 flex-grow line-clamp-3">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

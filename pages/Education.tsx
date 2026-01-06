
import React from 'react';

const Education: React.FC = () => {
  const articles = [
    {
      title: "Understanding Fluid Limits",
      category: "Diet & Nutrition",
      image: "https://picsum.photos/seed/water/600/400",
      readTime: "5 min read",
      excerpt: "Why fluid management is crucial for renal health and tips on how to stay within your limits."
    },
    {
      title: "Home vs. In-Center Dialysis",
      category: "Care Guide",
      image: "https://picsum.photos/seed/care/600/400",
      readTime: "8 min read",
      excerpt: "Comparing the benefits and lifestyles of different dialysis modalities to find your best fit."
    },
    {
      title: "Renal Friendly Snacks",
      category: "Diet & Nutrition",
      image: "https://picsum.photos/seed/food/600/400",
      readTime: "4 min read",
      excerpt: "A list of delicious, low-potassium, and low-sodium snacks perfect for patients on dialysis."
    },
    {
      title: "Emotional Wellness and Dialysis",
      category: "Mental Health",
      image: "https://picsum.photos/seed/meditate/600/400",
      readTime: "6 min read",
      excerpt: "Managing the mental load and emotional toll of living with chronic kidney disease."
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Learning Center</h2>
        <p className="text-slate-500 dark:text-slate-400">Expert-reviewed resources for your dialysis journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {articles.map((article, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none overflow-hidden group cursor-pointer hover:shadow-xl dark:hover:border-white/10 transition-all">
             <div className="h-48 overflow-hidden relative">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4">
                   <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{article.category}</span>
                </div>
             </div>
             <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                   <span className="text-xs text-slate-400 font-medium">{article.readTime}</span>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400/30 dark:bg-sky-400/20"></div>
                   </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-sky-500 transition-colors">{article.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{article.excerpt}</p>
                <button className="flex items-center gap-2 text-sky-500 font-bold text-sm uppercase tracking-widest hover:gap-3 transition-all">
                   Read Full Story
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-sky-500 to-emerald-500 p-10 rounded-3xl text-white flex flex-col items-center text-center">
         <h3 className="text-3xl font-bold mb-4">Subscribe to Life On Dialysis Tips</h3>
         <p className="text-white/80 mb-8 max-w-lg">Get weekly updates on renal health, new recipes, and management tips delivered straight to your inbox.</p>
         <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
            <input type="email" placeholder="Enter your email" className="flex-1 px-6 py-4 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-white/50" />
            <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">Join Now</button>
         </div>
      </div>
    </div>
  );
};

export default Education;
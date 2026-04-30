import { Code, Coffee, Lightbulb, Rocket } from 'lucide-react';
import { useLanguage } from '../hooks/use-language';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

const About = () => {
  const { t } = useLanguage();

  const skills = [
    'JavaScript/TypeScript',
    'Java/Kotlin',
    'Android Studio',
    'React/Next.js',
    'Node.js',
    'Python',
    'Git/GitHub',
    'AWS/Cloud',
    'Docker',
    'MongoDB/SQL',
  ];

  const interests = [
    {
      icon: Code,
      title: t('about.interests.cleancode.title'),
      desc: t('about.interests.cleancode.desc'),
    },
    {
      icon: Lightbulb,
      title: t('about.interests.innovation.title'),
      desc: t('about.interests.innovation.desc'),
    },
    {
      icon: Rocket,
      title: t('about.interests.performance.title'),
      desc: t('about.interests.performance.desc'),
    },
    {
      icon: Coffee,
      title: t('about.interests.opensource.title'),
      desc: t('about.interests.opensource.desc'),
    },
  ];

  return (
    <section id="about" className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-gradient">{t('about.title')}</span>
          </h2>
        </div>
        <div className="flex justify-center mb-16">
          <div className="glass-card flex flex-col md:flex-row items-center md:items-center gap-8 p-8 w-full max-w-3xl shadow-2xl bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl">
            <div className="flex-shrink-0 flex justify-center items-center">
              <div className="relative group">
                <span className="absolute inset-0 rounded-2xl p-1 bg-gradient-to-tr from-blue-400 via-pink-400 to-yellow-400 blur-sm opacity-80 group-hover:opacity-100 transition-all duration-300"></span>
                <Avatar className="h-44 w-44 rounded-2xl border-4 border-transparent group-hover:scale-105 group-hover:shadow-xl transition-transform duration-300 bg-white/10 relative z-10">
                  <AvatarImage src="https://github.com/OniMock.png" alt="OniMock GitHub Avatar" className="object-cover h-full w-full rounded-2xl" />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
              <p className="text-lg font text-white mb-6">
                {t('about.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6 animate-slide-in-left">
            <h3 className="text-2xl font-semibold text-white mb-4">
              {t('about.journey')}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {t('about.journey.p1')}
            </p>
            <p className="text-gray-300 leading-relaxed">
              {t('about.journey.p2')}
            </p>
          </div>

          <div className="glass-card p-8 animate-slide-in-right">
            <h3 className="text-xl font-semibold text-white mb-6">
              {t('about.technologies')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {skills.map((skill, index) => (
                <div
                  key={skill}
                  className="bg-blue-500/10 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {interests.map((interest, index) => {
            const Icon = interest.icon;
            return (
              <div
                key={interest.title}
                className="glass-card p-6 text-center hover:bg-white/10 transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <Icon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  {interest.title}
                </h4>
                <p className="text-gray-400 text-sm">{interest.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;

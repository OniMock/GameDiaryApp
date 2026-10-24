import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { getIntlLocale } from '../../i18n/utils/routing';
import { 
  Download as DownloadIcon, 
  Cpu, 
  Settings, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Tag,
  Loader2,
  FileArchive,
  TrendingUp
} from 'lucide-react';
import { GithubIcon } from '../../shared/ui/icons/GithubIcon';

interface ReleaseData {
  version: string;
  publishedAt: string;
  codename: string;
  zipUrl: string;
  totalDownloads: number;
}

export const Download: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [release, setRelease] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all releases to compute total downloads across all versions
    fetch('https://api.github.com/repos/OniMock/GameDiary/releases')
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid releases payload');
        
        const latest = data.find((r: any) => !r.prerelease) || data[0];
        const totalDownloads = data.reduce(
          (acc: number, rel: any) => acc + (rel.assets || []).reduce((sum: number, a: any) => sum + (a.download_count || 0), 0),
          0
        );

        const nameParts = (latest.name || latest.tag_name || '').split(' - ');
        const codename = nameParts.length > 1 ? nameParts[1] : 'Stable';
        
        const zipAsset = latest.assets?.find((a: any) => a.name.endsWith('.zip'));
        const zipUrl = zipAsset ? zipAsset.browser_download_url : latest.zipball_url;

        setRelease({
          version: latest.tag_name,
          publishedAt: latest.published_at,
          codename,
          zipUrl,
          totalDownloads
        });
        setLoading(false);
      })
      .catch(err => {
        console.warn('Failed to fetch full releases list, using fallback:', err);
        Promise.all([
          fetch('https://api.github.com/repos/OniMock/GameDiary/releases/latest').then(r => r.json()).catch(() => null),
          fetch('https://img.shields.io/github/downloads/OniMock/GameDiary/total.json').then(r => r.json()).catch(() => null)
        ]).then(([latestData, shieldsData]) => {
          if (latestData && latestData.tag_name) {
            const nameParts = (latestData.name || '').split(' - ');
            const codename = nameParts.length > 1 ? nameParts[1] : 'Stable';
            const zipAsset = latestData.assets?.find((a: any) => a.name.endsWith('.zip'));
            const zipUrl = zipAsset ? zipAsset.browser_download_url : latestData.zipball_url;

            let parsedDownloads = 2500;
            if (shieldsData?.value) {
              const num = parseFloat(shieldsData.value);
              if (!isNaN(num)) {
                parsedDownloads = shieldsData.value.includes('k') ? Math.round(num * 1000) : Math.round(num);
              }
            }

            setRelease({
              version: latestData.tag_name,
              publishedAt: latestData.published_at,
              codename,
              zipUrl,
              totalDownloads: parsedDownloads
            });
          }
          setLoading(false);
        }).catch(() => setLoading(false));
      });
  }, []);

  const formattedDate = useMemo(() => {
    if (!release?.publishedAt) return '';
    try {
      const locale = getIntlLocale(currentLanguage);
      return new Date(release.publishedAt).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return new Date(release.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }, [release?.publishedAt, currentLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 animate-fade-in bg-background text-foreground">
      <div className="container mx-auto max-w-5xl">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
            {t('download.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('download.subtitle')}
          </p>
        </div>

        {/* Version & Stats Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
              <DownloadIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('download.latestVersion')}</p>
              <p className="text-2xl font-black">{release?.version}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('download.releaseDate')}</p>
              <p className="text-2xl font-black">{formattedDate}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
              <Tag size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('download.codename')}</p>
              <p className="text-2xl font-black">{release?.codename}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('download.totalDownloads') || 'Total Downloads'}</p>
              <p className="text-2xl font-black">{release?.totalDownloads ? release.totalDownloads.toLocaleString() : '2,500+'}</p>
            </div>
          </div>
        </div>

        {/* Unified Download Option */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="group relative bg-card/60 dark:bg-card/40 border border-border rounded-[2rem] p-10 hover:bg-card/80 transition-all duration-500 overflow-hidden text-center shadow-xl">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all" />
            
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-foreground text-background rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-transform">
                <FileArchive size={40} />
              </div>
              
              <div>
                <h3 className="text-3xl font-black mb-2">{t('download.package.title')}</h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  {t('download.package.desc')}
                </p>
                
                <a 
                  href={release?.zipUrl}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-primary/20 active:scale-95"
                >
                  <DownloadIcon size={24} />
                  {t('download.package.button')} {release?.version}
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-bold text-muted-foreground/70 mt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {t('download.package.appIncluded')}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {t('download.package.pluginIncluded')}
                </div>
                <a 
                  href="https://github.com/OniMock/GameDiary/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-foreground transition-colors group"
                  title="GitHub Releases & Downloads"
                >
                  <TrendingUp size={16} className="text-primary group-hover:scale-110 transition-transform" />
                  <span>{release?.totalDownloads ? `+${release.totalDownloads.toLocaleString()}` : '+2.500'} downloads</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Guide */}
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-16 shadow-sm">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center text-foreground">
              <Settings size={24} />
            </div>
            <h2 className="text-3xl font-black">{t('download.install.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* App Steps */}
            <div>
              <h4 className="text-lg font-bold text-blue-500 mb-6 flex items-center gap-2">
                <Smartphone size={20} />
                {t('download.app.title')}
              </h4>
              <div className="space-y-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold">
                      {step}
                    </div>
                    <p className="text-muted-foreground pt-1">
                      {t(`download.install.app.step${step}` as any)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plugin Steps */}
            <div>
              <h4 className="text-lg font-bold text-emerald-500 mb-6 flex items-center gap-2">
                <Cpu size={20} />
                {t('download.plugin.title')}
              </h4>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold">
                      {step}
                    </div>
                    <p className="text-muted-foreground pt-1">
                      {t(`download.install.plugin.step${step}` as any)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Requirements & Link */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-8 border-t border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h5 className="font-bold mb-1">{t('download.requirements.title')}</h5>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>{t('download.requirements.cfw')}</li>
                <li>{t('download.requirements.storage')}</li>
              </ul>
            </div>
          </div>

          <a 
            href="https://github.com/OniMock/GameDiary" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-2xl font-bold transition-all"
          >
            <GithubIcon size={20} />
            {t('download.viewOnGithub')}
          </a>
        </div>

      </div>
    </div>
  );
};

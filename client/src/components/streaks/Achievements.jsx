import { Award, Lock, CheckCircle2, Flame, Trophy, Star, Zap } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Progress from '@/components/ui/Progress';

export default function Achievements({ currentStreak = 0, longestStreak = 0, totalSolved = 0 }) {
  const milestones = [
    {
      id: 'streak-7',
      title: '7-Day Spark',
      description: 'Maintained 7 consecutive active study days',
      threshold: 7,
      type: 'streak',
      icon: Flame,
      color: 'text-amber-900 border-amber-200 bg-amber-50/80',
      iconBg: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'streak-14',
      title: '14-Day Momentum',
      description: 'Two full continuous weeks of deep study',
      threshold: 14,
      type: 'streak',
      icon: Zap,
      color: 'text-blue-900 border-blue-200 bg-blue-50/80',
      iconBg: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'streak-30',
      title: '30-Day Habit Formation',
      description: 'One full month of daily focused learning',
      threshold: 30,
      type: 'streak',
      icon: Star,
      color: 'text-purple-900 border-purple-200 bg-purple-50/80',
      iconBg: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'streak-60',
      title: '60-Day Iron Discipline',
      description: 'Two months of unwavering consistency',
      threshold: 60,
      type: 'streak',
      icon: Trophy,
      color: 'text-amber-950 border-amber-300 bg-amber-50/90',
      iconBg: 'bg-amber-200/80 text-amber-900 border-amber-300',
    },
    {
      id: 'problems-50',
      title: '50 Problems Mastered',
      description: 'Solved 50 programming challenges',
      threshold: 50,
      type: 'problems',
      icon: Award,
      color: 'text-emerald-950 border-emerald-200 bg-emerald-50/80',
      iconBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          <span>Milestones &amp; Achievement Badges</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m) => {
            const currentVal = m.type === 'streak' ? longestStreak : totalSolved;
            const isUnlocked = currentVal >= m.threshold;
            const progress = Math.min(100, Math.round((currentVal / m.threshold) * 100));
            const Icon = m.icon;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? `${m.color} shadow-sm`
                    : 'bg-surface/20 border-border/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs ${
                      isUnlocked
                        ? m.iconBg || 'bg-white border-border text-emerald-800'
                        : 'border-border bg-surface text-text-muted'
                    }`}
                  >
                    {isUnlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                    {isUnlocked ? 'Unlocked' : `${currentVal}/${m.threshold}`}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-text-primary">{m.title}</h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                {!isUnlocked && (
                  <div className="mt-3 space-y-1">
                    <Progress value={progress} className="h-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


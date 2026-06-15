import { Cpu, LucideIcon, Rocket, Sparkles } from 'lucide-react-native';

import { GradientName } from '@/shared/constants';

export interface OnboardingSlide {
  key: string;
  icon: LucideIcon;
  gradient: GradientName;
  title: string;
  subtitle: string;
}

export const SLIDES: readonly OnboardingSlide[] = [
  {
    key: 'welcome',
    icon: Sparkles,
    gradient: 'accent',
    title: 'Welcome to DevLog',
    subtitle: 'Your AI-powered engineering task tracker',
  },
  {
    key: 'ai',
    icon: Cpu,
    gradient: 'primary',
    title: 'AI that works for you',
    subtitle: 'Prioritize tasks, decompose work, detect blockers — automatically',
  },
  {
    key: 'start',
    icon: Rocket,
    gradient: 'ai',
    title: 'Ready to ship faster?',
    subtitle: 'Add your first task and let AI do the heavy lifting',
  },
] as const;

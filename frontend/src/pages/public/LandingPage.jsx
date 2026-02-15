import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Users, FileText, CreditCard, ClipboardCheck, Building2, BarChart3,
  CheckCircle, ArrowRight, Zap, Shield, Globe
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Lead Management',
    description: 'Track and manage prospective students from first contact to admission with intelligent lead scoring.',
  },
  {
    icon: FileText,
    title: 'Configurable Workflows',
    description: 'Customize registration steps for each university - documents, tests, payments, and more.',
  },
  {
    icon: ClipboardCheck,
    title: 'Online Entrance Tests',
    description: 'Built-in MCQ-based entrance testing with randomization, instant results, and analytics.',
  },
  {
    icon: CreditCard,
    title: 'Integrated Payments',
    description: 'Collect registration fees seamlessly with automatic university payouts via Razorpay.',
  },
  {
    icon: Building2,
    title: 'Multi-Tenant Platform',
    description: 'One platform, unlimited universities. Complete data isolation and customization.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track admissions, conversions, and counsellor performance with comprehensive dashboards.',
  },
];

const stats = [
  { value: '50+', label: 'Universities' },
  { value: '100K+', label: 'Students' },
  { value: '1M+', label: 'Applications' },
  { value: '99.9%', label: 'Uptime' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 dark:opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                Next-Gen Admission Platform
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                Unify Your{' '}
                <span className="text-blue-600">Admission</span>{' '}
                Process
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-xl">
                The complete SaaS platform for universities to manage leads, applications, counselling, entrance tests, and payments—all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                  onClick={() => navigate('/student/register')}
                  data-testid="hero-apply-btn"
                >
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg"
                  onClick={() => navigate('/login')}
                  data-testid="hero-login-btn"
                >
                  University Login
                </Button>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-20"></div>
              <img
                src="https://images.unsplash.com/photo-1612277107663-a65c0f67be64?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwbW9kZXJuJTIwYXJjaGl0ZWN0dXJlJTIwc3R1ZGVudHN8ZW58MHx8fHwxNzY4MzAwMzYwfDA&ixlib=rb-4.1.0&q=85"
                alt="University Campus"
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need for Modern Admissions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              A comprehensive platform designed for universities that want to streamline their admission process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Why Universities Choose UNIFY
              </h2>
              
              <div className="space-y-6">
                {[
                  { icon: CheckCircle, title: 'Zero Commission', desc: 'Keep 100% of your registration fees. We only charge a flat subscription.' },
                  { icon: Shield, title: 'Secure & Compliant', desc: 'Enterprise-grade security with complete data isolation between universities.' },
                  { icon: Globe, title: 'Scalable Infrastructure', desc: 'Handle thousands of concurrent applications without breaking a sweat.' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1653669487404-09c3617c2b6c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxkaXZlcnNlJTIwY2FtcHVzJTIwbW9kZXJuJTIwYXJjaGl0ZWN0dXJlJTIwc3R1ZGVudHN8ZW58MHx8fHwxNzY4MzAwMzYwfDA&ixlib=rb-4.1.0&q=85"
                alt="Students"
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Admission Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join leading universities already using UNIFY to streamline their admissions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8"
              onClick={() => navigate('/contact')}
              data-testid="cta-contact-btn"
            >
              Contact Sales
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-blue-700 px-8"
              onClick={() => navigate('/student/register')}
            >
              Student Registration
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

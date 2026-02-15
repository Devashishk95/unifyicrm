import { PublicLayout } from '../../components/layouts/PublicLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  Users, FileText, CreditCard, ClipboardCheck, Building2, BarChart3,
  Settings, Mail, Shield, Zap, Clock, RefreshCw, CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Lead Management',
    description: 'Track prospective students from first contact to admission with 12 predefined stages.',
    highlights: ['Auto-assignment', 'Bulk reassignment', 'Timeline tracking', 'Notes & follow-ups'],
  },
  {
    icon: Settings,
    title: 'Configurable Workflows',
    description: 'Customize the student registration process to match your university\'s requirements.',
    highlights: ['6 configurable steps', 'Enable/disable features', 'Course-wise settings', 'Document requirements'],
  },
  {
    icon: ClipboardCheck,
    title: 'Online Entrance Tests',
    description: 'Built-in MCQ-based testing system with instant results.',
    highlights: ['Question bank', 'Randomization', 'Timer-based tests', 'Automatic grading'],
  },
  {
    icon: CreditCard,
    title: 'Payment Collection',
    description: 'Collect registration fees seamlessly with Razorpay integration.',
    highlights: ['Direct payouts', 'Refund processing', 'Transaction tracking', 'Zero commission'],
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Comprehensive insights into your admission funnel.',
    highlights: ['Lead funnel', 'Conversion rates', 'Counsellor performance', 'Payment reports'],
  },
  {
    icon: Mail,
    title: 'Email Notifications',
    description: 'Automated email communications throughout the admission journey.',
    highlights: ['Welcome emails', 'Status updates', 'Payment receipts', 'Test results'],
  },
];

const additionalFeatures = [
  { icon: Building2, title: 'Multi-Tenant', desc: 'Complete data isolation' },
  { icon: Shield, title: 'Secure', desc: 'Enterprise-grade security' },
  { icon: Zap, title: 'Fast', desc: 'Optimized performance' },
  { icon: Clock, title: '24/7 Available', desc: '99.9% uptime' },
  { icon: RefreshCw, title: 'Real-time Sync', desc: 'Instant updates' },
  { icon: FileText, title: 'Document Management', desc: 'Upload & verify docs' },
];

export default function FeaturesPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-600 hover:bg-blue-100">
            Platform Features
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Everything You Need for <span className="text-blue-600">Modern Admissions</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            A complete suite of tools designed to streamline your admission process from start to finish.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                    <feature.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <Card className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                    <div className="aspect-video rounded-lg bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center">
                      <feature.icon className="h-24 w-24 text-blue-200 dark:text-blue-900" />
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
            And Much More...
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to Transform Your Admissions?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join leading universities already using UNIFY to streamline their admission process.
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Today
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}

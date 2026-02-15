import { PublicLayout } from '../../components/layouts/PublicLayout';
import { Card, CardContent } from '../../components/ui/card';
import { CheckCircle, Users, Building2, Globe, Award, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            About <span className="text-blue-600">UNIFY</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            We're on a mission to transform how universities manage their admission process, 
            making it seamless for institutions and students alike.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <Card>
              <CardContent className="p-8">
                <Target className="h-12 w-12 text-blue-600 mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Mission</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  To provide universities with a comprehensive, intelligent platform that simplifies 
                  the entire admission journey—from lead generation to enrollment. We believe technology 
                  should empower educators, not complicate their work.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8">
                <Globe className="h-12 w-12 text-blue-600 mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Vision</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  To become the leading admission management platform trusted by universities worldwide, 
                  setting the standard for efficiency, transparency, and student experience in 
                  higher education admissions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
            Why Universities Choose UNIFY
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: 'Zero Commission',
                desc: 'Unlike other platforms, we don\'t take any cut from your registration fees. You keep 100% of what you collect.'
              },
              {
                icon: Building2,
                title: 'Multi-Tenant Architecture',
                desc: 'Complete data isolation ensures your university\'s data is secure and separate from others on the platform.'
              },
              {
                icon: Users,
                title: 'Student-First Design',
                desc: 'Our application process is designed to be intuitive, reducing drop-offs and improving completion rates.'
              },
              {
                icon: Award,
                title: 'Configurable Workflows',
                desc: 'Every university is unique. Configure your registration steps exactly how you need them.'
              },
              {
                icon: Globe,
                title: 'Scalable Infrastructure',
                desc: 'Handle thousands of concurrent applications without performance issues or downtime.'
              },
              {
                icon: Target,
                title: 'Real-Time Analytics',
                desc: 'Make data-driven decisions with comprehensive dashboards and reports.'
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50+', label: 'Universities' },
              { value: '100K+', label: 'Students Enrolled' },
              { value: '1M+', label: 'Applications Processed' },
              { value: '99.9%', label: 'Platform Uptime' },
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Note */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Built by Education Enthusiasts
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Our team combines deep expertise in education technology with a passion for 
            improving the admission experience. We work closely with universities to understand 
            their challenges and build solutions that truly make a difference.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}

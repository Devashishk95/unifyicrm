import { useState } from 'react';
import { PublicLayout } from '../../components/layouts/PublicLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    inquiry_type: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Thank you! We\'ll get back to you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      organization: '',
      inquiry_type: '',
      message: ''
    });
    setLoading(false);
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Get in <span className="text-blue-600">Touch</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Have questions about UNIFY? We'd love to hear from you. Send us a message 
            and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Contact Information
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                  Reach out to us through any of the following channels. Our team is ready to assist you.
                </p>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Email Us</h3>
                      <p className="text-slate-600 dark:text-slate-400">support@unify.com</p>
                      <p className="text-slate-600 dark:text-slate-400">sales@unify.com</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Call Us</h3>
                      <p className="text-slate-600 dark:text-slate-400">+91 98765 43210</p>
                      <p className="text-sm text-slate-500">Mon-Fri 9AM-6PM IST</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Visit Us</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        123 Tech Park, Sector 5<br />
                        Bangalore, Karnataka 560001<br />
                        India
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Response Time</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        We typically respond within 24 hours on business days.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Send us a Message
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@university.edu"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organization">Organization</Label>
                        <Input
                          id="organization"
                          value={formData.organization}
                          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                          placeholder="University Name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inquiry_type">Inquiry Type</Label>
                      <Select 
                        value={formData.inquiry_type} 
                        onValueChange={(v) => setFormData({ ...formData, inquiry_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">Request a Demo</SelectItem>
                          <SelectItem value="pricing">Pricing Information</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your requirements..."
                        rows={5}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Find quick answers to common questions about UNIFY.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {[
              { q: 'How much does UNIFY cost?', a: 'We offer annual subscription plans based on your university size and requirements. Contact us for pricing.' },
              { q: 'Do you take commission on fees?', a: 'No, we don\'t take any commission. You keep 100% of the registration fees you collect.' },
              { q: 'How long does setup take?', a: 'Most universities are up and running within a week. We provide complete onboarding support.' },
              { q: 'Can I customize the workflow?', a: 'Yes, you can fully configure the registration steps, documents, tests, and fee structure.' },
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{faq.q}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

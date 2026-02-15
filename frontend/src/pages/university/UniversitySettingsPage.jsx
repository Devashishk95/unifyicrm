import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { universityAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { 
  Settings, Building2, CreditCard, Bell, Save, Image, Plus,
  Globe, Mail, Phone, MapPin, Trash2, Upload, X
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function UniversitySettingsPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  
  const [generalSettings, setGeneralSettings] = useState({
    name: '',
    code: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    about: ''
  });

  const [aboutSettings, setAboutSettings] = useState({
    about: '',
    facilities: [],
    gallery: []
  });

  const [newFacility, setNewFacility] = useState('');

  const [notificationSettings, setNotificationSettings] = useState({
    email_on_new_lead: true,
    email_on_payment: true,
    email_on_application: true,
    daily_summary: false
  });

  const [paymentSettings, setPaymentSettings] = useState({
    razorpay_enabled: false,
    razorpay_key_id: '',
    razorpay_key_secret: '',
    fee_amount: 5000
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await universityAPI.getConfig();
      const data = res.data;
      setConfig(data);
      
      setGeneralSettings({
        name: data.name || '',
        code: data.code || '',
        website: data.website || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        about: data.about || ''
      });

      setAboutSettings({
        about: data.about || '',
        facilities: data.facilities || [],
        gallery: data.gallery || []
      });
      
      if (data.config || data.registration_config) {
        const cfg = data.config || data.registration_config;
        setPaymentSettings({
          razorpay_enabled: cfg.razorpay_enabled || false,
          razorpay_key_id: cfg.razorpay_key_id || '',
          razorpay_key_secret: '',
          fee_amount: cfg.fee_amount || data.registration_config?.fee_amount || 5000
        });
        
        setNotificationSettings({
          email_on_new_lead: cfg.email_on_new_lead !== false,
          email_on_payment: cfg.email_on_payment !== false,
          email_on_application: cfg.email_on_application !== false,
          daily_summary: cfg.daily_summary || false
        });
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/university/profile`, {
        website: generalSettings.website,
        email: generalSettings.email,
        phone: generalSettings.phone,
        address: generalSettings.address
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('General settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/university/profile`, {
        about: aboutSettings.about,
        facilities: aboutSettings.facilities
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('About & Facilities saved');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addFacility = () => {
    if (!newFacility.trim()) return;
    setAboutSettings({
      ...aboutSettings,
      facilities: [...aboutSettings.facilities, newFacility.trim()]
    });
    setNewFacility('');
  };

  const removeFacility = (index) => {
    setAboutSettings({
      ...aboutSettings,
      facilities: aboutSettings.facilities.filter((_, i) => i !== index)
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        const res = await axios.post(`${API}/api/university/gallery/upload`, {
          file_name: file.name,
          file_type: file.name.split('.').pop(),
          file_data: base64Data
        }, { headers: { Authorization: `Bearer ${token}` } });

        setAboutSettings({
          ...aboutSettings,
          gallery: [...aboutSettings.gallery, res.data.image_url]
        });
        toast.success('Image uploaded');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const deleteGalleryImage = async (imageUrl) => {
    if (!confirm('Delete this image?')) return;
    
    try {
      await axios.delete(`${API}/api/university/gallery`, {
        data: { image_url: imageUrl },
        headers: { Authorization: `Bearer ${token}` }
      });
      setAboutSettings({
        ...aboutSettings,
        gallery: aboutSettings.gallery.filter(img => img !== imageUrl)
      });
      toast.success('Image deleted');
    } catch (err) {
      toast.error('Failed to delete image');
    }
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      await universityAPI.updateRegistrationConfig({
        fee_amount: paymentSettings.fee_amount,
        razorpay_enabled: paymentSettings.razorpay_enabled
      });
      toast.success('Payment settings saved');
    } catch (err) {
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      toast.success('Notification settings saved');
    } catch (err) {
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="university-settings-page">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your university configuration</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" data-testid="tab-general">
              <Building2 className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="about" data-testid="tab-about">
              <Image className="h-4 w-4 mr-2" />
              About & Gallery
            </TabsTrigger>
            <TabsTrigger value="payment" data-testid="tab-payment">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>University Information</CardTitle>
                <CardDescription>Basic contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">University Name</Label>
                    <Input id="name" value={generalSettings.name} disabled className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">University Code</Label>
                    <Input id="code" value={generalSettings.code} disabled className="bg-slate-50" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email"><Mail className="h-4 w-4 inline mr-2" />Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={generalSettings.email}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                      placeholder="admissions@university.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone"><Phone className="h-4 w-4 inline mr-2" />Phone</Label>
                    <Input
                      id="phone"
                      value={generalSettings.phone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website"><Globe className="h-4 w-4 inline mr-2" />Website</Label>
                  <Input
                    id="website"
                    value={generalSettings.website}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, website: e.target.value })}
                    placeholder="https://www.university.edu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address"><MapPin className="h-4 w-4 inline mr-2" />Address</Label>
                  <Textarea
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    placeholder="Full postal address"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About & Gallery */}
          <TabsContent value="about">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About University</CardTitle>
                  <CardDescription>This information will be shown to students on their dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="about">Description</Label>
                    <Textarea
                      id="about"
                      value={aboutSettings.about}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, about: e.target.value })}
                      placeholder="Tell students about your university, its history, achievements, and what makes it special..."
                      rows={6}
                      data-testid="about-textarea"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Facilities & Features</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                        placeholder="e.g., Library, Sports Complex, Cafeteria"
                        onKeyPress={(e) => e.key === 'Enter' && addFacility()}
                        data-testid="facility-input"
                      />
                      <Button onClick={addFacility} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aboutSettings.facilities.map((facility, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {facility}
                          <button onClick={() => removeFacility(index)} className="ml-2 hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {aboutSettings.facilities.length === 0 && (
                        <p className="text-sm text-slate-500">No facilities added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveAbout} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save About & Facilities'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Photo Gallery</CardTitle>
                  <CardDescription>Upload images of your campus to showcase to students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {aboutSettings.gallery.map((imageUrl, index) => (
                        <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border">
                          <img
                            src={`${API}${imageUrl}`}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => deleteGalleryImage(imageUrl)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-video rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        data-testid="upload-gallery-btn"
                      >
                        {uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-slate-400" />
                            <span className="text-sm text-slate-500">Upload Image</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <p className="text-sm text-slate-500">
                      Supported: JPG, PNG, WebP • Max size: 5MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Configuration</CardTitle>
                <CardDescription>Configure registration fee and payment gateway</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fee">Registration Fee Amount (₹)</Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    value={paymentSettings.fee_amount}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, fee_amount: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Razorpay Integration</h4>
                      <p className="text-sm text-slate-500">Enable online payment collection</p>
                    </div>
                    <Switch
                      checked={paymentSettings.razorpay_enabled}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, razorpay_enabled: checked })}
                    />
                  </div>

                  {paymentSettings.razorpay_enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Razorpay Key ID</Label>
                        <Input
                          value={paymentSettings.razorpay_key_id}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpay_key_id: e.target.value })}
                          placeholder="rzp_live_xxxxx"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Razorpay Key Secret</Label>
                        <Input
                          type="password"
                          value={paymentSettings.razorpay_key_secret}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpay_key_secret: e.target.value })}
                          placeholder="Enter secret key"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePayment} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Payment Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure when to receive email alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">New Lead Notifications</h4>
                      <p className="text-sm text-slate-500">Receive email when a new lead is created</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_on_new_lead}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, email_on_new_lead: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Payment Notifications</h4>
                      <p className="text-sm text-slate-500">Receive email when a payment is received</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_on_payment}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, email_on_payment: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Application Submissions</h4>
                      <p className="text-sm text-slate-500">Receive email when a student submits application</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_on_application}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, email_on_application: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Daily Summary</h4>
                      <p className="text-sm text-slate-500">Receive a daily summary of all activities</p>
                    </div>
                    <Switch
                      checked={notificationSettings.daily_summary}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, daily_summary: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

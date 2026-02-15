import { useState, useEffect } from 'react';
import { StudentLayout } from '../../components/layouts/StudentLayout';
import { studentAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  Building2, MapPin, Globe, Mail, Phone, CheckCircle, 
  Image, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

export default function InstitutionPage() {
  const [loading, setLoading] = useState(true);
  const [university, setUniversity] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadUniversityInfo();
  }, []);

  const loadUniversityInfo = async () => {
    try {
      const res = await studentAPI.getUniversityInfo();
      setUniversity(res.data);
    } catch (err) {
      console.error('Failed to load university info:', err);
    } finally {
      setLoading(false);
    }
  };

  const openGallery = (index) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

  const nextImage = () => {
    if (university?.gallery) {
      setCurrentImageIndex((prev) => (prev + 1) % university.gallery.length);
    }
  };

  const prevImage = () => {
    if (university?.gallery) {
      setCurrentImageIndex((prev) => (prev - 1 + university.gallery.length) % university.gallery.length);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentLayout>
    );
  }

  if (!university) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">University information not available</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8" data-testid="institution-page">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{university.name}</h1>
                <p className="text-blue-100">{university.code}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-6">
              {university.website && (
                <a 
                  href={university.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {university.email && (
                <a 
                  href={`mailto:${university.email}`}
                  className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {university.email}
                </a>
              )}
              {university.phone && (
                <a 
                  href={`tel:${university.phone}`}
                  className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {university.phone}
                </a>
              )}
            </div>
          </div>
          
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />
        </div>

        {/* Address */}
        {university.address && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Campus Address</h3>
                  <p className="text-slate-600 dark:text-slate-400">{university.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* About */}
        {university.about && (
          <Card>
            <CardHeader>
              <CardTitle>About the University</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                {university.about}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Facilities */}
        {university.facilities && university.facilities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campus Facilities</CardTitle>
              <CardDescription>What we offer to our students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {university.facilities.map((facility, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{facility}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Gallery */}
        {university.gallery && university.gallery.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-blue-600" />
                Campus Gallery
              </CardTitle>
              <CardDescription>Take a virtual tour of our campus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {university.gallery.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => openGallery(index)}
                    className="aspect-video rounded-lg overflow-hidden border hover:border-blue-500 transition-colors group"
                  >
                    <img
                      src={`${API}${imageUrl}`}
                      alt={`Campus ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!university.about && (!university.facilities || university.facilities.length === 0) && (!university.gallery || university.gallery.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">More Information Coming Soon</h3>
              <p className="text-slate-500">The university is updating their profile with more details about the institution.</p>
            </CardContent>
          </Card>
        )}

        {/* Lightbox Gallery Modal */}
        {galleryOpen && university.gallery && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
            <button 
              onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <button 
              onClick={prevImage}
              className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <img
              src={`${API}${university.gallery[currentImageIndex]}`}
              alt={`Campus ${currentImageIndex + 1}`}
              className="max-h-[80vh] max-w-[90vw] object-contain"
            />
            
            <button 
              onClick={nextImage}
              className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {university.gallery.length}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

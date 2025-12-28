'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAPIClient } from '@/lib/api-client';
import { AuthHeader } from '@/components/auth/auth-header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ai-elements/loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Image, Search, Heart, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface GenerationHistory {
  id: string;
  type: 'text-to-image' | 'image-to-image' | 'multi-image-composition' | 'refine-image';
  prompt: string;
  outputImages: Array<{
    url: string;
    thumbnailUrl?: string;
    width: number;
    height: number;
    publicId?: string;
    secureUrl?: string;
    format?: string;
    bytes?: number;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  tags: string[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function GalleryPage() {
  const { user } = useUser();
  const apiClient = useAPIClient();
  const [generations, setGenerations] = useState<GenerationHistory[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<GenerationHistory | null>(null);

  const fetchGenerations = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status: 'completed', // Only fetch completed images
      });

      const response = await apiClient.getGenerationHistory(page, 12, '');
      
      if (response && response.success) {
        let filteredGenerations = response.data.generations || [];
        
        // Filter out processing and non-completed images
        filteredGenerations = filteredGenerations.filter((gen: GenerationHistory) =>
          gen.status === 'completed'
        );
        
        // Apply search filter on prompt
        if (searchQuery.trim()) {
          filteredGenerations = filteredGenerations.filter((gen: GenerationHistory) =>
            gen.prompt.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        setGenerations(filteredGenerations);
        setPagination(response.data.pagination || null);
      } else {
        throw new Error(response?.message || 'Failed to fetch generations');
      }
    } catch (err) {
      console.error('Error fetching generations:', err);
      setError('Failed to load your image gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations(currentPage);
  }, [currentPage, searchQuery]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'text-to-image': 'Text to Image',
      'image-to-image': 'Image to Image',
      'multi-image-composition': 'Multi Image',
      'refine-image': 'Refine Image'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'default',
      processing: 'secondary',
      pending: 'outline',
      failed: 'destructive',
      canceled: 'secondary'
    };
    return colors[status as keyof typeof colors] || 'outline';
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AuthHeader />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Gallery</h1>
                <p className="text-muted-foreground mt-2">
                  Browse and manage your AI-generated images
                </p>
              </div>
              <Button onClick={() => fetchGenerations(currentPage)} disabled={loading} className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Search Bar */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 border-destructive">
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader />
                  <p className="mt-4 text-muted-foreground">Loading your gallery...</p>
                </div>
              </div>
            )}

            {/* Gallery Grid */}
            {!loading && (
              <>
                {generations.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {generations.map((generation) => (
                        <Card key={generation.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="relative aspect-square overflow-hidden">
                            {generation.outputImages[0] && (
                              <img
                                src={generation.outputImages[0].secureUrl || generation.outputImages[0].thumbnailUrl || generation.outputImages[0].url}
                                alt={generation.prompt.slice(0, 50) + '...'}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                                onClick={() => setSelectedImage(generation)}
                              />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setSelectedImage(generation)}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => downloadImage(
                                  generation.outputImages[0].secureUrl || generation.outputImages[0].url,
                                  `generated-${generation.id}.${generation.outputImages[0].format || 'png'}`
                                )}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                            {generation.isFavorite && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Heart className="h-3 w-3 text-white fill-current" />
                              </div>
                            )}
                            <Badge 
                              variant={getStatusColor(generation.status) as any}
                              className="absolute top-2 left-2 text-xs"
                            >
                              {generation.status}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(generation.type)}
                              </Badge>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {generation.prompt}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(generation.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.hasPrev}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.hasNext}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No images found. Start generating images to build your gallery.
                    </p>
                    <Button className="mt-4" asChild>
                      <a href="/chat">Start Creating</a>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Generated Image Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={selectedImage.outputImages[0]?.secureUrl || selectedImage.outputImages[0]?.url}
                      alt={selectedImage.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="text-sm">{getTypeLabel(selectedImage.type)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Prompt</label>
                      <p className="text-sm">{selectedImage.prompt}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge variant={getStatusColor(selectedImage.status) as any}>
                        {selectedImage.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="text-sm">{new Date(selectedImage.createdAt).toLocaleString()}</p>
                    </div>
                    {selectedImage.outputImages[0] && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
                        <p className="text-sm">
                          {selectedImage.outputImages[0].width} × {selectedImage.outputImages[0].height}
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={() => downloadImage(
                        selectedImage.outputImages[0].secureUrl || selectedImage.outputImages[0].url,
                        `generated-${selectedImage.id}.${selectedImage.outputImages[0].format || 'png'}`
                      )}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Image
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
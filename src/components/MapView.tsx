
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User } from "lucide-react";

interface Post {
  id: string;
  type: string;
  title: string;
  description: string;
  quantity: string;
  location: any;
  latitude?: number;
  longitude?: number;
  expiry_date: string;
  status: string;
  owner_name: string;
  created_at: string;
  owner_id: string;
  claimed_by?: string;
  claimed_by_name?: string;
}

interface MapViewProps {
  posts: Post[];
  onClaimPost: (postId: string) => void;
  user: any;
}

const MapView: React.FC<MapViewProps> = ({ posts, onClaimPost, user }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Center the map around the average coordinates of all posts
  const getMapCenter = () => {
    const postsWithCoords = posts.filter(post => post.latitude && post.longitude);
    if (postsWithCoords.length === 0) {
      return { lat: 40.7128, lng: -74.0060 }; // Default to NYC
    }
    
    const avgLat = postsWithCoords.reduce((sum, post) => sum + (post.latitude || 0), 0) / postsWithCoords.length;
    const avgLng = postsWithCoords.reduce((sum, post) => sum + (post.longitude || 0), 0) / postsWithCoords.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getLocationText = (location: any) => {
    if (typeof location === 'string') return location;
    if (location && location.address) return location.address;
    return "Location not specified";
  };

  const getHoursUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffInHours = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    return diffInHours;
  };

  const isExpiringSoon = (expiryDate: string) => {
    return getHoursUntilExpiry(expiryDate) <= 6 && getHoursUntilExpiry(expiryDate) > 0;
  };

  const center = getMapCenter();

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-blue-200 to-green-300">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#059669" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Map Pins */}
      <div className="absolute inset-0 p-4">
        {posts.map((post, index) => {
          const x = post.latitude ? ((post.latitude - center.lat + 0.05) / 0.1) * 100 : Math.random() * 80 + 10;
          const y = post.longitude ? ((post.longitude - center.lng + 0.05) / 0.1) * 100 : Math.random() * 80 + 10;
          
          return (
            <div
              key={post.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ 
                left: `${Math.max(5, Math.min(95, x))}%`, 
                top: `${Math.max(5, Math.min(95, y))}%` 
              }}
              onClick={() => setSelectedPost(post)}
            >
              <div className="relative">
                <MapPin 
                  className={`h-8 w-8 ${
                    post.type === 'donation' 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  } drop-shadow-lg hover:scale-110 transition-transform`}
                />
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  post.status === 'POSTED' 
                    ? 'bg-green-400' 
                    : post.status === 'CLAIMED' 
                      ? 'bg-yellow-400'
                      : post.status === 'PICKED_UP'
                        ? 'bg-blue-400'
                        : 'bg-purple-400'
                } border border-white`} />
                {isExpiringSoon(post.expiry_date) && (
                  <div className="absolute -top-2 -left-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm font-medium mb-2">Map Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span>Donations</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-600" />
            <span>Requests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <span>Claimed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
            <span>Picked Up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>Expires Soon</span>
          </div>
        </div>
      </div>

      {/* Selected Post Details */}
      {selectedPost && (
        <div className="absolute bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)]">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge 
                  variant={selectedPost.type === "donation" ? "default" : "secondary"}
                  className={selectedPost.type === "donation" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                >
                  {selectedPost.type === "donation" ? "🍎 Donation" : "🙏 Request"}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedPost(null)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <CardTitle className="text-lg">{selectedPost.title}</CardTitle>
              <CardDescription className="text-sm">{selectedPost.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {getLocationText(selectedPost.location)}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                Expires: {new Date(selectedPost.expiry_date).toLocaleDateString()}
                {isExpiringSoon(selectedPost.expiry_date) && (
                  <span className="ml-2 text-red-600 font-medium">
                    ({getHoursUntilExpiry(selectedPost.expiry_date)} hour{getHoursUntilExpiry(selectedPost.expiry_date) !== 1 ? 's' : ''} left)
                  </span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {selectedPost.owner_name} • {formatTimeAgo(selectedPost.created_at)}
              </div>
              <div className="font-semibold text-green-700">
                Quantity: {selectedPost.quantity}
              </div>
              
              {selectedPost.status === "POSTED" && (
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    onClaimPost(selectedPost.id);
                    setSelectedPost(null);
                  }}
                  disabled={selectedPost.owner_id === user?.id}
                >
                  {selectedPost.owner_id === user?.id
                    ? "Your Post" 
                    : (selectedPost.type === "donation" ? "Claim Donation" : "Offer Help")
                  }
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapView;

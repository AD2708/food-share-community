
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User } from "lucide-react";

interface Post {
  id: string;
  type: string;
  title: string;
  description: string;
  quantity: string;
  location: any;
  expiry_date: string;
  status: string;
  owner_name: string;
  created_at: string;
  owner_id: string;
  claimed_by?: string;
}

interface MapViewProps {
  posts: Post[];
  onClaimPost: (postId: string) => void;
  user: any;
}

const MapView: React.FC<MapViewProps> = ({ posts, onClaimPost, user }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const getLocationText = (location: any) => {
    if (typeof location === 'string') return location;
    if (location && location.address) return location.address;
    return "Location not specified";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffInDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  return (
    <div className="flex h-96 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Mock Map Area */}
      <div className="flex-1 bg-gradient-to-br from-green-100 to-blue-100 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Interactive Map View</p>
            <p className="text-sm text-gray-500">Click on posts below to view location</p>
          </div>
        </div>
        
        {/* Mock pins scattered around */}
        {posts.slice(0, 6).map((post, index) => (
          <div
            key={post.id}
            className={`absolute w-4 h-4 rounded-full cursor-pointer transition-all hover:scale-125 ${
              post.type === 'donation' ? 'bg-green-500' : 'bg-orange-500'
            } ${selectedPost?.id === post.id ? 'ring-4 ring-white scale-125' : ''}`}
            style={{
              top: `${20 + (index * 12)}%`,
              left: `${15 + (index * 13)}%`,
            }}
            onClick={() => setSelectedPost(post)}
          />
        ))}
      </div>

      {/* Posts List */}
      <div className="w-80 bg-gray-50 overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Nearby Posts</h3>
          <div className="space-y-3">
            {posts.slice(0, 8).map((post) => (
              <Card 
                key={post.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPost?.id === post.id ? 'ring-2 ring-green-500' : ''
                }`}
                onClick={() => setSelectedPost(post)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge 
                      variant={post.type === "donation" ? "default" : "secondary"}
                      className={post.type === "donation" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                    >
                      {post.type === "donation" ? "🍎" : "🙏"}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={
                        getDaysUntilExpiry(post.expiry_date) <= 1
                          ? "border-red-500 text-red-600"
                          : post.status === "POSTED" 
                            ? "border-green-500 text-green-600" 
                            : "border-yellow-500 text-yellow-600"
                      }
                    >
                      {getDaysUntilExpiry(post.expiry_date) <= 1 ? "Expires Soon" : post.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm">{post.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {getLocationText(post.location)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(post.created_at)}
                    </div>
                  </div>
                  
                  {post.status === "POSTED" && (
                    <Button 
                      size="sm"
                      className="w-full mt-2 bg-orange-500 hover:bg-orange-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClaimPost(post.id);
                      }}
                      disabled={post.owner_id === user?.id}
                    >
                      {post.owner_id === user?.id 
                        ? "Your Post" 
                        : (post.type === "donation" ? "Claim" : "Offer Help")
                      }
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;

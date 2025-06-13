
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StatusTimeline from './StatusTimeline';

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
  claimed_by_name?: string;
  claimed_at?: string;
  picked_up_at?: string;
  completed_at?: string;
}

interface PostCardProps {
  post: Post;
  onClaimPost: (postId: string) => void;
  onApprovePickup?: (postId: string) => void;
  onConfirmCompletion?: (postId: string) => void;
  user: any;
  expanded?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onClaimPost, 
  onApprovePickup, 
  onConfirmCompletion, 
  user, 
  expanded = false 
}) => {
  const [interactionCount, setInteractionCount] = useState(0);

  useEffect(() => {
    if (expanded) {
      fetchInteractionCount();
    }
  }, [post.id, expanded]);

  const fetchInteractionCount = async () => {
    try {
      const { count, error } = await supabase
        .from('user_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      if (error) {
        console.error('Error fetching interaction count:', error);
        return;
      }

      setInteractionCount(count || 0);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
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

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffInDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const isExpiringSoon = getDaysUntilExpiry(post.expiry_date) <= 1;
  const isOwner = post.owner_id === user?.id;
  const isClaimer = post.claimed_by === user?.id;

  const getActionButton = () => {
    if (post.status === "POSTED") {
      return (
        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600"
          onClick={() => onClaimPost(post.id)}
          disabled={isOwner}
        >
          {isOwner 
            ? "Your Post" 
            : (post.type === "donation" ? "Claim Donation" : "Offer Help")
          }
        </Button>
      );
    }

    if (post.status === "CLAIMED" && isOwner && onApprovePickup) {
      return (
        <Button 
          className="w-full bg-green-500 hover:bg-green-600"
          onClick={() => onApprovePickup(post.id)}
        >
          Approve Pickup
        </Button>
      );
    }

    if (post.status === "PICKED_UP" && (isOwner || isClaimer) && onConfirmCompletion) {
      return (
        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600"
          onClick={() => onConfirmCompletion(post.id)}
        >
          Mark as Completed
        </Button>
      );
    }

    return (
      <Button variant="outline" className="w-full" disabled>
        {post.status === "COMPLETED" ? "Completed" : post.status.replace('_', ' ')}
      </Button>
    );
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Badge 
            variant={post.type === "donation" ? "default" : "secondary"}
            className={post.type === "donation" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
          >
            {post.type === "donation" ? "🍎 Donation" : "🙏 Request"}
          </Badge>
          <div className="flex gap-2">
            {isExpiringSoon && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Expires Soon
              </Badge>
            )}
            <Badge 
              variant="outline"
              className={
                post.status === "POSTED" 
                  ? "border-green-500 text-green-600" 
                  : post.status === "CLAIMED"
                    ? "border-yellow-500 text-yellow-600"
                    : post.status === "PICKED_UP"
                      ? "border-blue-500 text-blue-600"
                      : "border-purple-500 text-purple-600"
              }
            >
              {post.status === "POSTED" ? "Available" : post.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg">{post.title}</CardTitle>
        <CardDescription>{post.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          {getLocationText(post.location)}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          Expires: {new Date(post.expiry_date).toLocaleDateString()}
          {isExpiringSoon && (
            <span className="ml-2 text-red-600 font-medium">
              ({getDaysUntilExpiry(post.expiry_date)} day{getDaysUntilExpiry(post.expiry_date) !== 1 ? 's' : ''} left)
            </span>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-2" />
          {post.owner_name} • {formatTimeAgo(post.created_at)}
        </div>
        {post.claimed_by_name && post.status !== "POSTED" && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            Claimed by: {post.claimed_by_name}
          </div>
        )}
        <div className="font-semibold text-green-700">
          Quantity: {post.quantity}
        </div>

        {expanded && (
          <StatusTimeline 
            status={post.status}
            createdAt={post.created_at}
            claimedAt={post.claimed_at}
            pickedUpAt={post.picked_up_at}
            completedAt={post.completed_at}
            interactionCount={interactionCount}
          />
        )}
      </CardContent>

      <CardFooter>
        {getActionButton()}
      </CardFooter>
    </Card>
  );
};

export default PostCard;

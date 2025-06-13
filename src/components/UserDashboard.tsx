
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, MapPin, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StatusTimeline from './StatusTimeline';
import UserProfile from './UserProfile';
import UserInteractions from './UserInteractions';

interface Post {
  id: string;
  type: string;
  title: string;
  description: string;
  quantity: string;
  location: any;
  expiry_date: string;
  status: string;
  created_at: string;
  claimed_by?: string;
  claimed_by_name?: string;
  claimed_at?: string;
  picked_up_at?: string;
  completed_at?: string;
}

interface UserDashboardProps {
  user: any;
  onClose: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onClose }) => {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'interactions' | 'profile'>('posts');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        toast({
          title: "Error loading posts",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setUserPosts(data || []);
    } catch (error) {
      console.error('Unexpected error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        toast({
          title: "Error deleting post",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post deleted successfully",
        description: "Your post has been removed.",
      });

      fetchUserPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
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

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-green-800">My Dashboard</h2>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          className={`pb-2 px-1 ${
            activeTab === 'posts'
              ? 'border-b-2 border-green-500 text-green-600 font-medium'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('posts')}
        >
          My Posts ({userPosts.length})
        </button>
        <button
          className={`pb-2 px-1 ${
            activeTab === 'interactions'
              ? 'border-b-2 border-green-500 text-green-600 font-medium'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('interactions')}
        >
          My Activity
        </button>
        <button
          className={`pb-2 px-1 ${
            activeTab === 'profile'
              ? 'border-b-2 border-green-500 text-green-600 font-medium'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>

      {/* Content */}
      {activeTab === 'posts' ? (
        loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading your posts...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">You haven't created any posts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => {
              const isExpiringSoon = getDaysUntilExpiry(post.expiry_date) <= 1;
              
              return (
                <Card key={post.id} className="bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <Badge 
                          variant={post.type === "donation" ? "default" : "secondary"}
                          className={post.type === "donation" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                        >
                          {post.type === "donation" ? "🍎 Donation" : "🙏 Request"}
                        </Badge>
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={post.status === 'COMPLETED'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                    <div className="font-semibold text-green-700">
                      Quantity: {post.quantity}
                    </div>
                    {post.claimed_by_name && post.status !== "POSTED" && (
                      <div className="text-sm text-gray-600">
                        Claimed by: {post.claimed_by_name}
                      </div>
                    )}

                    <StatusTimeline 
                      status={post.status}
                      createdAt={post.created_at}
                      claimedAt={post.claimed_at}
                      pickedUpAt={post.picked_up_at}
                      completedAt={post.completed_at}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : activeTab === 'interactions' ? (
        <UserInteractions userId={user.id} showAll={true} />
      ) : (
        <UserProfile userId={user.id} userName={userName} />
      )}
    </div>
  );
};

export default UserDashboard;

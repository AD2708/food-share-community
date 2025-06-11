
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Gift, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileProps {
  userId: string;
  userName: string;
}

interface UserStats {
  total_donations: number;
  total_requests: number;
  average_rating: number;
  total_ratings: number;
}

interface Rating {
  rating: number;
  comment: string;
  created_at: string;
  from_user_name: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, userName }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch user stats from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_donations, total_requests, average_rating, total_ratings')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching profile:', profileError);
      }

      // Fetch recent ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          rating,
          comment,
          created_at,
          profiles!ratings_from_user_id_fkey(full_name)
        `)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
      }

      setStats(profileData || {
        total_donations: 0,
        total_requests: 0,
        average_rating: 0,
        total_ratings: 0
      });

      // Transform ratings data
      const transformedRatings = ratingsData?.map(r => ({
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        from_user_name: (r.profiles as any)?.full_name || 'Anonymous'
      })) || [];

      setRatings(transformedRatings);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 30) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>{userName}</CardTitle>
              <CardDescription>Community Member</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Gift className="h-5 w-5 text-green-600 mr-1" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats?.total_donations || 0}
              </div>
              <div className="text-sm text-gray-600">Donations</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-5 w-5 text-orange-600 mr-1" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.total_requests || 0}
              </div>
              <div className="text-sm text-gray-600">Requests</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-yellow-500 mr-1" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.total_ratings || 0}
              </div>
              <div className="text-sm text-gray-600">Reviews</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Ratings */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratings.map((rating, index) => (
                <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {renderStars(rating.rating)}
                      <span className="text-sm text-gray-600">
                        by {rating.from_user_name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(rating.created_at)}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-gray-700">{rating.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;

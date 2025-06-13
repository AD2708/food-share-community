
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
  total_interactions: number;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, userName }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch user stats from posts table
      const { data: donationsData, error: donationsError } = await supabase
        .from('posts')
        .select('id')
        .eq('owner_id', userId)
        .eq('type', 'donation');

      const { data: requestsData, error: requestsError } = await supabase
        .from('posts')
        .select('id')
        .eq('owner_id', userId)
        .eq('type', 'request');

      const { data: interactionsData, error: interactionsError } = await supabase
        .from('user_interactions')
        .select('id')
        .eq('user_id', userId);

      if (donationsError || requestsError || interactionsError) {
        console.error('Error fetching user stats:', donationsError || requestsError || interactionsError);
      }

      setStats({
        total_donations: donationsData?.length || 0,
        total_requests: requestsData?.length || 0,
        total_interactions: interactionsData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Gift className="h-5 w-5 text-green-600 mr-1" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats?.total_donations || 0}
              </div>
              <div className="text-sm text-gray-600">Donations Posted</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-5 w-5 text-orange-600 mr-1" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.total_requests || 0}
              </div>
              <div className="text-sm text-gray-600">Requests Posted</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-blue-600 mr-1" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.total_interactions || 0}
              </div>
              <div className="text-sm text-gray-600">Total Interactions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about limited profile features */}
      <Card>
        <CardContent className="p-4 text-center text-gray-600">
          <p className="text-sm">Additional profile features like ratings and reviews will be available once the complete user system is implemented.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;

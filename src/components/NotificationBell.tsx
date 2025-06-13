
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationBellProps {
  user: any;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ user }) => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchInteractions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .select(`
          *,
          posts!inner(title, type, owner_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching interactions:', error);
        return;
      }

      setInteractions(data || []);
      setUnreadCount(data?.filter(interaction => interaction.status === 'pending').length || 0);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  useEffect(() => {
    fetchInteractions();
  }, [user]);

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {interactions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No activity yet
              </div>
            ) : (
              <div className="space-y-1">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      interaction.status === 'pending' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">
                            {interaction.interaction_type === 'claim' ? 'Claimed' : 'Offered Help'}
                          </h4>
                          {interaction.status === 'pending' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {interaction.posts?.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(interaction.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

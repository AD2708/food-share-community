
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CheckCircle, XCircle, Clock, Users, Heart, HandHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserInteraction {
  id: string;
  user_id: string;
  post_id: string;
  interaction_type: 'claim' | 'offer';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  message?: string;
  created_at: string;
  updated_at: string;
  posts?: {
    title: string;
    type: string;
    owner_name: string;
  };
}

interface UserInteractionsProps {
  userId: string;
  postId?: string;
  showAll?: boolean;
}

const UserInteractions: React.FC<UserInteractionsProps> = ({ 
  userId, 
  postId, 
  showAll = false 
}) => {
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInteractions();
  }, [userId, postId]);

  const fetchInteractions = async () => {
    try {
      let query = supabase
        .from('user_interactions')
        .select(`
          *,
          posts!inner(title, type, owner_name)
        `)
        .order('created_at', { ascending: false });

      if (!showAll && postId) {
        query = query.eq('post_id', postId);
      } else if (!showAll) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching interactions:', error);
        toast({
          title: "Error loading interactions",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Type assertion to ensure the data matches our interface
      const typedData = (data || []).map(item => ({
        ...item,
        interaction_type: item.interaction_type as 'claim' | 'offer',
        status: item.status as 'pending' | 'approved' | 'rejected' | 'completed'
      })) as UserInteraction[];

      setInteractions(typedData);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (interactionId: string) => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('user_interactions')
        .update({ 
          message: newMessage.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', interactionId);

      if (error) {
        toast({
          title: "Error sending message",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Message sent!",
        description: "Your message has been updated.",
      });

      setNewMessage('');
      fetchInteractions();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const updateInteractionStatus = async (interactionId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('user_interactions')
        .update({ status: newStatus })
        .eq('id', interactionId);

      if (error) {
        toast({
          title: "Error updating status",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: `Interaction ${newStatus}`,
        description: `The interaction has been ${newStatus}.`,
      });

      fetchInteractions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Separate interactions by post type
  const donationInteractions = interactions.filter(interaction => 
    interaction.posts?.type === 'donation'
  );
  
  const requestInteractions = interactions.filter(interaction => 
    interaction.posts?.type === 'request'
  );

  const renderInteractionCard = (interaction: UserInteraction) => (
    <Card key={interaction.id} className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm">
              {interaction.interaction_type === 'claim' ? 'Claimed' : 'Offered Help'}: 
              {interaction.posts && ` ${interaction.posts.title}`}
            </CardTitle>
            <CardDescription className="text-xs">
              {interaction.posts && (
                <Badge variant="outline" className="mr-2">
                  {interaction.posts.type}
                </Badge>
              )}
              {new Date(interaction.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(interaction.status)}
            <Badge className={getStatusColor(interaction.status)}>
              {interaction.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {interaction.message && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Message</span>
            </div>
            <p className="text-sm text-gray-600">{interaction.message}</p>
          </div>
        )}

        {interaction.status === 'pending' && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a message (optional)..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => sendMessage(interaction.id)}
                disabled={sendingMessage}
              >
                Update Message
              </Button>
              {showAll && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateInteractionStatus(interaction.id, 'approved')}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateInteractionStatus(interaction.id, 'rejected')}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">Loading interactions...</p>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-4">
        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No interactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All ({interactions.length})
          </TabsTrigger>
          <TabsTrigger value="donations" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Donations ({donationInteractions.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <HandHeart className="h-4 w-4" />
            Requests ({requestInteractions.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {interactions.map(renderInteractionCard)}
        </TabsContent>
        
        <TabsContent value="donations" className="space-y-4 mt-4">
          {donationInteractions.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No donation interactions yet.</p>
            </div>
          ) : (
            donationInteractions.map(renderInteractionCard)
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4 mt-4">
          {requestInteractions.length === 0 ? (
            <div className="text-center py-8">
              <HandHeart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No request interactions yet.</p>
            </div>
          ) : (
            requestInteractions.map(renderInteractionCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserInteractions;

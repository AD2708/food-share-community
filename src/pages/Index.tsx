import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin as MapIcon, List, Menu } from "lucide-react";
import PostForm from "@/components/PostForm";
import AuthDialog from "@/components/AuthDialog";
import MapView from "@/components/MapView";
import PostCard from "@/components/PostCard";
import NotificationBell from "@/components/NotificationBell";
import RatingDialog from "@/components/RatingDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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

const Index = () => {
  const [showPostForm, setShowPostForm] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'donation' | 'request'>('all');
  const [filterExpiry, setFilterExpiry] = useState<'all' | 'soon'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean;
    postId: string;
    toUserId: string;
    toUserName: string;
    isOwner: boolean;
  }>({
    open: false,
    postId: '',
    toUserId: '',
    toUserName: '',
    isOwner: false
  });
  const [showDashboard, setShowDashboard] = useState(false);
  const { toast } = useToast();

  // Initialize auth
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error loading posts",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Unexpected error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostClick = () => {
    if (user) {
      setShowPostForm(true);
    } else {
      setShowAuthDialog(true);
    }
  };

  const handleClaimPost = async (postId: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast({
          title: "Authentication required",
          description: "Please log in to claim posts.",
          variant: "destructive",
        });
        return;
      }

      // Get user's name from metadata or email
      const userName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Unknown User';

      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'CLAIMED',
          claimed_by: currentUser.id,
          claimed_by_name: userName
        })
        .eq('id', postId);

      if (error) {
        toast({
          title: "Error claiming post",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post claimed successfully!",
        description: "The owner will be notified of your interest.",
      });

      fetchPosts();
    } catch (error) {
      console.error('Error claiming post:', error);
      toast({
        title: "Unexpected error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApprovePickup = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'PICKED_UP' })
        .eq('id', postId);

      if (error) {
        toast({
          title: "Error approving pickup",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Pickup approved!",
        description: "The claimer can now pick up the item.",
      });

      fetchPosts();
    } catch (error) {
      console.error('Error approving pickup:', error);
    }
  };

  const handleConfirmCompletion = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'COMPLETED' })
        .eq('id', postId);

      if (error) {
        toast({
          title: "Error completing post",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Find the completed post to show rating dialog
      const completedPost = posts.find(p => p.id === postId);
      if (completedPost && user) {
        const isOwner = completedPost.owner_id === user.id;
        const targetUserId = isOwner ? completedPost.claimed_by : completedPost.owner_id;
        const targetUserName = isOwner ? completedPost.claimed_by_name : completedPost.owner_name;

        if (targetUserId && targetUserName) {
          setRatingDialog({
            open: true,
            postId,
            toUserId: targetUserId,
            toUserName: targetUserName,
            isOwner
          });
        }
      }

      toast({
        title: "Post completed!",
        description: "Thank you for using FoodShare!",
      });

      fetchPosts();
    } catch (error) {
      console.error('Error completing post:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "Come back soon!",
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffInDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  // Enhanced filtering
  const filteredPosts = posts.filter(post => {
    // Type filter
    if (filterType !== 'all' && post.type !== filterType) return false;
    
    // Expiry filter
    if (filterExpiry === 'soon' && getDaysUntilExpiry(post.expiry_date) > 1) return false;
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-green-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <span className="text-xl sm:text-2xl font-bold text-green-800">FoodShare</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <NotificationBell user={user} />
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDashboard(true)}
                    className="hidden lg:flex"
                  >
                    Dashboard
                  </Button>
                  <span className="text-sm text-gray-600 hidden lg:block">
                    Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowAuthDialog(true)}>
                  Login / Sign Up
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t border-green-200 pt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </span>
                    <NotificationBell user={user} />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDashboard(true)}
                    className="w-full"
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowAuthDialog(true)}
                  className="w-full"
                >
                  Login / Sign Up
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Dashboard Modal */}
      {showDashboard && user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <UserDashboard 
                user={user} 
                onClose={() => setShowDashboard(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-800 mb-4 sm:mb-6">
            Share Food, Build Community
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Connect with neighbors to donate surplus food or request meals. 
            Together, we can reduce waste and ensure everyone has access to good food.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              onClick={handlePostClick}
            >
              Donate Food
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handlePostClick}
            >
              Request Food
            </Button>
          </div>
        </div>
      </section>

      {/* Posts Feed */}
      <section className="py-6 sm:py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-green-800">Recent Posts</h2>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1 sm:flex-none"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="flex-1 sm:flex-none"
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Map
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={filterType === 'all' ? "default" : "outline"}
                className={`cursor-pointer transition-colors text-xs sm:text-sm ${
                  filterType === 'all' 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "hover:bg-green-100"
                }`}
                onClick={() => setFilterType('all')}
              >
                All Posts
              </Badge>
              <Badge 
                variant={filterType === 'donation' ? "default" : "outline"}
                className={`cursor-pointer transition-colors text-xs sm:text-sm ${
                  filterType === 'donation' 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "hover:bg-green-100"
                }`}
                onClick={() => setFilterType('donation')}
              >
                Donations
              </Badge>
              <Badge 
                variant={filterType === 'request' ? "default" : "outline"}
                className={`cursor-pointer transition-colors text-xs sm:text-sm ${
                  filterType === 'request' 
                    ? "bg-orange-600 text-white hover:bg-orange-700" 
                    : "hover:bg-orange-100"
                }`}
                onClick={() => setFilterType('request')}
              >
                Requests
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={filterExpiry === 'all' ? "default" : "outline"}
                className={`cursor-pointer transition-colors text-xs sm:text-sm ${
                  filterExpiry === 'all' 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "hover:bg-blue-100"
                }`}
                onClick={() => setFilterExpiry('all')}
              >
                All Times
              </Badge>
              <Badge 
                variant={filterExpiry === 'soon' ? "default" : "outline"}
                className={`cursor-pointer transition-colors text-xs sm:text-sm ${
                  filterExpiry === 'soon' 
                    ? "bg-red-600 text-white hover:bg-red-700" 
                    : "hover:bg-red-100"
                }`}
                onClick={() => setFilterExpiry('soon')}
              >
                Expiring Soon
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-gray-600 text-sm sm:text-base">
                {filterType === 'all' && filterExpiry === 'all'
                  ? "No posts yet. Be the first to share!" 
                  : `No posts found with current filters. Try adjusting your filters!`
                }
              </p>
            </div>
          ) : viewMode === 'map' ? (
            <div className="h-96 sm:h-[500px]">
              <MapView 
                posts={filteredPosts}
                onClaimPost={handleClaimPost}
                user={user}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClaimPost={handleClaimPost}
                  onApprovePickup={handleApprovePickup}
                  onConfirmCompletion={handleConfirmCompletion}
                  user={user}
                  expanded={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-12 sm:py-16 px-4 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-green-800 mb-8 sm:mb-12">Our Community Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">{posts.length}</div>
              <div className="text-gray-700 text-sm sm:text-base">Total Posts</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-4xl font-bold text-orange-600 mb-2">
                {posts.filter(p => p.status === 'CLAIMED').length}
              </div>
              <div className="text-gray-700 text-sm sm:text-base">Items Claimed</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-4xl font-bold text-blue-600 mb-2">
                {posts.filter(p => p.status === 'COMPLETED').length}
              </div>
              <div className="text-gray-700 text-sm sm:text-base">Completed</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">
                {posts.filter(p => p.type === 'donation').length}
              </div>
              <div className="text-gray-700 text-sm sm:text-base">Food Donations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dialogs */}
      <PostForm 
        open={showPostForm} 
        onOpenChange={setShowPostForm}
        isLoggedIn={!!user}
        currentUser={user?.user_metadata?.full_name || user?.email?.split('@')[0] || null}
        onPostCreated={fetchPosts}
      />
      
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        onLogin={() => {
          setShowAuthDialog(false);
        }}
      />

      <RatingDialog
        open={ratingDialog.open}
        onOpenChange={(open) => setRatingDialog(prev => ({ ...prev, open }))}
        postId={ratingDialog.postId}
        toUserId={ratingDialog.toUserId}
        toUserName={ratingDialog.toUserName}
        isOwner={ratingDialog.isOwner}
        onRatingSubmitted={fetchPosts}
      />
    </div>
  );
};

export default Index;

// ... keep existing code (UserDashboard component remains the same)

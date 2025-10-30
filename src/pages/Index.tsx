import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { horseService } from '@/services/horseService';
import { HorseCard } from '@/components/HorseCard';
import { CreateHorseForm } from '@/components/CreateHorseForm';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2, Zap as Horse, TrendingUp, Users, Calendar } from 'lucide-react';
import logo from '@/assets/logo.png';
import UserProfile from '@/components/UserProfile';
import { isAdmin } from '@/types/organization';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { user, organization, userRole } = useAuth();

  const { data: horses = [], isLoading, error } = useQuery({
    queryKey: ['horses', organization?.id],
    queryFn: () => horseService.getHorses(organization?.id || ''),
    enabled: !!organization?.id,
  });

  const breeds = ['all', ...new Set(horses.map(horse => horse.breed))];
  const statuses = ['all', ...new Set(horses.map(horse => horse.status))];

  const filteredHorses = horses.filter(horse => {
    const matchesSearch = horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         horse.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         horse.color.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBreed = selectedBreed === 'all' || horse.breed === selectedBreed;
    const matchesStatus = selectedStatus === 'all' || horse.status === selectedStatus;

    return matchesSearch && matchesBreed && matchesStatus;
  });

  // Calculate stats
  const availableCount = horses.filter(h => h.status === 'Available').length;
  const avgAge = horses.length > 0 ? Math.round(horses.reduce((sum, h) => sum + h.age, 0) / horses.length) : 0;
  const breedsCount = new Set(horses.map(h => h.breed)).size;

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={logo} alt="HDS Logo" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">
                  {organization?.name || 'Horse Management'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {horses.length} {horses.length === 1 ? 'horse' : 'horses'} in stable
                </p>
              </div>
            </div>

            {/* User Profile */}
            <UserProfile />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* No Organization Warning */}
        {!organization && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 md:p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">No Organization Found</h3>
              <p className="text-sm text-yellow-800">
                You need to be part of an organization to manage horses. Please contact support.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Dashboard */}
        {horses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Horse className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Horses</p>
                    <p className="text-lg md:text-2xl font-bold">{horses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Available</p>
                    <p className="text-lg md:text-2xl font-bold">{availableCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Breeds</p>
                    <p className="text-lg md:text-2xl font-bold">{breedsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Avg Age</p>
                    <p className="text-lg md:text-2xl font-bold">{avgAge}y</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search horses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Breed Filter */}
              <Select value={selectedBreed} onValueChange={setSelectedBreed}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Breeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breeds</SelectItem>
                  {breeds.filter(b => b !== 'all').map(breed => (
                    <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.filter(s => s !== 'all').map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Create Horse Button - Only for admins */}
              {isAdmin(userRole) && (
                <CreateHorseForm>
                  <Button className="gap-2 w-full md:w-auto bg-gradient-warm hover:opacity-90">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Horse</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </CreateHorseForm>
              )}
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedBreed !== 'all' || selectedStatus !== 'all') && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <span>Showing {filteredHorses.length} of {horses.length} horses</span>
                {(selectedBreed !== 'all' || selectedStatus !== 'all' || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedBreed('all');
                      setSelectedStatus('all');
                    }}
                    className="h-auto p-0 text-xs underline"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horse Grid */}
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-24">
              <Loader2 className="h-12 w-12 md:h-16 md:w-16 text-primary mb-4 animate-spin" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">Loading horses...</h3>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Horse className="h-6 w-6 md:h-8 md:w-8 text-destructive" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Error loading horses</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                There was an error loading your horses. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : filteredHorses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredHorses.map((horse, index) => (
              <div
                key={horse.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <HorseCard horse={horse} />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Horse className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">
                {horses.length === 0 ? 'No horses yet' : 'No matches found'}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                {horses.length === 0
                  ? "Get started by adding your first horse to the stable!"
                  : "Try adjusting your search or filters to find what you're looking for."
                }
              </p>
              {horses.length === 0 && isAdmin(userRole) && (
                <CreateHorseForm>
                  <Button className="gap-2 bg-gradient-warm hover:opacity-90">
                    <Plus className="h-4 w-4" />
                    Add Your First Horse
                  </Button>
                </CreateHorseForm>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;

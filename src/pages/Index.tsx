import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { horseService } from '@/services/horseService';
import { HorseCard } from '@/components/HorseCard';
import { CreateHorseForm } from '@/components/CreateHorseForm';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Zap as HorseIcon, Plus, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';
import UserProfile from '@/components/UserProfile';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const { user } = useAuth();

  const { data: horses = [], isLoading, error } = useQuery({
    queryKey: ['horses', user?.id],
    queryFn: () => horseService.getHorses(user?.id || ''),
    enabled: !!user?.id,
  });

  const breeds = [...new Set(horses.map(horse => horse.breed))];
  const statuses = [...new Set(horses.map(horse => horse.status))];

  const filteredHorses = horses.filter(horse => {
    const matchesSearch = horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         horse.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         horse.color.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBreed = !selectedBreed || horse.breed === selectedBreed;
    const matchesStatus = !selectedStatus || horse.status === selectedStatus;
    
    return matchesSearch && matchesBreed && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header with User Profile */}
      <div className="absolute top-4 right-4 z-10">
        <UserProfile />
      </div>

      {/* Hero Section */}
      <div className="relative h-64 md:h-96 overflow-hidden bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <img
              src={logo}
              alt="Horse Inventory Logo"
              className="w-48 md:w-64 lg:w-80 mx-auto"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-8 shadow-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search horses by name, breed, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filters:</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedBreed === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBreed('')}
                    className={selectedBreed === '' ? 'bg-gradient-warm' : ''}
                  >
                    All Breeds
                  </Button>
                  {breeds.map(breed => (
                    <Button
                      key={breed}
                      variant={selectedBreed === breed ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBreed(breed)}
                      className={selectedBreed === breed ? 'bg-gradient-warm' : ''}
                    >
                      {breed}
                    </Button>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedStatus === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('')}
                    className={selectedStatus === '' ? 'bg-gradient-stable' : ''}
                  >
                    All Status
                  </Button>
                  {statuses.map(status => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                      className={selectedStatus === status ? 'bg-gradient-stable' : ''}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {filteredHorses.length} {filteredHorses.length === 1 ? 'Horse' : 'Horses'} Found
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <Badge variant="secondary" className="text-xs md:text-sm">
              Total Inventory: {horses.length}
            </Badge>
            <CreateHorseForm>
              <Button variant="warm" className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create New Horse</span>
                <span className="sm:hidden">Create Horse</span>
              </Button>
            </CreateHorseForm>
          </div>
        </div>

        {/* Horse Grid */}
        {isLoading ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-16 w-16 text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-xl font-semibold mb-2">Loading horses...</h3>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HorseIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error loading horses</h3>
              <p className="text-muted-foreground text-center max-w-md">
                There was an error loading your horses. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : filteredHorses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHorses.map(horse => (
              <div key={horse.id} className="animate-fade-in">
                <HorseCard horse={horse} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HorseIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No horses found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {horses.length === 0 
                  ? "You haven't added any horses yet. Create your first horse to get started!"
                  : "Try adjusting your search terms or filters to find the horses you're looking for."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;

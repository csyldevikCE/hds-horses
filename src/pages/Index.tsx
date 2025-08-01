import { useState } from 'react';
import { sampleHorses } from '@/data/sampleHorses';
import { HorseCard } from '@/components/HorseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Zap as HorseIcon } from 'lucide-react';
import heroImage from '@/assets/hero-horse.jpg';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const breeds = [...new Set(sampleHorses.map(horse => horse.breed))];
  const statuses = [...new Set(sampleHorses.map(horse => horse.status))];

  const filteredHorses = sampleHorses.filter(horse => {
    const matchesSearch = horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         horse.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         horse.color.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBreed = !selectedBreed || horse.breed === selectedBreed;
    const matchesStatus = !selectedStatus || horse.status === selectedStatus;
    
    return matchesSearch && matchesBreed && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={heroImage}
          alt="Horse Inventory"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HorseIcon className="h-12 w-12" />
              <h1 className="text-5xl font-bold">Horse Inventory</h1>
            </div>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Manage your equine collection with detailed profiles, sales materials, and comprehensive information
            </p>
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {filteredHorses.length} {filteredHorses.length === 1 ? 'Horse' : 'Horses'} Found
          </h2>
          <Badge variant="secondary" className="text-sm">
            Total Inventory: {sampleHorses.length}
          </Badge>
        </div>

        {/* Horse Grid */}
        {filteredHorses.length > 0 ? (
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
                Try adjusting your search terms or filters to find the horses you're looking for.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;

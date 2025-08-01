import { Horse } from '@/types/horse';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HorseCardProps {
  horse: Horse;
}

export const HorseCard = ({ horse }: HorseCardProps) => {
  const navigate = useNavigate();
  const primaryImage = horse.images.find(img => img.isPrimary) || horse.images[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-stable-green text-cream';
      case 'Sold': return 'bg-destructive';
      case 'Reserved': return 'bg-hay-gold text-horse-brown';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="group overflow-hidden shadow-card hover:shadow-warm transition-all duration-300 hover:-translate-y-1 bg-card border-border">
      <div className="relative overflow-hidden">
        <img
          src={primaryImage?.url}
          alt={horse.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <Badge className={getStatusColor(horse.status)}>
            {horse.status}
          </Badge>
        </div>
        {horse.price && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-background/90 text-foreground">
              ${horse.price.toLocaleString()}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">{horse.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{horse.breed}</span>
            <span>•</span>
            <span>{horse.age} years</span>
            <span>•</span>
            <span>{horse.gender}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Color:</span>
            <span className="font-medium">{horse.color}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Height:</span>
            <span className="font-medium">{horse.height}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {horse.description}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => navigate(`/horse/${horse.id}`)}
          className="w-full bg-gradient-warm hover:opacity-90 transition-opacity"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
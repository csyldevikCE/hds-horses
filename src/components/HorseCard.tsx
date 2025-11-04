import { Horse } from '@/types/horse';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Calendar, Ruler, DollarSign, ChevronRight } from 'lucide-react';

interface HorseCardProps {
  horse: Horse;
}

export const HorseCard = ({ horse }: HorseCardProps) => {
  const navigate = useNavigate();
  const primaryImage = horse.images.find(img => img.isPrimary) || horse.images[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'Sold': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
      case 'Reserved': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'Not for Sale': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <Card
      className="group overflow-hidden border hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/50 bg-card"
      onClick={() => navigate(`/horse/${horse.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={horse.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl">🐎</div>
          </div>
        )}

        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getStatusColor(horse.status)} backdrop-blur-sm`}>
            {horse.status}
          </Badge>
        </div>

        {/* Price Badge */}
        {horse.price && (
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge className="bg-white/90 text-foreground backdrop-blur-sm flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {horse.price.toLocaleString()}
            </Badge>
          </div>
        )}

        {/* View Details Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <span className="font-medium text-sm">View Details</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        {/* Name */}
        <div>
          <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {horse.name}
          </h3>
          <p className="text-sm text-muted-foreground">{horse.breed}</p>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{horse.age} years</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Ruler className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{horse.height} cm</span>
          </div>
        </div>

        {/* Gender & Color */}
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="font-normal">
            {horse.gender}
          </Badge>
          <Badge variant="outline" className="font-normal">
            {horse.color}
          </Badge>
        </div>

        {/* Description */}
        {horse.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {horse.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
